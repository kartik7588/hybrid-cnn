# Wisconsin Diagnostic Breast Cancer dataset

The bundled `wdbc.data` and `wdbc.names` are unmodified copies of the files supplied by the user. The `.names` file defines the original column order and B/M diagnosis codes.

Source: UCI Machine Learning Repository, Breast Cancer Wisconsin (Diagnostic).

Citation: Wolberg, W., Mangasarian, O., Street, N., & Street, W. (1993). Breast Cancer Wisconsin (Diagnostic) [Dataset]. UCI Machine Learning Repository. https://doi.org/10.24432/C5DW2B.

Dataset page: https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic

License: Creative Commons Attribution 4.0 International (CC BY 4.0). https://creativecommons.org/licenses/by/4.0/

The supplied files contain 569 records, with 357 benign and 212 malignant diagnoses. Each record contains an ID, diagnosis and 30 numeric features derived from fine-needle aspirate cell nuclei, not mammogram images. Features are ordered as ten means, ten standard errors and ten worst measurements.

The frontend adds column headers and expands B/M to Benign/Malignant for display and CSV download. Numeric values, IDs and row order are unchanged. The original files remain intact. IDs and diagnosis must not be used as predictive features in future training.

The six-row `exampleDataset` in the CSV parser tests remains a synthetic test fixture. It is no longer the page's sample dataset. Comparison predictions, scores and summaries remain synthetic; no model is trained or evaluated by loading these records. CNN and hybrid inference require appropriate image or paired data and a connected model.
