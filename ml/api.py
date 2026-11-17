"""Prediction API for the breast cancer classification prototype.

Run from the project root:   python ml/api.py
Then open:                   http://127.0.0.1:5000/api/health
"""
import json
import math
import sys

sys.dont_write_bytecode = True          # keeps ml/__pycache__ out of git status
import pandas as pd
import sklearn
from flask import Flask, jsonify, request

from combine import MODEL_DIR, load_artifacts, predict

MAX_RECORDS = 5000
DISCLAIMER = ("Academic research prototype trained on the WDBC dataset (numeric cell-nucleus "
              "measurements). Not validated for clinical use and not a diagnosis.")
LABELS = {0: "benign", 1: "malignant"}

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024      # 10 MB, same limit as the website

# Models are loaded ONCE when the server starts. Predicting never retrains anything.
models, meta = load_artifacts()
FEATURES = meta["feature_names"]
version_match = sklearn.__version__ == meta["sklearn_version"]
if not version_match:
    print(f"WARNING: models were saved with scikit-learn {meta['sklearn_version']} "
          f"but this is {sklearn.__version__}. Results may differ or loading may fail.")


def error(message, status=400, details=None):
    body = {"error": message}
    if details:
        body["details"] = details
    return jsonify(body), status


@app.errorhandler(404)
def not_found(_):
    return error("Not found.", 404)


@app.errorhandler(405)
def method_not_allowed(_):
    return error("Method not allowed.", 405)


@app.errorhandler(413)
def too_large(_):
    return error("Request is too large (limit 10 MB).", 413)


@app.errorhandler(500)
def server_error(_):
    return error("Internal server error.", 500)


def to_number(value):
    """Accept numbers or numeric strings (CSV values); reject booleans, NaN and infinity."""
    if isinstance(value, bool):
        raise ValueError("must be a number")
    try:
        x = float(value)
    except (TypeError, ValueError):
        raise ValueError("must be a number")
    if not math.isfinite(x):
        raise ValueError("must be a finite number")
    return x


@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "models_loaded": list(models),
        "sklearn_runtime": sklearn.__version__,
        "sklearn_saved_with": meta["sklearn_version"],
        "version_match": version_match,
    })


@app.get("/api/models")
def list_models():
    return jsonify({
        "positive_class": meta["positive_class"],
        "features": FEATURES,
        "models": [{"key": k, "name": v["display_name"], "cutoff": v["cutoff"]}
                   for k, v in meta["models"].items()],
        "pairs": [{"key": k, "members": v["members"],
                   "names": [meta["models"][m]["display_name"] for m in v["members"]],
                   "cutoff": v["cutoff"]}
                  for k, v in meta["pairs"].items()],
        "max_records": MAX_RECORDS,
        "disclaimer": DISCLAIMER,
    })


@app.get("/api/metrics")
def metrics():
    """Real, measured results from the one-time test-set evaluation."""
    path = MODEL_DIR / "test_results.json"
    if not path.exists():
        return error("No evaluation results found. Run ml/09_evaluate_on_test.py first.", 404)
    with open(path) as f:
        data = json.load(f)
    return jsonify({"evaluation": "held-out test set", **data, "disclaimer": DISCLAIMER})


@app.post("/api/predict")
def predict_route():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return error("Request body must be JSON with 'models' and 'records'.")

    selected, records = body.get("models"), body.get("records")
    if (not isinstance(selected, list) or len(selected) not in (1, 2)
            or not all(isinstance(m, str) for m in selected)
            or len(set(selected)) != len(selected)):
        return error("'models' must be a list of one model, or two different models.",
                     details=[f"available models: {list(models)}"])
    unknown = [m for m in selected if m not in models]
    if unknown:
        return error(f"Unknown model(s): {unknown}",
                     details=[f"available models: {list(models)}"])
    if not isinstance(records, list) or not records:
        return error("'records' must be a non-empty list of objects.")
    if len(records) > MAX_RECORDS:
        return error(f"Too many records ({len(records)}). The limit is {MAX_RECORDS}.")

    # Validate every record before predicting anything.
    rows, problems = [], []
    for i, rec in enumerate(records):
        if not isinstance(rec, dict):
            problems.append(f"record {i}: must be an object of feature values")
        else:
            missing = [f for f in FEATURES if f not in rec]
            if missing:
                more = " ..." if len(missing) > 5 else ""
                problems.append(f"record {i}: missing features {missing[:5]}{more}")
            else:
                row = {}
                for f in FEATURES:
                    try:
                        row[f] = to_number(rec[f])
                    except ValueError as e:
                        problems.append(f"record {i}: '{f}' {e}")
                if len(row) == len(FEATURES):
                    rows.append(row)
        if len(problems) >= 10:
            break
    if problems:
        return error("Invalid input.", details=problems)

    X = pd.DataFrame(rows, columns=FEATURES)
    try:
        result = predict(X, selected, models, meta)
    except ValueError as e:
        return error(str(e))

    combined, is_pair = result["combined"], len(selected) == 2
    results = []
    for i in range(len(X)):
        item = {
            "index": i,
            "probability": round(float(combined["probability"][i]), 4),
            "cutoff": combined["cutoff"],
            "prediction": LABELS[int(combined["prediction"][i])],
        }
        if is_pair:
            item["individual"] = {
                key: {"probability": round(float(v["probability"][i]), 4),
                      "cutoff": v["cutoff"],
                      "prediction": LABELS[int(v["prediction"][i])]}
                for key, v in result["individual"].items()}
        results.append(item)

    n_malignant = sum(r["prediction"] == "malignant" for r in results)
    response = {
        "models": selected,
        "model_names": [meta["models"][k]["display_name"] for k in selected],
        "summary": {"records": len(results), "flagged_malignant": n_malignant,
                    "flagged_benign": len(results) - n_malignant},
        "results": results,
        "disclaimer": DISCLAIMER,
    }
    if is_pair:
        response["combine"] = "average of the two models' malignant probabilities"
    return jsonify(response)


if __name__ == "__main__":
    print("Loaded models:", list(models))
    print("Serving on http://127.0.0.1:5000  (press Ctrl+C to stop)")
    app.run(host="127.0.0.1", port=5000, debug=False)
