import pandas as pd

# The file has no header row, so we name the columns ourselves.
# 10 measurements, each in 3 versions: mean, standard error (se), worst.
measurements = ["radius", "texture", "perimeter", "area", "smoothness",
                "compactness", "concavity", "concave_points", "symmetry",
                "fractal_dimension"]
columns = ["id", "diagnosis"] + [
    f"{m}_{group}" for group in ["mean", "se", "worst"] for m in measurements
]

df = pd.read_csv("src/data/wdbc.data", header=None, names=columns)

print("Rows, columns:", df.shape)
print()
print("Diagnosis counts (B = benign, M = malignant):")
print(df["diagnosis"].value_counts())
print()
print("Missing values:", df.isna().sum().sum())
print()
print("First 3 rows:")
print(df.head(3).T)
print()
print("Average of a few measurements, by diagnosis:")
print(df.groupby("diagnosis")[["radius_mean", "area_mean", "concavity_mean"]].mean())