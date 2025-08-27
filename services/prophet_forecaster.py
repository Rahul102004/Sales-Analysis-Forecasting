import pandas as pd
from prophet import Prophet
from sklearn.metrics import mean_squared_error, mean_absolute_percentage_error
import json
import warnings
import pickle
import os
import logging

# Configure logging to suppress Prophet warnings
logging.getLogger('prophet').setLevel(logging.WARNING)

class ProphetForecaster:
    def __init__(self, data_path='salesweekly.csv'):
        self.data_path = data_path
        self.df = pd.read_csv(self.data_path)
        self.df['datum'] = pd.to_datetime(self.df['datum'])
        self.results_df = None
        self.output_data = {}
        os.makedirs('model_pkls', exist_ok=True)

    def train_models(self, series_config):
        """Train Prophet models for each series and save them"""
        print("Starting model training...")

        for x in series_config:
            dfg = self.df[['datum', x['series']]].copy()
            dfg = dfg.rename(columns={'datum': 'ds', x['series']: 'y'})

            # Split data into training (2014-2018)
            dfgtrain = dfg.loc[dfg['ds'].dt.year < 2019]

            # Instantiate and fit the model
            model = Prophet(
                changepoint_prior_scale=x['params_grid']['changepoint_prior_scale'],
                growth='linear',
                interval_width=x['params_grid']['interval_width'],
                daily_seasonality=False,
                weekly_seasonality=False
            )

            if x['series'] in ['N02BE', 'R03', 'R06']:
                model.add_seasonality(
                    name='yearly',
                    period=365.25,
                    prior_scale=x['params_grid']['seasonality_prior_scale'],
                    fourier_order=13
                )

            model_fit = model.fit(dfgtrain)

            model_filename = f"model_pkls/{x['series']}_prophet_model.pkl"
            with open(model_filename, 'wb') as pkl_file:
                pickle.dump(model_fit, pkl_file)
            print(f"✓ Model for {x['series']} saved to {model_filename}")

        print("\nTraining completed for all models!")

    def predict(self, series_config, data=None):
        """
        Load trained models and generate predictions

        Args:
            series_config: List of series configurations
            data: Optional DataFrame with new data for prediction.
                  If None, uses the original data file for evaluation.

        Returns:
            Dictionary with prediction results
        """
        print("Starting prediction generation...")

        # Use provided data or fall back to original data
        if data is not None:
            prediction_data = data.copy()
            prediction_data['datum'] = pd.to_datetime(prediction_data['datum'])
        else:
            prediction_data = self.df

        results_df = pd.DataFrame(index=['Prophet MSE', 'Prophet MAPE'], columns=[x['series'] for x in series_config])
        output_data = {}

        for x in series_config:
            # Load the trained model
            model_filename = f"model_pkls/{x['series']}_prophet_model.pkl"
            if not os.path.exists(model_filename):
                print(f"⚠️  Model file not found: {model_filename}")
                continue

            with open(model_filename, 'rb') as pkl_file:
                model = pickle.load(pkl_file)

            # Prepare data for prediction
            if x['series'] not in prediction_data.columns:
                print(f"⚠️  Series {x['series']} not found in data")
                continue

            dfg = prediction_data[['datum', x['series']]].copy()
            dfg = dfg.rename(columns={'datum': 'ds', x['series']: 'y'})

            # Filter out any NaN values
            dfg = dfg.dropna()

            # For evaluation, use 2019 data if available and no custom data provided
            if data is None:
                dfgtest = dfg.loc[dfg['ds'].dt.year == 2019]
            else:
                # Use all available data when custom data is provided
                dfgtest = dfg

            if len(dfgtest) == 0:
                print(f"⚠️  No data available for prediction on {x['series']} (after filtering)")
                continue

            print(f"Debug: {x['series']} - Total data points: {len(dfg)}, Using: {len(dfgtest)}")

            # Generate future dataframe using the exact dates from our data
            future_dates = dfgtest['ds'].tolist()
            future = pd.DataFrame({'ds': future_dates})
            forecast = model.predict(future)

            # Sort both dataframes by date to ensure alignment
            forecast = forecast.sort_values('ds').reset_index(drop=True)
            dfgtest_sorted = dfgtest.sort_values('ds').reset_index(drop=True)

            predictions = forecast['yhat'].values
            real_values = dfgtest_sorted['y'].values

            print(f"Debug: {x['series']} - Forecast points: {len(predictions)}, Actual points: {len(real_values)}")

            if len(predictions) == 0 or len(real_values) == 0:
                print(f"⚠️  No data for {x['series']} - skipping metrics calculation")
                # Still include basic prediction data without metrics
                output_data[x['series']] = {
                    "dates": dfgtest_sorted['ds'].dt.strftime('%Y-%m-%d').tolist(),
                    "predictions": predictions.tolist() if len(predictions) > 0 else [],
                    "note": "No evaluation data available"
                }
                continue

            if len(predictions) != len(real_values):
                print(f"⚠️  Length mismatch for {x['series']}: predictions={len(predictions)}, actual={len(real_values)}")
                # Use the minimum length to avoid errors
                min_len = min(len(predictions), len(real_values))
                predictions = predictions[:min_len]
                real_values = real_values[:min_len]

            # Check if we have enough data points for meaningful metrics
            if len(predictions) < 2:
                print(f"⚠️  Not enough data points for {x['series']} - skipping metrics")
                output_data[x['series']] = {
                    "dates": dfgtest_sorted['ds'].dt.strftime('%Y-%m-%d').tolist(),
                    "predictions": predictions.tolist(),
                    "note": "Insufficient data for metrics"
                }
                continue

            error = mean_squared_error(real_values, predictions)
            perror = mean_absolute_percentage_error(real_values, predictions)

            results_df.loc['Prophet MSE', x['series']] = error
            results_df.loc['Prophet MAPE', x['series']] = perror

            dates = dfgtest['ds'].dt.strftime('%Y-%m-%d').tolist()
            predictions_list = [round(pred, 2) for pred in predictions]

            output_data[x['series']] = {
                "dates": dates,
                "predictions": predictions_list
            }

            print(f"✓ {x['series']} - MSE: {error:.2f}, MAPE: {perror:.2f}%")

        print("\nPrediction completed. Results:")
        print(json.dumps(output_data, indent=4))

        return output_data

# Example usage
if __name__ == "__main__":
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

    # Phase 1: Train models
    # print("Training models...")
    # forecaster.train_models(series_config)

    # Phase 2: Make predictions (with original data for evaluation)
    print("\nGenerating predictions...")
    results = forecaster.predict(series_config)

    # Example: Make predictions with new data
    import pandas as pd
    new_data = pd.DataFrame({
        'datum': pd.date_range('2020-01-01', periods=10, freq='W'),
        'M01AB': [100, 105, 98, 110, 95, 102, 108, 97, 103, 99]
    })
    results = forecaster.predict(series_config, data=new_data)