# Breast Cancer Detection Frontend

React, Vite, and Tailwind CSS demonstration of a breast imaging review workflow.

## Run locally

Requires Node.js and npm.

```sh
npm install
npm run dev
```

Use the local URL printed by Vite. On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`.

```sh
npm run build
npm run preview
```

## Features

Login, dashboard, scan upload, results, patient history, reports, analytics, and settings. Includes responsive light/dark themes and browser-printable demo reports.

The Upload Dataset research workspace (`/dataset`) accepts CSV files up to 10 MB, 5,000 rows and 100 columns. Preview data, select SVM, logistic regression, CNN, MLP, or the proposed CNN + MLP hybrid, and export synthetic demo comparisons. These outputs do not use a trained model or measure accuracy. Real CNN and hybrid evaluation requires connected models and appropriate image or paired data, not a CSV alone.

Use sample dataset loads the supplied Wisconsin Diagnostic dataset: 569 records and 30 numeric features, plus ID and diagnosis. Original WDBC `.data` uploads are supported, and Download sample CSV exports the full dataset with headers and expanded Benign/Malignant labels. Data provenance, attribution and CC BY 4.0 license details are in `src/data/WDBC.md`. This is numerical cell-measurement data, not mammogram imagery; comparison outputs remain synthetic.

## Demonstration only

No trained model, backend, real authentication, or patient database is connected. Predictions, overlays, patient records, and analytics are simulated. This application is not a diagnostic medical device and must not be used for clinical decisions. Settings are stored locally in the browser.
