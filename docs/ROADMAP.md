# Project scope and roadmap

## What the project is

A research web app for **breast cancer**. A user uploads a **mammogram** (a breast X-ray). The AI reads it,
shows where the suspicious region is, and says whether it looks **benign or malignant**.

This is a research prototype. It is not a diagnosis, it is not clinically validated, and it has no clinical approval.
It classifies benign versus malignant only: no cancer staging and no "early-stage detection" claim.

## The three layers

| Layer | What it means | Status |
|---|---|---|
| 1. Image input | Mammogram images as PNG, JPG, WebP or BMP (up to 20 MB) | Built (Upload Scan page) |
| 2. DICOM input | Real mammogram DICOM files (.dcm), as radiologists store them | Planned for launch |
| 3. AI reads the mammogram | Says benign or malignant, and where the tumor is | Not built yet. Until it is, the Upload Scan analysis is a labeled demo. |

### Layer 3 in stages

1. **Classify a lesion image** (CBIS-DDSM masses): benign or malignant.
2. **Classify a region of a full mammogram** that the user selects.
3. **Locate lesions automatically** (segmentation or detection), trained on the CBIS-DDSM lesion masks.

Classification and localization are measured differently. Classification: sensitivity, specificity, ROC-AUC.
Localization: overlap with the real lesion and how many lesions are found versus false alarms.
A heatmap from a classifier is a visual aid, not a tumor boundary, and must not be presented as one.

A **hybrid** model combines CNN image features with numeric features computed from the same image, and is compared
with its parts under the same split.

## Scope decisions

- Breast cancer only; mammograms only. Other X-ray types are out of scope.
- Datasets are kept outside the repository and cited as their terms require.
- Splits are by patient; the test set is used once; cutoffs are chosen from training data only.
- Launch modes: **demo** (sample or public images), **research** (de-identified images from logged-in researchers),
  **clinical** (real patient cases: locked, would need clinical validation and regulatory approval).

## Built so far

- Models on the WDBC numeric dataset (Logistic Regression, SVM, MLP) with measured test results, any two can be combined.
- Python prediction API; the Upload Dataset and Analytics pages use the real models.
- CBIS-DDSM label exploration (ml/image/01_explore_cbis_csv.py).

## Roadmap

1. [x] WDBC models, API, Upload Dataset and Analytics pages
2. [x] CBIS-DDSM labels explored
3. [x] Upload Scan accepts and names mammogram images
4. [ ] Choose and download the CBIS-DDSM mass images; patient-aware split
5. [ ] Image CNN baseline and honest evaluation
6. [ ] Hybrid (CNN plus numeric features from the same image) compared with its parts
7. [ ] Image endpoint in the API; connect Upload Scan and Results; DICOM upload; handle the 4.5 MB request limit
8. [ ] Launch foundations: login and roles, HTTPS, privacy defaults, production server
9. [ ] Localization of lesions (layer 3, stage 3)
10. [ ] Final testing on independent data (below)

## Final testing before any clinical claim (end of the project)

- **Image model:** test, without retraining, on independent datasets such as CMMD and VinDr-Mammo
  (and INbreast or others if accessible). Freeze the model and cutoff first. Expect lower numbers and report them.
  Check each dataset's terms; dataset links are collected at this stage.
- **The three WDBC models:** externally testing them needs a dataset with the same 30 measurements. None is known
  as of now. If none exists, say so; do not claim external validation. Other tabular datasets would need new models.
- Public datasets are necessary but not sufficient for clinical approval, which needs clinical evidence from the
  intended hospital population.
