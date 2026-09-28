import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load dataset
df = pd.read_csv("heart_risk.csv")

# Display first five records
print(df.head())

# 1. Histogram
plt.figure(figsize=(8, 5))
sns.histplot(df["Age"], bins=10, kde=True)
plt.title("Age Distribution")
plt.xlabel("Age")
plt.ylabel("Frequency")
plt.show()

# 2. Box Plot
plt.figure(figsize=(8, 5))
sns.boxplot(x=df["BMI"])
plt.title("BMI Box Plot")
plt.show()

# 3. Scatter Plot
plt.figure(figsize=(8, 5))
sns.scatterplot(x="Age", y="Cholesterol", data=df)
plt.title("Age vs Cholesterol")
plt.xlabel("Age")
plt.ylabel("Cholesterol")
plt.show()

# 4. Bar Chart
plt.figure(figsize=(8, 5))
sns.countplot(x="RiskClass", data=df)
plt.title("Risk Class Distribution")
plt.xlabel("Risk Class")
plt.ylabel("Count")
plt.show()

# 5. Correlation Heatmap
plt.figure(figsize=(10, 7))
sns.heatmap(df.select_dtypes(include="number").corr(),
            annot=True, cmap="coolwarm")
plt.title("Correlation Heatmap")
plt.show()