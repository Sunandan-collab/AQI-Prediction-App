import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import pickle

df = pd.read_csv('AQI_data.csv')

print("Data shape:", df.shape)
print("\nData info:")
print(df.info())
print("\nData description:")
print(df.describe())

print("\nMissing values:")
print(df.isnull().sum())

df['Date'] = pd.to_datetime(df['Date'], format='%d-%m-%Y')

df['Month'] = df['Date'].dt.month
df['Day'] = df['Date'].dt.day

# Correlation matrix
plt.figure(figsize=(14, 10))
correlation_matrix = df.drop(['Date', 'City'], axis=1).corr()
sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', fmt='.2f')
plt.title('Correlation Matrix')
plt.tight_layout()
plt.savefig('static/images/correlation_matrix.png')

# Visualize distribution of AQI
plt.figure(figsize=(10, 6))
sns.histplot(df['AQI'], kde=True)
plt.title('Distribution of AQI')
plt.xlabel('AQI Value')
plt.ylabel('Frequency')
plt.tight_layout()
plt.savefig('static/images/aqi_distribution.png')

# Visualize relationship between pollutants and AQI
plt.figure(figsize=(14, 10))
features = ['PM2.5', 'PM10', 'NO2', 'CO', 'SO2', 'O3']
for i, feature in enumerate(features):
    plt.subplot(2, 3, i+1)
    plt.scatter(df[feature], df['AQI'])
    plt.title(f'{feature} vs AQI')
    plt.xlabel(feature)
    plt.ylabel('AQI')
plt.tight_layout()
plt.savefig('static/images/features_vs_aqi.png')

def categorize_aqi(aqi):
    if aqi <= 50:
        return 'Good'
    elif aqi <= 100:
        return 'Moderate'
    elif aqi <= 150:
        return 'Unhealthy for Sensitive Groups'
    elif aqi <= 200:
        return 'Unhealthy'
    elif aqi <= 300:
        return 'Very Unhealthy'
    else:
        return 'Hazardous'

df['AQI_Category'] = df['AQI'].apply(categorize_aqi)

plt.figure(figsize=(10, 6))
sns.countplot(x='AQI_Category', data=df, order=['Good', 'Moderate', 'Unhealthy for Sensitive Groups', 'Unhealthy', 'Very Unhealthy', 'Hazardous'])
plt.title('Count of AQI Categories')
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('static/images/aqi_category_count.png')

features = ['PM2.5', 'PM10', 'NO', 'NO2', 'NOx', 'NH3', 'CO', 'SO2', 'O3', 'Benzene', 'Toluene', 'Xylene']
X = df[features]
y = df['AQI']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = LinearRegression()
model.fit(X_train, y_train)

y_pred = model.predict(X_test)

mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

# Calculate adjusted R²
n = X_test.shape[0]
p = X_test.shape[1]
adjusted_r2 = 1 - ((1 - r2) * (n - 1) / (n - p - 1))

print("\nModel Evaluation:")
print(f"Mean Squared Error: {mse:.2f}")
print(f"Root Mean Squared Error: {rmse:.2f}")
print(f"Mean Absolute Error: {mae:.2f}")
print(f"R² Score: {r2:.2f}")
print(f"Adjusted R² Score: {adjusted_r2:.2f}")

feature_importance = pd.DataFrame({
    'Feature': features,
    'Importance': model.coef_
})
print("\nFeature Importance:")
print(feature_importance.sort_values(by='Importance', ascending=False))

# Visualize actual vs predicted values
plt.figure(figsize=(10, 6))
plt.scatter(y_test, y_pred)
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--')
plt.xlabel('Actual AQI')
plt.ylabel('Predicted AQI')
plt.title('Actual vs Predicted AQI')
plt.tight_layout()
plt.savefig('static/images/actual_vs_predicted.png')

with open('model/aqi_model.pkl', 'wb') as file:
    pickle.dump(model, file)

with open('model/features.pkl', 'wb') as file:
    pickle.dump(features, file)

print("\nModel and features saved successfully!")