"""Try the running API. Start the server first (in another terminal): python ml/api.py

This is a demo of how the API behaves, NOT an evaluation of the models.
"""
import json
import urllib.error
import urllib.request

import pandas as pd

BASE = "http://127.0.0.1:5000"


def call(path, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(BASE + path, data=data,
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.load(resp)
    except urllib.error.HTTPError as e:
        return e.code, json.load(e)


status, info = call("/api/models")
features = info["features"]
print("Available models:", [m["key"] for m in info["models"]])
print("Available pairs: ", [p["key"] for p in info["pairs"]], "\n")

# A small sample: 2 malignant and 2 benign patients from the file.
df = pd.read_csv("src/data/wdbc.data", header=None)
sample = pd.concat([df[df[1] == "M"].head(2), df[df[1] == "B"].head(2)])
actual = list(sample[1])
records = sample.iloc[:, 2:].set_axis(features, axis=1).to_dict("records")
print("Actual diagnoses of the 4 sample patients:", actual, "\n")

status, out = call("/api/predict", {"models": ["svm"], "records": records})
print(f"ONE MODEL (SVM) -> HTTP {status}")
for r in out["results"]:
    print(f"  patient {r['index']}: {r['prediction']:<10} probability {r['probability']}  (cutoff {r['cutoff']})")

status, out = call("/api/predict", {"models": ["logistic_regression", "mlp"], "records": records})
print(f"\nTWO MODELS COMBINED (Logistic Regression + MLP) -> HTTP {status}")
print("  how combined:", out["combine"])
for r in out["results"]:
    parts = ", ".join(f"{k}={v['probability']}" for k, v in r["individual"].items())
    print(f"  patient {r['index']}: {r['prediction']:<10} combined {r['probability']}  ({parts}; cutoff {r['cutoff']})")
print("  summary:", out["summary"])

print("\nBAD REQUESTS (these should be rejected clearly)")
bad_cases = {
    "three models": {"models": ["svm", "mlp", "logistic_regression"], "records": records},
    "unknown model": {"models": ["cnn"], "records": records},
    "missing feature": {"models": ["svm"], "records": [{"radius_mean": 14.0}]},
    "text instead of number": {"models": ["svm"],
                               "records": [{**records[0], "radius_mean": "abc"}]},
}
for name, payload in bad_cases.items():
    status, out = call("/api/predict", payload)
    print(f"  {name}: HTTP {status} -> {out['error']} {out.get('details', '')}")
