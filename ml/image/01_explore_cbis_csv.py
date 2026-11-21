"""Explore the CBIS-DDSM description CSV files (labels and file paths only, no images).

The dataset is large and CC BY 3.0, so it is kept OUTSIDE the repository.
Default folder: ~/datasets/cbis-ddsm/csv
Another folder:  CBIS_CSV_DIR=/some/folder python ml/image/01_explore_cbis_csv.py
"""
import io
import os
from pathlib import Path

import pandas as pd

CSV_DIR = Path(os.environ.get("CBIS_CSV_DIR", Path.home() / "datasets" / "cbis-ddsm" / "csv"))
FILES = {
    "mass train": "mass_case_description_train_set.csv",
    "mass test": "mass_case_description_test_set.csv",
    "calc train": "calc_case_description_train_set.csv",
    "calc test": "calc_case_description_test_set.csv",
}
KEY_COLUMNS = ["patient_id", "pathology", "image_file_path", "cropped_image_file_path", "ROI_mask_file_path"]


def read_cbis_csv(path):
    """These files have line breaks inside records, so a plain line count is about twice the record count.
    A new record always starts with 'P_'; any other line continues the previous record."""
    text = path.read_text(encoding="utf-8-sig").replace("\r\n", "\n").replace("\r", "\n")
    header, *lines = text.split("\n")
    records, current = [], ""
    for line in lines:
        if not line.strip():
            continue
        if line.startswith("P_"):
            if current:
                records.append(current)
            current = line.rstrip()
        else:
            current += line.strip()
    if current:
        records.append(current)
    df = pd.read_csv(io.StringIO("\n".join([header, *records])), dtype=str)
    df.columns = [c.strip().replace(" ", "_") for c in df.columns]
    return df.apply(lambda col: col.str.strip())


def binary_label(pathology):
    """MALIGNANT -> malignant; BENIGN and BENIGN_WITHOUT_CALLBACK -> benign."""
    def label(p):
        if not isinstance(p, str):
            return None
        p = p.upper()
        return "malignant" if p == "MALIGNANT" else "benign" if p.startswith("BENIGN") else None
    return pathology.map(label)


tables = {}
print(f"Reading CSV files from: {CSV_DIR}\n")
for name, filename in FILES.items():
    path = CSV_DIR / filename
    if not path.exists():
        raise SystemExit(f"Missing file: {path}\nPut the four CBIS-DDSM CSV files there, or set CBIS_CSV_DIR.")
    tables[name] = read_cbis_csv(path)

for name, df in tables.items():
    per_patient = df.groupby("patient_id").size()
    folders = df["image_file_path"].dropna()
    print(f"== {name}")
    print(f"  records (one per lesion): {len(df)}   patients: {df['patient_id'].nunique()}")
    print(f"  lesions per patient: mean {per_patient.mean():.2f}, max {per_patient.max()}")
    print("  pathology:", df["pathology"].value_counts(dropna=False).to_dict())
    print("  benign/malignant:", binary_label(df["pathology"]).value_counts(dropna=False).to_dict())
    print("  views:", df["image_view"].value_counts().to_dict(), "| side:", df["left_or_right_breast"].value_counts().to_dict())
    missing = {c: int(df[c].isna().sum()) for c in KEY_COLUMNS if df[c].isna().any()}
    print("  missing values in key columns:", missing or "none")
    duplicates = df.duplicated(["patient_id", "left_or_right_breast", "image_view", "abnormality_id"]).sum()
    print(f"  duplicate lesion records: {duplicates}")
    print("  example image folder name:", folders.iloc[0].split("/")[0] if len(folders) else "n/a")
    print()

print("== Patients that appear in both train and test (should be 0)")
for kind in ("mass", "calc"):
    both = set(tables[f"{kind} train"]["patient_id"]) & set(tables[f"{kind} test"]["patient_id"])
    note = "" if not both else "   <- WARNING: split by patient before training"
    print(f"  {kind}: {len(both)}{note}")
