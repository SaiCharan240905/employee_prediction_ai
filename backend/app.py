from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
from io import StringIO

app = Flask(__name__)
CORS(app)  # This enables CORS for all routes

# Load trained models
clf_attr = joblib.load("rf_attr_model.pkl")
reg_perf = joblib.load("rf_perf_model.pkl")
scaler = joblib.load("scaler.pkl")

# Get expected feature names from the model
expected_features = clf_attr.feature_names_in_.tolist()

def map_columns_to_features(df):
    """Map input DataFrame columns to expected model features."""
    feature_df = pd.DataFrame(0, index=np.arange(len(df)), columns=expected_features)
    
    # Map exact column matches
    for col in df.columns:
        if col in expected_features:
            feature_df[col] = df[col]
    
    # Try to map columns by similarity (case-insensitive)
    for col in df.columns:
        col_lower = col.lower().replace(' ', '').replace('_', '')
        for exp_col in expected_features:
            exp_col_lower = exp_col.lower().replace(' ', '').replace('_', '')
            if col_lower == exp_col_lower and col != exp_col:
                feature_df[exp_col] = df[col]
                break
    
    # Handle special cases and derived features
    if 'Age' not in feature_df.columns and 'BirthDate' in df.columns:
        feature_df['Age'] = 2025 - pd.to_datetime(df['BirthDate']).dt.year
    
    if 'YearsAtCompany' not in feature_df.columns and 'JoinDate' in df.columns:
        feature_df['YearsAtCompany'] = 2025 - pd.to_datetime(df['JoinDate']).dt.year
    
    # Convert categorical columns to numeric if needed
    for col in feature_df.columns:
        if feature_df[col].dtype == 'object':
            feature_df[col] = pd.Categorical(feature_df[col]).codes
    
    return feature_df

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
            
        if not file.filename.endswith('.csv'):
            return jsonify({'error': 'Please upload a CSV file'}), 400

        # Read the CSV file
        content = file.read().decode('utf-8')
        df = pd.read_csv(StringIO(content))
        
        if df.empty:
            return jsonify({'error': 'The CSV file is empty'}), 400

        # Get column information
        columns = df.columns.tolist()
        
        # Basic data analysis
        analysis = {
            'total_rows': len(df),
            'total_columns': len(columns),
            'columns': columns,
            'summary': {},
            'mapped_features': []
        }
        
        # Generate summary for each column
        for col in columns:
            col_data = df[col]
            summary = {
                'type': str(col_data.dtype),
                'unique_values': len(col_data.unique()),
                'missing_values': int(col_data.isna().sum())
            }
            if pd.api.types.is_numeric_dtype(col_data):
                summary.update({
                    'mean': float(col_data.mean()),
                    'min': float(col_data.min()),
                    'max': float(col_data.max())
                })
            analysis['summary'][col] = summary

        # Map columns to expected features
        feature_df = map_columns_to_features(df)
        analysis['mapped_features'] = feature_df.columns.tolist()

        # Scale features
        features_scaled = scaler.transform(feature_df)

        # Make predictions
        attr_preds = clf_attr.predict(features_scaled)
        perf_preds = reg_perf.predict(features_scaled)

        # Prepare results
        results = []
        for i in range(len(attr_preds)):
            row_data = {}
            # Add original values for each column
            for col in columns:
                val = df.iloc[i][col]
                row_data[col] = str(val) if pd.isna(val) else float(val) if pd.api.types.is_numeric_dtype(df[col]) else str(val)
            
            # Add predictions
            row_data.update({
                'row': i + 1,
                'attrition_prediction': bool(attr_preds[i]),
                'performance_prediction': round(float(perf_preds[i]), 2)
            })
            results.append(row_data)

        return jsonify({
            'total_predictions': len(results),
            'analysis': analysis,
            'predictions': results
        })

    except pd.errors.EmptyDataError:
        return jsonify({'error': 'The CSV file is empty'}), 400
    except pd.errors.ParserError:
        return jsonify({'error': 'Invalid CSV format'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
