import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import confusion_matrix

TARGET_SENSITIVITY = 0.97   # share of cancers we want to catch (set in advance)

# ---- Load data and make the SAME split as before ----
measurements = ["radius", "texture", "perimeter", "area", "smoothness",
                "compactness", "concavity", "concave_points", "symmetry",
                "fractal_dimension"]
columns = ["id", "diagnosis"] + [
    f"{m}_{group}" for group in ["mean", "se", "worst"] for m in measurements
]
df = pd.read_csv("src/data/wdbc.data", header=None, names=columns)
X = df.drop(columns=["id", "diagnosis"])
y = (df["diagnosis"] == "M").astype(int)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)
# X_test and y_test are NOT used anywhere in this script.

# ---- The three models, with the tuned settings ----
models = {
    "Logistic Regression": Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", LogisticRegression(C=1, max_iter=2000))]),
    "SVM": Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", CalibratedClassifierCV(
            SVC(kernel="rbf", C=100, gamma=0.001), ensemble=False))]),
    "MLP": Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", MLPClassifier(hidden_layer_sizes=(16,), alpha=0.0001,
                                     max_iter=2000, random_state=42))]),
}

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
thresholds = [round(t, 2) for t in np.arange(0.05, 0.96, 0.05)]
n_malignant = int(y_train.sum())
n_benign = int(len(y_train) - n_malignant)
print(f"Training patients: {len(y_train)} ({n_malignant} malignant, {n_benign} benign)")
print(f"Target: catch at least {TARGET_SENSITIVITY:.0%} of cancers\n")

for name, model in models.items():
    # Each patient's probability comes from a model that never saw that patient.
    probs = cross_val_predict(model, X_train, y_train, cv=cv,
                              method="predict_proba")[:, 1]
    print(name)
    print("  cutoff   missed cancers   false alarms   sensitivity   specificity")
    chosen = None
    for t in thresholds:
        pred = (probs >= t).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_train, pred).ravel()
        sens = tp / (tp + fn)
        spec = tn / (tn + fp)
        print(f"  {t:<8.2f} {fn:<16} {fp:<14} {sens:<13.3f} {spec:.3f}")
        if sens >= TARGET_SENSITIVITY:
            chosen = (t, fn, fp, sens, spec)   # keeps the highest cutoff that qualifies
    if chosen:
        t, fn, fp, sens, spec = chosen
        print(f"  --> Chosen cutoff: {t:.2f}  "
              f"(missed {fn}, false alarms {fp}, sensitivity {sens:.3f}, specificity {spec:.3f})")
    else:
        print("  --> No cutoff reached the target sensitivity.")
    print()
