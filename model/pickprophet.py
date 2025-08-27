import pandas as pd
from prophet import Prophet
import matplotlib.pyplot as plt
from sklearn.metrics import mean_squared_error, mean_absolute_percentage_error
import math
import json
import warnings
import pickle

df = pd.read_csv(r'C:\Users\Rahul\OneDrive\Desktop\cts project\salesweekly.csv')


df['datum'] = pd.to_datetime(df['datum'])


subplotindex=0
numrows=4
numcols=2
fig, ax = plt.subplots(numrows, numcols, figsize=(18,15))
plt.subplots_adjust(wspace=0.1, hspace=0.3)
warnings.filterwarnings("ignore")


M01AB = {'series':'M01AB','params_grid':{'changepoint_prior_scale':30,'interval_width':0.0005}}
M01AE = {'series':'M01AE','params_grid':{'changepoint_prior_scale':0.05,'interval_width':0.0005}}
N02BA = {'series':'N02BA','params_grid':{'changepoint_prior_scale':0.005,'interval_width':0.0005}}
N02BE = {'series':'N02BE','params_grid':{'changepoint_prior_scale':10,'seasonality_prior_scale':170,'interval_width':0.0005}}
N05B = {'series':'N05B','params_grid':{'changepoint_prior_scale':5,'interval_width':0.0005}}
N05C = {'series':'N05C','params_grid':{'changepoint_prior_scale':0.5,'interval_width':0.005}}
R03 = {'series':'R03','params_grid':{'changepoint_prior_scale':0.05,'seasonality_prior_scale':160,'interval_width':0.0005}}
R06 = {'series':'R06','params_grid':{'changepoint_prior_scale':0.05,'seasonality_prior_scale':120,'interval_width':0.0005}}
r = [M01AB, M01AE, N02BA, N02BE, N05B, N05C, R03, R06]


results_df = pd.DataFrame(index=['Prophet MSE', 'Prophet MAPE'], columns=[x['series'] for x in r])


output_data = {}
for x in r:
    rowindex=math.floor(subplotindex/numcols)
    colindex=subplotindex-(rowindex*numcols)
    
   
    dfg = df[['datum', x['series']]].copy()
    dfg = dfg.rename(columns={'datum': 'ds', x['series']: 'y'})
    
    # Split data into training (2014-2018) and testing (2019)
    dfgtrain = dfg.loc[dfg['ds'].dt.year < 2019]
    dfgtest = dfg.loc[dfg['ds'].dt.year == 2019]
    
    # Instantiate and fit the model
    model = Prophet(changepoint_prior_scale=x['params_grid']['changepoint_prior_scale'],
                    growth='linear',
                    interval_width=x['params_grid']['interval_width'],
                    daily_seasonality=False,
                    weekly_seasonality=False)
    
    if(x['series'] in ['N02BE', 'R03', 'R06']):
        model.add_seasonality(
            name='yearly',
            period=365.25,
            prior_scale=x['params_grid']['seasonality_prior_scale'],
            fourier_order=13)
            
    model_fit = model.fit(dfgtrain)


    model_filename = f"{x['series']}_prophet_model.pkl"
    with open(model_filename, 'wb') as pkl_file:
        pickle.dump(model_fit, pkl_file)
    print(f"Model for {x['series']} saved to {model_filename}")
 
    
 
    future = model.make_future_dataframe(periods=len(dfgtest), freq='W')
    forecast = model.predict(future)
    
    
    predictions = forecast.loc[forecast['ds'].isin(dfgtest['ds'])]['yhat'].values
    real_values = dfgtest['y'].values
    

    error = mean_squared_error(real_values, predictions)
    perror = mean_absolute_percentage_error(real_values, predictions)
    
 
    results_df.loc['Prophet MSE',x['series']]=error
    results_df.loc['Prophet MAPE',x['series']]=perror
    
    dates = dfgtest['ds'].dt.strftime('%Y-%m-%d').tolist()
    predictions_list = [round(pred, 2) for pred in predictions]
    
    output_data[x['series']] = {
        "dates": dates,
        "predictions": predictions_list
    }
    
 
    ax[rowindex,colindex].set_title(x['series'] + f' (MSE={error:.2f}, MAPE={perror:.2f}%)')
    ax[rowindex,colindex].plot(real_values, label='Real')
    ax[rowindex,colindex].plot(predictions, color='red', label='Predicted')
    ax[rowindex,colindex].legend(loc='upper left')
    
    
    x_ticks = range(0, len(dfgtest), 10)
    ax[rowindex,colindex].set_xticks(x_ticks)
    ax[rowindex,colindex].set_xticklabels([dfgtest['ds'].iloc[i].strftime('%Y-%m-%d') for i in x_ticks], rotation=45, ha='right')
    subplotindex=subplotindex+1

plt.tight_layout()
plt.savefig('prophet_predictions.png')
plt.show()


print(json.dumps(output_data, indent=4))