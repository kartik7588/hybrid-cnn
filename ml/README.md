# ML pipeline: breast cancer classification on WDBC

Python code that trains, evaluates, saves and serves the models used by the **Upload Dataset** page.
This is an academic prototype. It classifies cell-nucleus measurements as benign or malignant. It does not
detect early-stage cancer, determine cancer stage, analyse images, or replace a clinician.

Developed with Python 3.14 and scikit-learn 1.9.1.

## Data

- `src/data/wdbc.data`: the Wisconsin Diagnostic Breast Cancer dataset (UCI, CC BY 4.0). 569 records: 357 benign, 212 malignant.
- Inputs (X): the 30 numeric measurements (10 nucleus features, each as mean, standard error and worst). The case ID is not used.
- Target (y): diagnosis, with **malignant = 1** (the positive class for sensitivity) and benign = 0.
- This is tabular data, not mammogram images.

## Setup

From the project root:

    pip install -r ml/requirements.txt

All scripts are run from the project root, for example `python ml/01_explore_data.py`.

## Scripts, in the order they were built

| Script | What it does |
|---|---|
| `01_explore_data.py` | Loads the data and prints shape, class counts, missing values and average measurements by diagnosis. |
| `02_train_logistic_regression.py` | Logistic Regression baseline on a stratified 80/20 split (`random_state=42`: 455 training, 114 test patients). |
| `03_train_svm.py` | SVM (RBF kernel) on the same split, with calibrated probabilities. |
| `04_train_mlp.py` | MLP neural network on the same split. |
| `05_cross_validate.py` | 5-fold cross-validation of the three models on the training set only. |
| `06_tune_models.py` | Grid search of each model's settings (cross-validation, training set only, scored by ROC-AUC). |
| `07_choose_cutoff.py` | Chooses a decision cutoff per model from cross-validated training predictions. |
| `08_train_and_save.py` | Trains the final models on the training set, chooses cutoffs for every model and pair, saves everything to `ml/models/`. |
| `09_evaluate_on_test.py` | **One-time** evaluation on the 114 held-out test patients; writes `ml/models/test_results.json`. |
| `10_try_api.py` | Demo that calls the running API (not an evaluation). |
| `api.py` | Flask prediction server (see below). |
| `combine.py` | Loads the saved models and predicts with one model or the combination of two. |

Rules followed throughout: the scaler sits inside each scikit-learn `Pipeline` (no leakage); the test set is never used for
training, tuning or choosing cutoffs; each cutoff rule was set before looking at test results.

## Saved models (`ml/models/`)

- `logistic_regression.joblib`, `svm.joblib`, `mlp.joblib`: fitted pipelines.
- `metadata.json`: feature order, class mapping, split settings, each model's and pair's cutoff, cutoff rule, scikit-learn version.
- `test_results.json`: measured test-set results.

The `.joblib` files only load reliably with the scikit-learn version that saved them (1.9.1). To rebuild them, run
`python ml/08_train_and_save.py`. A prediction request loads the saved files and never retrains.

## Combining two models

Any two different models can be combined: their malignant probabilities are averaged, and the pair has its own cutoff
(chosen the same way, since averaging changes the probability scale). This is an ensemble of two numeric models, not a
CNN-based hybrid.

## Results

Cutoff rule: the highest cutoff on a 0.05 grid whose cross-validated training sensitivity is at least 0.97.

**5-fold cross-validation, training set (mean +/- spread across folds):**

| Model | Accuracy | Sensitivity | Specificity | ROC-AUC |
|---|---|---|---|---|
| Logistic Regression | 0.974 +/- 0.015 | 0.953 +/- 0.040 | 0.986 +/- 0.017 | 0.996 +/- 0.005 |
| SVM | 0.976 +/- 0.008 | 0.959 +/- 0.040 | 0.986 +/- 0.013 | 0.995 +/- 0.005 |
| MLP | 0.974 +/- 0.011 | 0.953 +/- 0.024 | 0.986 +/- 0.013 | 0.993 +/- 0.006 |

Tuning changed ROC-AUC by 0 to 0.001, well inside the fold-to-fold spread.

**Held-out test set (114 patients: 42 malignant, 72 benign), at each model's chosen cutoff:**

| Model | Cutoff | Missed cancers | False alarms | Sensitivity | Specificity | ROC-AUC |
|---|---|---|---|---|---|---|
| Logistic Regression | 0.30 | 1 | 1 | 0.976 | 0.986 | 0.996 |
| SVM | 0.40 | 2 | 1 | 0.952 | 0.986 | 0.996 |
| MLP | 0.50 | 2 | 0 | 0.952 | 1.000 | 0.997 |
| Logistic Regression + SVM | 0.45 | 2 | 1 | 0.952 | 0.986 | 0.996 |
| Logistic Regression + MLP | 0.45 | 2 | 0 | 0.952 | 1.000 | 0.996 |
| SVM + MLP | 0.45 | 2 | 0 | 0.952 | 1.000 | 0.996 |

## How to read these results

- All options perform comparably. One patient is about 2.4 percentage points of sensitivity here, so the 1 versus 2 missed
  cancers is not evidence that one model is better.
- Combining two models did not beat the best single model.
- This is one test set of 114 patients from one public, relatively easy dataset. It is not a clinical validation.
- The sample dataset on the Upload Dataset page includes the 455 training patients, so agreement with its labels does not
  measure accuracy.

## Prediction API (`api.py`)

Start it from the project root: `python ml/api.py` (or `npm run api`). It serves on `http://127.0.0.1:5000`. During
development the website's Vite server proxies `/api` to it (see `vite.config.js`).

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Server status and scikit-learn version check. |
| `GET /api/models` | Available models, pairs, cutoffs and the 30 feature names. |
| `GET /api/metrics` | The measured test-set results. |
| `POST /api/predict` | Body: `{"models": ["svm"], "records": [{...30 features...}]}`. Use one model, or two different models to combine. Up to 5,000 records. |

Input is validated (model names, all 30 features present and numeric) and rejected with a clear error otherwise.
The server uses Flask's development server, has no authentication, and is meant for local use only.

## Not done yet

- No image model (CNN) and no CNN-based hybrid; this needs a suitable image dataset or genuinely paired image and numeric data.
- No cancer staging or early-stage detection.
- No external or clinical validation.
- No authentication, database or production deployment of the API.
