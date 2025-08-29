import os
import math
import warnings
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from prophet import Prophet
from sklearn.metrics import mean_squared_error, mean_absolute_percentage_error

# Load CSV from repository path
CSV_PATH = os.path.join(os.path.dirname(__file__), 'salesweekly.csv')
df = pd.read_csv(CSV_PATH)

# Plot grid setup
subplotindex=0
numrows=4
numcols=2
fig, ax = plt.subplots(numrows, numcols, figsize=(18,15))
plt.subplots_adjust(wspace=0.1, hspace=0.3)

warnings.filterwarnings("ignore")

# Series configs
M01AB= {'series':'M01AB','params_grid':{'changepoint_prior_scale':30,'interval_width':0.0005}}
M01AE= {'series':'M01AE','params_grid':{'changepoint_prior_scale':0.05,'interval_width':0.0005}}
N02BA= {'series':'N02BA','params_grid':{'changepoint_prior_scale':0.005,'interval_width':0.0005}}
N02BE= {'series':'N02BE','params_grid':{'changepoint_prior_scale':10,'seasonality_prior_scale':170,'interval_width':0.0005}}
N05B= {'series':'N05B','params_grid':{'changepoint_prior_scale':5,'interval_width':0.0005}}
N05C= {'series':'N05C','params_grid':{'changepoint_prior_scale':0.5,'interval_width':0.005}}
R03= {'series':'R03','params_grid':{'changepoint_prior_scale':0.05,'seasonality_prior_scale':160,'interval_width':0.0005}}
R06= {'series':'R06','params_grid':{'changepoint_prior_scale':0.05,'seasonality_prior_scale':120,'interval_width':0.0005}}

r=[M01AB,M01AE,N02BA,N02BE,N05B,N05C,R03,R06]

# Prepare results dataframe
series_cols = [x['series'] for x in r]
resultsRollingdf = pd.DataFrame(index=['Prophet MSE','Prophet MAPE'], columns=series_cols, dtype=float)

for x in r:
    rowindex=math.floor(subplotindex/numcols)
    colindex=subplotindex-(rowindex*numcols)
    dfg=df[['datum',x['series']]].copy()
    dfg = dfg.rename(columns={'datum': 'ds', x['series']: 'y'})
    # ensure datetime
    dfg['ds'] = pd.to_datetime(dfg['ds'])
    size = len(dfg) - 50
    size = max(size, 1)  # guard
    dfgtrain=dfg.iloc[:size, :]
    dfgtest=dfg.iloc[size:, :]
    history = dfgtrain.copy()
    predictions = []

    for t in dfgtest['ds'].values:
        model = Prophet(
            changepoint_prior_scale=x['params_grid']['changepoint_prior_scale'],
            growth='linear',
            interval_width=x['params_grid']['interval_width'],
            daily_seasonality=False,
            weekly_seasonality=False
        )
        if x['series'] in ('N02BE','R03','R06'):
            model = model.add_seasonality(
                name='yearly',
                period=365.25,
                prior_scale=x['params_grid']['seasonality_prior_scale'],
                fourier_order=13
            )
        model_fit = model.fit(history)
        future = model.make_future_dataframe(periods=1, freq='W')
        output = model.predict(future)
        yhat = output.loc[output['ds']==pd.Timestamp(t), 'yhat'].values[0]
        predictions.append(yhat)
        obs = dfgtest.loc[dfgtest['ds']==pd.Timestamp(t), 'y'].values[0]
        dd = pd.DataFrame([[pd.Timestamp(t), obs]], columns=['ds','y'])
        history = pd.concat([history, dd], ignore_index=True)

    # Console preview of first few points: date, actual, predicted
    preview = pd.DataFrame({
        'ds': dfgtest['ds'].values,
        'actual': dfgtest['y'].values,
        'predicted': predictions
    }).head(5)
    print(x['series'])
    print(preview.to_string(index=False))

    error = mean_squared_error(dfgtest['y'].values, predictions)
    perror = mean_absolute_percentage_error(dfgtest['y'].values, predictions)
    resultsRollingdf.loc['Prophet MSE',x['series']] = error
    resultsRollingdf.loc['Prophet MAPE',x['series']] = perror
    # Plot with date-aware x-axis
    ax[rowindex,colindex].plot(dfgtest['ds'], dfgtest['y'].values, color='blue', label='Actual')
    ax[rowindex,colindex].plot(dfgtest['ds'], predictions, color='red', linestyle='--', label='Predicted')

    # Annotate train/test split
    split_date = dfgtest['ds'].iloc[0]
    ax[rowindex,colindex].axvline(split_date, color='#888', linestyle=':', linewidth=1)
    ax[rowindex,colindex].axvspan(split_date, dfgtest['ds'].iloc[-1], color='#f0f0f0', alpha=0.5, label='Test range' if subplotindex==1 else None)

    # Title with ranges
    ax[rowindex,colindex].set_title(
        f"{x['series']} (MSE={error:.2f}, MAPE={perror:.2f}%)\n"
        f"Train: {dfgtrain['ds'].iloc[0].date()} → {dfgtrain['ds'].iloc[-1].date()} | "
        f"Test: {dfgtest['ds'].iloc[0].date()} → {dfgtest['ds'].iloc[-1].date()}"
    )

    # Year ticks on x-axis
    ax[rowindex,colindex].xaxis.set_major_locator(mdates.YearLocator())
    ax[rowindex,colindex].xaxis.set_major_formatter(mdates.DateFormatter('%Y'))
    ax[rowindex,colindex].legend(loc='upper left')
    subplotindex += 1

print("Results (rolling):")
print(resultsRollingdf)
plt.show()