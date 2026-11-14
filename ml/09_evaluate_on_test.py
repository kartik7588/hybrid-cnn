"""ONE-TIME final evaluation on the held-out test set.

Run this once. Do not change models, settings or cutoffs after seeing the result,
or the test set stops being an honest exam.
"""
import json
import sys
from itertools import combinations

sys.dont_write_bytecode = True          # keeps ml/__pycache__ out of git status
import pandas as pd
from sklearn.metrics import confusion_matrix, roc_auc_score
from sklearn.model_selection import train_test_split

from combine import load_artifacts, predict

# ---- Same data and split as every earlier script ----
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

models, meta = load_artifacts()
assert len(X_test) == meta["split"]["n_test"], "Split does not match the saved models"
print(f"Test patients: {len(X_test)} ({int(y_test.sum())} malignant, "
      f"{int(len(y_test) - y_test.sum())} benign)")
print(f"scikit-learn version when models were saved: {meta['sklearn_version']}\n")


def score(probs, cutoff):
    pred = (probs >= cutoff).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_test, pred).ravel()
    return {
        "cutoff": cutoff, "missed_cancers": int(fn), "false_alarms": int(fp),
        "sensitivity": tp / (tp + fn), "specificity": tn / (tn + fp),
        "precision": tp / (tp + fp) if (tp + fp) else float("nan"),
        "accuracy": (tp + tn) / (tp + tn + fp + fn),
        "roc_auc": roc_auc_score(y_test, probs),
    }


def label(selected):
    return " + ".join(meta["models"][k]["display_name"] for k in selected)


rows = []
keys = list(models.keys())
for selected in [[k] for k in keys] + [list(p) for p in combinations(keys, 2)]:
    result = predict(X_test, selected, models, meta)
    probs = result["combined"]["probability"]
    chosen = score(probs, result["combined"]["cutoff"])
    default = score(probs, 0.5)
    rows.append({"name": label(selected), "selected": selected,
                 "chosen_cutoff": chosen, "default_cutoff_0.5": default})

header = f"{'Model':<28}{'cutoff':>7}{'missed':>8}{'false':>7}{'sens':>7}{'spec':>7}{'prec':>7}{'acc':>7}{'AUC':>7}"
print("At each model's chosen cutoff (set from training data only)")
print(header)
for r in rows:
    s = r["chosen_cutoff"]
    print(f"{r['name']:<28}{s['cutoff']:>7.2f}{s['missed_cancers']:>8}{s['false_alarms']:>7}"
          f"{s['sensitivity']:>7.3f}{s['specificity']:>7.3f}{s['precision']:>7.3f}"
          f"{s['accuracy']:>7.3f}{s['roc_auc']:>7.3f}")

print("\nFor comparison, at the default 0.50 cutoff")
print(header)
for r in rows:
    s = r["default_cutoff_0.5"]
    print(f"{r['name']:<28}{s['cutoff']:>7.2f}{s['missed_cancers']:>8}{s['false_alarms']:>7}"
          f"{s['sensitivity']:>7.3f}{s['specificity']:>7.3f}{s['precision']:>7.3f}"
          f"{s['accuracy']:>7.3f}{s['roc_auc']:>7.3f}")

with open("ml/models/test_results.json", "w") as f:
    json.dump({"n_test": int(len(X_test)), "results": rows}, f, indent=2, default=float)
print("\nSaved ml/models/test_results.json")
