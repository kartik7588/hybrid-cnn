import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import confusion_matrix, roc_auc_score

# ---- 1. Load the data ----
measurements = ["radius", "texture", "perimeter", "area", "smoothness",
                "compactness", "concavity", "concave_points", "symmetry",
                "fractal_dimension"]
columns = ["id", "diagnosis"] + [
    f"{m}_{group}" for group in ["mean", "se", "worst"] for m in measurements
]
df = pd.read_csv("src/data/wdbc.data", header=None, names=columns)

# ---- 2. X and y (malignant = 1) ----
X = df.drop(columns=["id", "diagnosis"])
y = (df["diagnosis"] == "M").astype(int)

# ---- 3. Same split as the other models, so the comparison is fair ----
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)
print("Training patients:", len(X_train), "| Test patients:", len(X_test))

# ---- 4. Pipeline: scale, then MLP (two hidden layers: 32 and 16 units) ----
model = Pipeline([
    ("scaler", StandardScaler()),
    ("classifier", MLPClassifier(hidden_layer_sizes=(32, 16),
                                 max_iter=2000, random_state=42)),
])
model.fit(X_train, y_train)

# ---- 5. Predict on unseen patients ----
predictions = model.predict(X_test)
probabilities = model.predict_proba(X_test)[:, 1]

# ---- 6. Measure honestly ----
tn, fp, fn, tp = confusion_matrix(y_test, predictions).ravel()
print()
print("MLP results")
print(f"  Correctly said benign (TN):      {tn}")
print(f"  Wrongly said malignant (FP):     {fp}")
print(f"  Missed a cancer (FN):            {fn}")
print(f"  Correctly said malignant (TP):   {tp}")
print()
print(f"Accuracy:      {(tp + tn) / (tp + tn + fp + fn):.3f}")
print(f"Sensitivity:   {tp / (tp + fn):.3f}  <- cancers caught")
print(f"Specificity:   {tn / (tn + fp):.3f}")
print(f"Precision:     {tp / (tp + fp):.3f}")
print(f"ROC-AUC:       {roc_auc_score(y_test, probabilities):.3f}")
