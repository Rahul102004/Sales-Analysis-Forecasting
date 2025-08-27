#!/usr/bin/env python3
"""
Streamlit Demo for Sales Forecasting
A user-friendly interface for uploading CSV data and getting sales predictions using ProphetForecaster directly.
"""

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import io
import json
from datetime import datetime, timedelta
import numpy as np
from pathlib import Path
from services.prophet_forecaster import ProphetForecaster

# Page configuration
st.set_page_config(
    page_title="Sales Forecasting Demo",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
    }
    .metric-card {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 4px solid #1f77b4;
    }
    .prediction-card {
        background-color: #e8f4fd;
        padding: 1rem;
        border-radius: 0.5rem;
        border: 1px solid #1f77b4;
        margin: 0.5rem 0;
    }
    .error-message {
        background-color: #ffebee;
        color: #c62828;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 4px solid #c62828;
    }
    .success-message {
        background-color: #e8f5e8;
        color: #2e7d32;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 4px solid #2e7d32;
    }
</style>
""", unsafe_allow_html=True)

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

def check_models_exist():
    """Check if trained models exist"""
    model_files = [
        'model_pkls/M01AB_prophet_model.pkl',
        'model_pkls/M01AE_prophet_model.pkl',
        'model_pkls/N02BA_prophet_model.pkl',
        'model_pkls/N02BE_prophet_model.pkl',
        'model_pkls/N05B_prophet_model.pkl',
        'model_pkls/N05C_prophet_model.pkl',
        'model_pkls/R03_prophet_model.pkl',
        'model_pkls/R06_prophet_model.pkl'
    ]
    
    existing_models = [f for f in model_files if Path(f).exists()]
    return len(existing_models) > 0, existing_models

def predict_with_forecaster(data_df):
    """Use ProphetForecaster directly to get predictions"""
    try:
        forecaster = ProphetForecaster()
        
        # Check which series are available in the uploaded data
        available_series = []
        for config in SERIES_CONFIG:
            if config['series'] in data_df.columns:
                available_series.append(config)
        
        if not available_series:
            return False, "No valid series found in data"
        
        # Generate predictions
        predictions = forecaster.predict(available_series, data=data_df)
        
        return True, predictions
    except Exception as e:
        return False, str(e)

def create_sample_data():
    """Create sample data for demonstration"""
    dates = pd.date_range(start='2020-01-01', end='2023-12-31', freq='W')
    
    # Generate realistic sales data with trends and seasonality
    np.random.seed(42)
    
    data = {
        'datum': dates,
        'M01AB': 100 + 0.5 * np.arange(len(dates)) + 10 * np.sin(2 * np.pi * np.arange(len(dates)) / 52) + np.random.normal(0, 5, len(dates)),
        'M01AE': 50 + 0.3 * np.arange(len(dates)) + 8 * np.sin(2 * np.pi * np.arange(len(dates)) / 52) + np.random.normal(0, 3, len(dates)),
        'N02BA': 200 + 0.8 * np.arange(len(dates)) + 15 * np.sin(2 * np.pi * np.arange(len(dates)) / 52) + np.random.normal(0, 8, len(dates)),
        'N02BE': 75 + 0.4 * np.arange(len(dates)) + 12 * np.sin(2 * np.pi * np.arange(len(dates)) / 52) + np.random.normal(0, 4, len(dates)),
        'N05B': 120 + 0.6 * np.arange(len(dates)) + 9 * np.sin(2 * np.pi * np.arange(len(dates)) / 52) + np.random.normal(0, 6, len(dates)),
        'N05C': 80 + 0.2 * np.arange(len(dates)) + 7 * np.sin(2 * np.pi * np.arange(len(dates)) / 52) + np.random.normal(0, 3, len(dates)),
        'R03': 60 + 0.3 * np.arange(len(dates)) + 6 * np.sin(2 * np.pi * np.arange(len(dates)) / 52) + np.random.normal(0, 2, len(dates)),
        'R06': 40 + 0.1 * np.arange(len(dates)) + 5 * np.sin(2 * np.pi * np.arange(len(dates)) / 52) + np.random.normal(0, 2, len(dates))
    }
    
    df = pd.DataFrame(data)
    # Ensure no negative values
    for col in df.columns:
        if col != 'datum':
            df[col] = df[col].clip(lower=0)
    
    return df

def plot_predictions(historical_data, predictions_data, series_name):
    """Create an interactive plot showing historical data and predictions"""
    
    # Prepare historical data
    hist_df = pd.DataFrame({
        'date': historical_data['datum'],
        'value': historical_data[series_name],
        'type': 'Historical'
    })
    
    # Check if series exists in predictions
    if series_name not in predictions_data:
        st.warning(f"No predictions available for {series_name}")
        return None
    
    # Prepare prediction data - handle the actual API response structure
    series_predictions = predictions_data[series_name]
    
    if 'dates' not in series_predictions or 'predictions' not in series_predictions:
        st.warning(f"Invalid prediction format for {series_name}")
        return None
    
    # Convert dates to datetime
    pred_dates = pd.to_datetime(series_predictions['dates'])
    pred_values = series_predictions['predictions']
    
    # Create the plot
    fig = go.Figure()
    
    # Add historical data
    fig.add_trace(go.Scatter(
        x=hist_df['date'],
        y=hist_df['value'],
        mode='lines+markers',
        name='Historical Data',
        line=dict(color='#1f77b4', width=2),
        marker=dict(size=4)
    ))
    
    # Add prediction line
    fig.add_trace(go.Scatter(
        x=pred_dates,
        y=pred_values,
        mode='lines+markers',
        name='Prediction',
        line=dict(color='#ff7f0e', width=2, dash='dash'),
        marker=dict(size=4, color='#ff7f0e')
    ))
    
    fig.update_layout(
        title=f'{series_name} Sales Forecast',
        xaxis_title='Date',
        yaxis_title='Sales',
        hovermode='x unified',
        template='plotly_white',
        height=400
    )
    
    return fig

def main():
    """Main Streamlit application"""
    
    # Header
    st.markdown('<h1 class="main-header">📊 Sales Forecasting Demo</h1>', unsafe_allow_html=True)
    
    # Sidebar
    st.sidebar.title("🔧 Configuration")
    
    # Check if models exist
    models_exist, existing_models = check_models_exist()
    
    if models_exist:
        st.sidebar.markdown('<div class="success-message">✅ Trained Models Found</div>', unsafe_allow_html=True)
        st.sidebar.write(f"**Available Models:** {len(existing_models)}")
        for model in existing_models:
            st.sidebar.write(f"• {Path(model).stem}")
    else:
        st.sidebar.markdown('<div class="error-message">❌ No Trained Models Found</div>', unsafe_allow_html=True)
        st.sidebar.write("Please train the models first:")
        st.sidebar.code("python services/prophet_forecaster.py")
        st.stop()
    
    # Main content
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.subheader("📁 Upload Your Data")
        st.write("Upload a CSV file with your sales data to get predictions.")
        
        # File upload
        uploaded_file = st.file_uploader(
            "Choose a CSV file",
            type=['csv'],
            help="CSV file should contain a 'datum' column with dates and series columns (M01AB, M01AE, etc.)"
        )
        
        # Sample data option
        use_sample = st.checkbox("Use sample data for demonstration", value=False)
        
        if use_sample:
            st.info("Using sample data for demonstration purposes.")
            sample_df = create_sample_data()
            st.write("**Sample Data Preview:**")
            st.dataframe(sample_df.head(10))
            
            # Convert sample data to CSV for upload
            csv_buffer = io.StringIO()
            sample_df.to_csv(csv_buffer, index=False)
            csv_buffer.seek(0)
            
            # Create a file-like object
            sample_file = io.BytesIO(csv_buffer.getvalue().encode())
            sample_file.name = "sample_data.csv"
            
            uploaded_file = sample_file
    
    with col2:
        st.subheader("📋 Expected Format")
        st.write("Your CSV should have:")
        st.write("- **datum**: Date column (YYYY-MM-DD)")
        st.write("- **Series columns**: M01AB, M01AE, N02BA, etc.")
        
        # Show available series
        st.write("**Available Series:**")
        for config in SERIES_CONFIG:
            st.write(f"- {config['series']}")
    
    # Process uploaded file
    if uploaded_file is not None:
        st.markdown("---")
        st.subheader("🔮 Generate Predictions")
        
        if st.button("🚀 Get Predictions", type="primary"):
            with st.spinner("Processing your data and generating predictions..."):
                # Read the uploaded file
                try:
                    data_df = pd.read_csv(uploaded_file)
                    data_df['datum'] = pd.to_datetime(data_df['datum'])
                    
                    # Get predictions using the forecaster directly
                    success, result = predict_with_forecaster(data_df)
                    
                    if success:
                        st.markdown('<div class="success-message">✅ Predictions generated successfully!</div>', unsafe_allow_html=True)
                        
                        # Display metadata
                        col1, col2, col3, col4 = st.columns(4)
                        
                        with col1:
                            st.metric("Data Rows", len(data_df))
                        
                        with col2:
                            st.metric("Date Range", f"{data_df['datum'].min().strftime('%Y-%m-%d')} to {data_df['datum'].max().strftime('%Y-%m-%d')}")
                        
                        with col3:
                            st.metric("Available Series", len(result))
                        
                        with col4:
                            missing_series = [config['series'] for config in SERIES_CONFIG if config['series'] not in result]
                            st.metric("Missing Series", len(missing_series))
                        
                        # Display predictions
                        st.subheader("📈 Prediction Results")
                        
                        # Create tabs for each series
                        if result:
                            tab_names = list(result.keys())
                            tabs = st.tabs(tab_names)
                            
                            for i, series_name in enumerate(tab_names):
                                with tabs[i]:
                                    # Create plot
                                    fig = plot_predictions(data_df, result, series_name)
                                    if fig:
                                        st.plotly_chart(fig, use_container_width=True)
                                    
                                    # Show prediction statistics
                                    series_pred = result[series_name]
                                    if 'predictions' in series_pred and series_pred['predictions']:
                                        col1, col2, col3 = st.columns(3)
                                        
                                        with col1:
                                            st.metric("Predictions", len(series_pred['predictions']))
                                        
                                        with col2:
                                            avg_pred = np.mean(series_pred['predictions'])
                                            st.metric("Avg Prediction", f"{avg_pred:.2f}")
                                        
                                        with col3:
                                            max_pred = np.max(series_pred['predictions'])
                                            st.metric("Max Prediction", f"{max_pred:.2f}")
                                        
                                        # Show prediction table
                                        st.write("**Detailed Predictions:**")
                                        pred_df = pd.DataFrame({
                                            'Date': series_pred['dates'],
                                            'Prediction': series_pred['predictions']
                                        })
                                        st.dataframe(pred_df, use_container_width=True)
                                    else:
                                        st.warning("No predictions available for this series")
                        
                        # Download results
                        st.subheader("💾 Download Results")
                        json_str = json.dumps(result, indent=2, default=str)
                        st.download_button(
                            label="📥 Download Predictions (JSON)",
                            data=json_str,
                            file_name=f"sales_predictions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                            mime="application/json"
                        )
                        
                    else:
                        st.markdown(f'<div class="error-message">❌ Error: {result}</div>', unsafe_allow_html=True)
                        
                except Exception as e:
                    st.markdown(f'<div class="error-message">❌ Error reading file: {str(e)}</div>', unsafe_allow_html=True)
    
    # Footer
    st.markdown("---")
    st.markdown("""
    <div style="text-align: center; color: #666; font-size: 0.8rem;">
        Built with Streamlit • Powered by Prophet • Direct Forecaster Integration
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()
