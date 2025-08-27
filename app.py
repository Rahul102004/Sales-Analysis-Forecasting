from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import json
from typing import Dict, Any
from services.prophet_forecaster import ProphetForecaster

app = FastAPI(
    title="Sales Forecasting API",
    description="API for sales forecasting using Prophet models",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Series configuration matching the prophet_forecaster.py
SERIES_CONFIG = [
    {'series': 'M01AB', 'params_grid': {'changepoint_prior_scale': 30, 'interval_width': 0.0005}},
    {'series': 'M01AE', 'params_grid': {'changepoint_prior_scale': 0.05, 'interval_width': 0.0005}},
    {'series': 'N02BA', 'params_grid': {'changepoint_prior_scale': 0.005, 'interval_width': 0.0005}},
    {'series': 'N02BE', 'params_grid': {'changepoint_prior_scale': 10, 'seasonality_prior_scale': 170, 'interval_width': 0.0005}},
    {'series': 'N05B', 'params_grid': {'changepoint_prior_scale': 5, 'interval_width': 0.0005}},
    {'series': 'N05C', 'params_grid': {'changepoint_prior_scale': 0.5, 'interval_width': 0.005}},
    {'series': 'R03', 'params_grid': {'changepoint_prior_scale': 0.05, 'seasonality_prior_scale': 160, 'interval_width': 0.0005}},
    {'series': 'R06', 'params_grid': {'changepoint_prior_scale': 0.05, 'seasonality_prior_scale': 120, 'interval_width': 0.0005}}
]

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Sales Forecasting API is running",
        "version": "1.0.0",
        "available_series": [config['series'] for config in SERIES_CONFIG]
    }

@app.post("/predict", response_model=Dict[str, Any])
async def predict_sales(file: UploadFile = File(...)):
    """
    Upload a CSV file and get sales predictions for all available series.

    Expected CSV format:
    - Must have a 'datum' column with dates (YYYY-MM-DD format)
    - Should contain columns matching the series names (M01AB, M01AE, etc.)
    - Date column should be in datetime format

    Returns:
        Dictionary with predictions for each series found in the data
    """
    try:
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(
                status_code=400,
                detail="Only CSV files are supported"
            )

        # Read the uploaded CSV file
        contents = await file.read()
        try:
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(contents))

        # Validate required columns
        if 'datum' not in df.columns:
            raise HTTPException(
                status_code=400,
                detail="CSV must contain a 'datum' column with dates"
            )

        # Convert datum to datetime
        try:
            df['datum'] = pd.to_datetime(df['datum'])
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid date format in 'datum' column: {str(e)}"
            )

        # Check which series are available in the uploaded data
        available_series = []
        for config in SERIES_CONFIG:
            if config['series'] in df.columns:
                available_series.append(config)
            else:
                print(f"Warning: Series {config['series']} not found in uploaded data")

        if not available_series:
            raise HTTPException(
                status_code=400,
                detail=f"No valid series found in data. Available series: {[config['series'] for config in SERIES_CONFIG]}"
            )

        # Initialize forecaster
        try:
            forecaster = ProphetForecaster()
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to initialize forecaster: {str(e)}"
            )

        # Generate predictions
        try:
            predictions = forecaster.predict(available_series, data=df)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Prediction failed: {str(e)}"
            )

        # Add metadata to response
        response = {
            "metadata": {
                "filename": file.filename,
                "data_rows": len(df),
                "date_range": {
                    "start": df['datum'].min().strftime('%Y-%m-%d'),
                    "end": df['datum'].max().strftime('%Y-%m-%d')
                },
                "available_series": [config['series'] for config in available_series],
                "missing_series": [config['series'] for config in SERIES_CONFIG if config not in available_series]
            },
            "predictions": predictions
        }

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )

@app.get("/series")
async def get_available_series():
    """Get information about available forecasting series"""
    return {
        "series": [
            {
                "name": config['series'],
                "parameters": config['params_grid']
            }
            for config in SERIES_CONFIG
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
