import json
from itertools import combinations
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.calibration import CalibratedClassifierCV
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix
from sklearn.model_selection import StratifiedKFold, cross_val_predict, train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

TARGET_SENSITIVITY = 0.97          # share of cancers we want to catch (set in advance)
MODEL_DIR = Path("ml/models")
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# ---- 1. Load data and make the SAME split as every earlier script ----
measurements = ["radius", "texture", "perimeter", "area", "smoothness",
                "compactness", "concavity", "concave_points", "symmetry",
                "fractal_dimension"]
columns = ["id", "diagnosis"] + [
    f"{m}_{group}" for group in ["mean", "se", "worst"] for m in measurements
]
df = pd.read_csv("src/data/wdbc.data", header=None, names=columns)
X = df.drop(columns=["id", "diagnosis"])
y = (df["diagnosis"] == "M").astype(int)          # malignant = 1
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)
# X_test and y_test are NOT used anywhere in this script.

# ---- 2. The three models, with the tuned settings ----
MODELS = {
    "logistic_regression": {
        "display_name": "Logistic Regression",
        "pipeline": Pipeline([
            ("scaler", StandardScaler()),
            ("classifier", LogisticRegression(C=1, max_iter=2000))]),
    },
    "svm": {
        "display_name": "SVM",
        "pipeline": Pipeline([
            ("scaler", StandardScaler()),
            ("classifier", CalibratedClassifierCV(
                SVC(kernel="rbf", C=100, gamma=0.001), ensemble=False))]),
    },
    "mlp": {
        "display_name": "MLP",
        "pipeline": Pipeline([
            ("scaler", StandardScaler()),
            ("classifier", MLPClassifier(hidden_layer_sizes=(16,), alpha=0.0001,
                                         max_iter=2000, random_state=42))]),
    },
}

# ---- 3. Cutoff rule: highest cutoff that still catches >= target of cancers ----
thresholds = [round(t, 2) for t in np.arange(0.05, 0.96, 0.05)]

def choose_cutoff(y_true, probs):
    chosen = None
    for t in thresholds:
        pred = (probs >= t).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_true, pred).ravel()
        sens, spec = tp / (tp + fn), tn / (tn + fp)
        if sens >= TARGET_SENSITIVITY:
            chosen = (t, int(fn), int(fp), float(sens), float(spec), True)
    if chosen is None:   # nothing reached the target: fall back to the lowest cutoff
        t = thresholds[0]
        pred = (probs >= t).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_true, pred).ravel()
        chosen = (t, int(fn), int(fp), float(tp / (tp + fn)), float(tn / (tn + fp)), False)
    return chosen

def describe(entry):
    t, fn, fp, sens, spec, reached = entry
    note = "" if reached else "  (WARNING: target not reached)"
    return (f"cutoff {t:.2f} | missed {fn} | false alarms {fp} | "
            f"sensitivity {sens:.3f} | specificity {spec:.3f}{note}")

# ---- 4. Cross-validated probabilities on the TRAINING set only ----
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_probs = {}
for key, spec in MODELS.items():
    cv_probs[key] = cross_val_predict(spec["pipeline"], X_train, y_train,
                                      cv=cv, method="predict_proba")[:, 1]

metadata = {
    "task": "benign vs malignant classification on WDBC (30 numeric features)",
    "positive_class": "malignant",
    "class_mapping": {"0": "benign", "1": "malignant"},
    "feature_names": list(X.columns),
    "split": {"test_size": 0.2, "stratified": True, "random_state": 42,
              "n_train": int(len(X_train)), "n_test": int(len(X_test))},
    "cutoff_rule": (f"highest cutoff on a 0.05 grid whose cross-validated training "
                    f"sensitivity is >= {TARGET_SENSITIVITY}"),
    "target_sensitivity": TARGET_SENSITIVITY,
    "sklearn_version": sklearn.__version__,
    "models": {},
    "pairs": {},
}

# ---- 5. Single models: choose cutoff, train on all training data, save ----
print("SINGLE MODELS (cutoffs chosen from cross-validated training predictions)")
for key, spec in MODELS.items():
    entry = choose_cutoff(y_train, cv_probs[key])
    print(f"  {spec['display_name']:<20} {describe(entry)}")
    spec["pipeline"].fit(X_train, y_train)
    filename = f"{key}.joblib"
    joblib.dump(spec["pipeline"], MODEL_DIR / filename)
    metadata["models"][key] = {
        "display_name": spec["display_name"],
        "file": filename,
        "cutoff": entry[0],
        "cv_missed_cancers": entry[1],
        "cv_false_alarms": entry[2],
        "cv_sensitivity": entry[3],
        "cv_specificity": entry[4],
        "reached_target": entry[5],
    }

# ---- 6. Pairs: average the two models' malignant probabilities ----
print("\nPAIRS (average of two models' probabilities, own cutoff per pair)")
for a, b in combinations(MODELS.keys(), 2):
    pair_probs = (cv_probs[a] + cv_probs[b]) / 2
    entry = choose_cutoff(y_train, pair_probs)
    label = f"{MODELS[a]['display_name']} + {MODELS[b]['display_name']}"
    print(f"  {label:<28} {describe(entry)}")
    metadata["pairs"][f"{a}+{b}"] = {
        "members": [a, b],
        "combine": "average of the two models' malignant probabilities",
        "cutoff": entry[0],
        "cv_missed_cancers": entry[1],
        "cv_false_alarms": entry[2],
        "cv_sensitivity": entry[3],
        "cv_specificity": entry[4],
        "reached_target": entry[5],
    }

with open(MODEL_DIR / "metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

print("\nSaved to", MODEL_DIR)
for p in sorted(MODEL_DIR.iterdir()):
    print(f"  {p.name:<28} {p.stat().st_size / 1024:.1f} KB")
