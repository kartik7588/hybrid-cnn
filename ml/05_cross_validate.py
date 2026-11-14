import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import make_scorer, recall_score

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
# X_test and y_test are NOT used anywhere below.

# ---- The three models, each with its scaler inside the pipeline ----
models = {
    "Logistic Regression": Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", LogisticRegression(max_iter=1000))]),
    "SVM": Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", CalibratedClassifierCV(SVC(kernel="rbf"), ensemble=False))]),
    "MLP": Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", MLPClassifier(hidden_layer_sizes=(32, 16),
                                     max_iter=2000, random_state=42))]),
}

# ---- 5-fold cross-validation on the training data only ----
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scoring = {
    "accuracy": "accuracy",
    "sensitivity": "recall",
    "specificity": make_scorer(recall_score, pos_label=0),
    "precision": "precision",
    "roc_auc": "roc_auc",
}

print("5-fold cross-validation on", len(X_train), "training patients")
print("(mean +/- spread across the 5 folds)\n")
for name, model in models.items():
    r = cross_validate(model, X_train, y_train, cv=cv, scoring=scoring)
    print(name)
    for metric in scoring:
        scores = r["test_" + metric]
        print(f"  {metric:<12} {scores.mean():.3f} +/- {scores.std():.3f}")
    print()
