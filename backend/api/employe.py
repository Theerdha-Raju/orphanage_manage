import pandas as pd

data = {
    "Employee_ID": range(1, 31),

    "Employee_Name": [
        "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
        "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
        "U", "V", "W", "X", "Y", "Z", "AA", "AB", "AC", "AD"
    ],

    "Department": [
        "IT", "HR", "Finance", "IT", "Sales",
        "HR", "Finance", "IT", "Sales", "HR",
        "IT", "Finance", "Sales", "IT", "HR",
        "Finance", "IT", "Sales", "HR", "Finance",
        "IT", "Sales", "HR", "Finance", "IT",
        "Sales", "HR", "Finance", "IT", "Sales"
    ],

    "Experience": [
        2,4,5,3,6,2,7,4,5,3,
        8,4,6,2,5,7,3,6,4,8,
        5,3,7,4,6,5,2,8,4,7
    ],

    "Technical": [
        85,78,88,90,75,82,91,87,79,84,
        93,89,81,86,80,92,88,77,83,90,
        94,82,85,91,87,79,81,93,89,84
    ],

    "Communication": [
        80,85,86,88,78,90,84,82,81,87,
        91,88,85,83,89,86,90,80,92,84,
        88,86,87,90,85,82,91,89,88,86
    ],

    "Teamwork": [
        82,88,84,91,80,87,89,85,83,90,
        92,86,88,84,91,87,89,82,90,85,
        93,88,86,91,89,84,92,90,87,88
    ],

    "Leadership": [
        75,80,85,88,72,84,90,83,78,86,
        92,87,81,79,85,91,88,76,89,84,
        94,82,86,90,88,80,91,89,85,87
    ],

    "Productivity": [
        88,82,90,92,76,89,93,86,80,88,
        95,91,84,87,83,94,90,79,92,86,
        96,85,88,93,91,82,94,92,89,90
    ]
}

df = pd.DataFrame(data)

scores = [
    "Technical",
    "Communication",
    "Teamwork",
    "Leadership",
    "Productivity"
]

print("MEAN")
print(df[scores].mean())

print("\nMEDIAN")
print(df[scores].median())

print("\nMODE")
print(df[scores].mode().iloc[0])

print("\nMAXIMUM")
print(df[scores].max())

print("\nMINIMUM")
print(df[scores].min())

print("\nSUM")
print(df[scores].sum())

print("\nAVERAGE")
df["Average"] = df[scores].mean(axis=1)
print(df[["Employee_ID", "Employee_Name", "Average"]])

print("\nSTANDARD DEVIATION")
print(df[scores].std())

print("\nVARIANCE")
print(df[scores].var())