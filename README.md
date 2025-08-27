# Sales Analysis and Forecasting

This project provides a comprehensive solution for sales forecasting using Facebook's Prophet models with both training and inference capabilities.

## Features

- Train Prophet models for multiple sales series
- FastAPI service for inference with CSV upload
- Pre-trained models for 8 different product categories
- Separate training and inference pipelines
- Model storage with version control

## Project Structure

- `services/prophet_forecaster.py` - Core forecasting logic
- `app.py` - FastAPI application for inference
- `model_pkls/` - Directory containing trained models
- `salesweekly.csv` - Training data

## Supported Series

The following sales series are supported:
- M01AB, M01AE (Cardiovascular medications)
- N02BA, N02BE (Analgesics)
- N05B, N05C (Psycholeptics)
- R03, R06 (Respiratory medications)

## Installation

1. Install dependencies using uv:
```bash
uv sync
```

Or using pip:
```bash
pip install -e .
```

## Training Models

To train new Prophet models:

```python
from services.prophet_forecaster import ProphetForecaster

# Series configuration with optimized parameters
series_config = [
    {'series': 'M01AB', 'params_grid': {'changepoint_prior_scale': 30, 'interval_width': 0.0005}},
    {'series': 'M01AE', 'params_grid': {'changepoint_prior_scale': 0.05, 'interval_width': 0.0005}},
    {'series': 'N02BA', 'params_grid': {'changepoint_prior_scale': 0.005, 'interval_width': 0.0005}},
    {'series': 'N02BE', 'params_grid': {'changepoint_prior_scale': 10, 'seasonality_prior_scale': 170, 'interval_width': 0.0005}},
    {'series': 'N05B', 'params_grid': {'changepoint_prior_scale': 5, 'interval_width': 0.0005}},
    {'series': 'N05C', 'params_grid': {'changepoint_prior_scale': 0.5, 'interval_width': 0.005}},
    {'series': 'R03', 'params_grid': {'changepoint_prior_scale': 0.05, 'seasonality_prior_scale': 160, 'interval_width': 0.0005}},
    {'series': 'R06', 'params_grid': {'changepoint_prior_scale': 0.05, 'seasonality_prior_scale': 120, 'interval_width': 0.0005}}
]

forecaster = ProphetForecaster()
forecaster.train_models(series_config)
```

## Running the API

Start the FastAPI server:

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Or using Python directly:

```bash
python -m uvicorn app:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit `http://localhost:8000/docs` for interactive Swagger UI documentation.

## API Endpoints

### GET /
Health check and API information
```bash
curl http://localhost:8000/
```

### POST /predict
Upload CSV file and get predictions for all available series

**Expected CSV format:**
- Must have a `datum` column with dates (YYYY-MM-DD format)
- Should contain columns matching series names (M01AB, M01AE, etc.)

**Example using curl:**
```bash
curl -X POST "http://localhost:8000/predict" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@your_data.csv"
```

**Response format:**
```json
{
  "metadata": {
    "filename": "your_data.csv",
    "data_rows": 52,
    "date_range": {
      "start": "2020-01-01",
      "end": "2020-12-31"
    },
    "available_series": ["M01AB", "N02BA"],
    "missing_series": ["M01AE", "N02BE", "N05B", "N05C", "R03", "R06"]
  },
  "predictions": {
    "M01AB": {
      "dates": ["2020-01-01", "2020-01-08", ...],
      "predictions": [95.23, 98.45, ...]
    },
    "N02BA": {
      "dates": ["2020-01-01", "2020-01-08", ...],
      "predictions": [120.12, 118.89, ...]
    }
  }
}
```

### GET /series
Get information about available forecasting series
```bash
curl http://localhost:8000/series
```

## Example CSV Format

```csv
datum,M01AB,M01AE,N02BA,N02BE
2020-01-01,100,50,200,75
2020-01-08,105,52,198,78
2020-01-15,98,48,205,72
...
```

## Development

### Training Pipeline
- Uses data from 2014-2018 for training
- Optimized hyperparameters for each series
- Models saved as pickle files in `model_pkls/`

### Inference Pipeline
- Accepts CSV files via API
- Processes all available series in parallel
- Returns predictions with metadata
- Handles missing data gracefully

## Production Deployment

For production deployment:

1. Ensure trained models exist in `model_pkls/`
2. Use a production ASGI server like Gunicorn with Uvicorn workers
3. Configure CORS appropriately
4. Set up proper logging and monitoring
5. Use environment variables for configuration

Example production startup:
```bash
gunicorn app:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```
