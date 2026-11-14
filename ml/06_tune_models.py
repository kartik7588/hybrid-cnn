import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.neural_network import MLPClassifier

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

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

# ---- Each model with the settings we want to try ----
searches = {
    "Logistic Regression": (
        Pipeline([("scaler", StandardScaler()),
                  ("classifier", LogisticRegression(max_iter=2000))]),
        {"classifier__C": [0.01, 0.1, 1, 10, 100]},
    ),
    "SVM": (
        Pipeline([("scaler", StandardScaler()),
                  ("classifier", CalibratedClassifierCV(SVC(kernel="rbf"), ensemble=False))]),
        {"classifier__estimator__C": [0.1, 1, 10, 100],
         "classifier__estimator__gamma": ["scale", 0.001, 0.01, 0.1]},
    ),
    "MLP": (
        Pipeline([("scaler", StandardScaler()),
                  ("classifier", MLPClassifier(max_iter=2000, random_state=42))]),
        {"classifier__hidden_layer_sizes": [(16,), (32, 16), (64, 32)],
         "classifier__alpha": [0.0001, 0.001, 0.01]},
    ),
}

print("Tuning on", len(X_train), "training patients (5-fold CV, scored by ROC-AUC)\n")
for name, (pipeline, grid) in searches.items():
    search = GridSearchCV(pipeline, grid, cv=cv, scoring="roc_auc", n_jobs=-1)
    search.fit(X_train, y_train)
    print(name)
    print("  Best settings:", search.best_params_)
    print(f"  Best CV ROC-AUC: {search.best_score_:.4f}")
    # How much did tuning change things? Compare to the 3 worst settings.
    results = pd.DataFrame(search.cv_results_).sort_values("rank_test_score")
    print(f"  Range across all tried settings: "
          f"{results['mean_test_score'].min():.4f} to {results['mean_test_score'].max():.4f}")
    print()
