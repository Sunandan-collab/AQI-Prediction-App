from flask import Flask, render_template, request, jsonify
import pickle
import numpy as np
import os
import pandas as pd

app = Flask(__name__)

model_dir = os.path.join(os.path.dirname(__file__), 'model')
with open(os.path.join(model_dir, 'aqi_model.pkl'), 'rb') as file:
    model = pickle.load(file)

with open(os.path.join(model_dir, 'features.pkl'), 'rb') as file:
    features = pickle.load(file)

def categorize_aqi(aqi):
    """
    Categorize AQI value into corresponding health category and color
    """
    if aqi <= 50:
        return "Good", "#00e400"
    elif aqi <= 100:
        return "Moderate", "#ffff00"
    elif aqi <= 150:
        return "Unhealthy for Sensitive Groups", "#ff7e00"
    elif aqi <= 200:
        return "Unhealthy", "#ff0000"
    elif aqi <= 300:
        return "Very Unhealthy", "#8f3f97"
    else:
        return "Hazardous", "#7e0023"

@app.route('/')
def home():
    """
    Render the home page with feature names from the model
    """
    display_names = {}
    for col in features:
        if 'PM2.5' in col:
            display_names[col] = 'PM2.5'
        elif 'PM10' in col:
            display_names[col] = 'PM10'
        elif col == 'NO' or col.endswith('_NO'):
            display_names[col] = 'NO'
        elif col == 'NO2' or col.endswith('_NO2'):
            display_names[col] = 'NO2'
        elif col == 'NOx' or col.endswith('_NOx'):
            display_names[col] = 'NOx'
        elif 'NH3' in col:
            display_names[col] = 'NH3'
        elif 'CO' in col:
            display_names[col] = 'CO'
        elif 'SO2' in col:
            display_names[col] = 'SO2'
        elif 'O3' in col:
            display_names[col] = 'O3'
        elif 'Benzene' in col:
            display_names[col] = 'Benzene'
        elif 'Toluene' in col:
            display_names[col] = 'Toluene'
        elif 'Xylene' in col:
            display_names[col] = 'Xylene'
        else:
            display_names[col] = col
    
    return render_template('index.html', features=features, display_names=display_names)

@app.route('/predict', methods=['POST'])
def predict():
    """
    Handle prediction requests from the form
    """
    try:
        
        input_data = []
        for feature in features:
            value = float(request.form[feature])
            input_data.append(value)
        
       
        prediction = model.predict([input_data])[0]
        prediction = max(0, min(500, prediction))  
        
        
        category, color = categorize_aqi(prediction)
        
        return jsonify({
            'success': True,
            'aqi': round(prediction, 2),
            'category': category,
            'color': color
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

if __name__ == '__main__':
    app.run(debug=True)