"""Load the saved models and predict with one model or a combination of two.

Used by the one-time test evaluation now, and by the API server later.
"""
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

MODEL_DIR = Path(__file__).resolve().parent / "models"


def load_artifacts():
    """Return (models, metadata) from ml/models/."""
    with open(MODEL_DIR / "metadata.json") as f:
        meta = json.load(f)
    models = {key: joblib.load(MODEL_DIR / info["file"])
              for key, info in meta["models"].items()}
    return models, meta


def _prepare(X, meta):
    """Check that every required feature is present and put them in the trained order."""
    if not isinstance(X, pd.DataFrame):
        raise ValueError("X must be a pandas DataFrame with named feature columns.")
    missing = [c for c in meta["feature_names"] if c not in X.columns]
    if missing:
        raise ValueError(f"Missing feature columns: {missing}")
    X = X[meta["feature_names"]]
    if X.isna().any().any():
        raise ValueError("X contains missing values.")
    return X


def predict(X, selected, models, meta):
    """Predict with one model or the combination of exactly two.

    selected: list of 1 or 2 model keys, e.g. ["svm"] or ["logistic_regression", "mlp"].
    Returns a dict with each model's own result and, for two models, the combined result.
    Predictions are 1 = malignant, 0 = benign.
    """
    if len(selected) not in (1, 2) or len(set(selected)) != len(selected):
        raise ValueError("Select one model, or two different models.")
    for key in selected:
        if key not in models:
            raise ValueError(f"Unknown model '{key}'. Available: {list(models)}")

    X = _prepare(X, meta)
    individual = {}
    for key in selected:
        probs = models[key].predict_proba(X)[:, 1]          # chance of malignant
        cutoff = meta["models"][key]["cutoff"]
        individual[key] = {"probability": probs, "cutoff": cutoff,
                           "prediction": (probs >= cutoff).astype(int)}

    if len(selected) == 1:
        return {"selected": selected, "individual": individual,
                "combined": individual[selected[0]]}

    a, b = selected
    pair_key = f"{a}+{b}" if f"{a}+{b}" in meta["pairs"] else f"{b}+{a}"
    cutoff = meta["pairs"][pair_key]["cutoff"]
    probs = np.mean([individual[a]["probability"], individual[b]["probability"]], axis=0)
    combined = {"probability": probs, "cutoff": cutoff,
                "prediction": (probs >= cutoff).astype(int)}
    return {"selected": selected, "individual": individual, "combined": combined}
