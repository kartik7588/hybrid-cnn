# Breast Cancer Detection

A React, Vite, and Tailwind workspace with two separate parts:

1. A **demonstration** of a breast-imaging review workflow (login, scan upload, results, patients, reports, analytics). Those screens use sample data and do not call a model.
2. A **research prototype** that classifies the Wisconsin Diagnostic Breast Cancer (WDBC) dataset with three trained numeric models, served by a local Flask API and used from the Upload Dataset page.

This application is not a diagnostic medical device and must not be used for clinical decisions.

## What is done

### Imaging demo

Login, dashboard, scan upload, results, patient history, reports, analytics, and settings. Light and dark themes. Browser-printable sample reports. Settings stay in the browser. There is no real authentication, patient database, or image model. Scan upload accepts a PNG or JPG and walks through a simulated review. DICOM is not supported.

### Numeric models (WDBC)

Trained on the Wisconsin Diagnostic dataset: 569 records, 30 numeric cell-nucleus measurements, plus an ID and a diagnosis. This is not mammogram imagery. Provenance, attribution, and the CC BY 4.0 license are in `src/data/WDBC.md`.

The same split is used throughout: 80% train / 20% test, stratified, `random_state=42` (455 train, 114 test). The test set is scored only in `ml/09_evaluate_on_test.py`.

| Step | Script | Result |
|---|---|---|
| Explore | `ml/01_explore_data.py` | Shape, class counts, a few group means |
| Baselines | `ml/02`–`ml/04` | Logistic regression, calibrated RBF SVM, MLP |
| Compare | `ml/05_cross_validate.py` | 5-fold CV on the training set only |
| Tune | `ml/06_tune_models.py` | Grid search scored by ROC-AUC |
| Choose cutoff | `ml/07_choose_cutoff.py` | Highest cutoff on a 0.05 grid that still catches at least 97% of training cancers |
| Save | `ml/08_train_and_save.py` | Refit on all training rows; write `ml/models/*.joblib` and `metadata.json` |
| Evaluate once | `ml/09_evaluate_on_test.py` | Held-out scores in `ml/models/test_results.json` |

Saved models (scikit-learn 1.9.1):

| Model | Settings | Decision cutoff |
|---|---|---|
| Logistic regression | `C=1` | 0.30 |
| SVM | RBF, `C=100`, `gamma=0.001`, probability-calibrated | 0.40 |
| MLP | one hidden layer of 16, `alpha=0.0001` | 0.50 |

A pair is the average of the two models' malignant probabilities, with its own cutoff (0.45 for each saved pair). On the held-out 114 patients, logistic regression missed 1 cancer and raised 1 false alarm. SVM, MLP, and every pair missed 2. Averaging two models did not catch more cancers than logistic regression alone. One patient moves sensitivity by about two points on a set this small.

### Prediction API

`ml/api.py` loads the saved models once and serves them on `http://127.0.0.1:5000`:

- `GET /api/health` — server and scikit-learn version check
- `GET /api/models` — model keys, pair keys, feature names, cutoffs
- `GET /api/metrics` — the one-time held-out evaluation
- `POST /api/predict` — one model, or two different models, up to 5,000 records

`ml/10_try_api.py` calls that server with four sample rows and a few requests that should be rejected. It is a smoke test, not an evaluation.

### Upload Dataset page

`/dataset` sends rows to the API through the Vite proxy (`/api` → `http://127.0.0.1:5000`).

- CSV up to 10 MB, 5,000 rows, and 100 columns, or an original WDBC `.data` file
- Sample dataset and a downloadable CSV with headers and Benign/Malignant labels
- Single model, average of two models, or a side-by-side comparison
- CNN and the proposed CNN + MLP hybrid stay disabled: they are not trained
- The summary table shows the held-out test metrics. It does not score the file you uploaded. Running the full 569-row sample is not an accuracy measurement, because 455 of those rows were used for training
- Export writes each prediction, malignant probability, and cutoff. Reference labels are included only for display and export

## Run locally

Two processes. Start the API first, then the website.

Python 3 with the packages in `ml/requirements.txt` (scikit-learn is pinned to 1.9.1, the version the models were saved with):

```sh
pip install -r ml/requirements.txt
python ml/api.py
```

Node.js and npm, in a second terminal, from the project root:

```sh
npm install
npm run dev
```

Use the local URL printed by Vite. On Windows PowerShell, use `npm.cmd` if the script execution policy blocks `npm`.

```sh
npm run build
npm run preview
```

`npm run preview` does not include the Vite dev proxy. The dataset page expects `/api` to reach the Flask server, which the dev server provides.

## Not done

- No CNN, no image model, and no image-plus-numeric hybrid
- No clinical validation
- Login, patients, scan overlays, reports, and analytics remain simulated

See [docs/ROADMAP.md](docs/ROADMAP.md) for the project scope, the three layers and the roadmap.
