from flask import Flask, jsonify
from flask_cors import CORS
import os
import pickle
import pandas as pd
import numpy as np
from datetime import datetime

app = Flask(__name__)
CORS(app)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
SERIES_ORDER = ["M01AB", "M01AE", "N02BA", "N02BE", "N05B", "N05C", "R03", "R06"]
CHART_POINTS = 10
FORECAST_POINTS = 10
PREDICT_NEXT_N = 7

def humanize_number(x):
    try:
        x = float(x)
    except Exception:
        return "0"
    if x >= 1_000_000:
        return f"{round(x/1_000_000, 1)}M"
    if x >= 1_000:
        return f"{round(x/1_000, 0):.0f}K"
    return f"{round(x, 0):.0f}"

def pct_change(curr, prev):
    if prev == 0:
        return 0.0
    return ((curr - prev) / prev) * 100.0

def format_date(d):
    # e.g., 1/01/2019 to match sample roughly; safe cross-platform formatting
    return f"{d.day}/{d.strftime('%m/%Y')}"

def load_models():
    models = {}
    if not os.path.isdir(MODELS_DIR):
        return models
    for fname in os.listdir(MODELS_DIR):
        if fname.endswith("_prophet_model.pkl"):
            series = fname.split("_")[0]  # e.g., "M01AB_prophet_model.pkl" -> "M01AB"
            fpath = os.path.join(MODELS_DIR, fname)
            try:
                with open(fpath, "rb") as f:
                    models[series] = pickle.load(f)
            except Exception:
                continue
    # keep consistent order
    ordered = {s: models[s] for s in SERIES_ORDER if s in models}
    for s, m in models.items():
        if s not in ordered:
            ordered[s] = m
    return ordered

def build_series_payload(series, model):
    # history last 10 actuals
    hist = model.history.copy()
    hist = hist.sort_values("ds")
    hist_tail = hist.tail(CHART_POINTS)
    actual_dates = hist_tail["ds"].dt.to_pydatetime()
    actual_vals = hist_tail["y"].astype(float).tolist()

    # forecast next 10 points; also get fitted yhat for chart
    future = model.make_future_dataframe(periods=FORECAST_POINTS, freq="W")
    forecast = model.predict(future)

    # for chart: use the same 10 labels from history and yhat at those dates
    chart_yhat = (
        forecast.merge(hist_tail[["ds"]], on="ds", how="inner")
        .sort_values("ds")["yhat"].astype(float).tolist()
    )
    chart_labels = [format_date(d) for d in actual_dates]

    # predicted next 7 days (take first 7 rows strictly in the future)
    future_mask = ~forecast["ds"].isin(hist["ds"])
    next_n = forecast[future_mask].head(PREDICT_NEXT_N)
    predicted_sum = float(next_n["yhat"].sum()) if not next_n.empty else 0.0

    # total sales from last 10 actuals
    total_sum = float(np.nansum(actual_vals))

    # trend vs previous 10 actuals
    prev10 = hist.tail(CHART_POINTS * 2).head(CHART_POINTS)
    prev_sum = float(prev10["y"].sum()) if len(prev10) == CHART_POINTS else 0.0
    change_pct = pct_change(total_sum, prev_sum)
    trend = "up" if change_pct > 0 else ("down" if change_pct < 0 else "flat")

    # recommendation
    if trend == "up" and change_pct >= 8:
        rec = f"{series} demand is expected to rise"
    elif trend == "down":
        rec = f"{series} sales are declining, consider marketing push"
    else:
        rec = f"{series} inventory is sufficient for the next 10 days"

    payload = {
        "id": series,  # no name field as requested
        "kpi": {
            "totalSales": {
                "value": humanize_number(total_sum),
                "trend": trend,
                "percentageChange": f"{round(change_pct, 0):.0f}%"
            },
            "predictedSales": {
                "value": humanize_number(predicted_sum),
                "period": "next 7 days",
                "trend": trend,
                "percentageChange": f"{round(change_pct, 0):.0f}%"
            },
            "smartRecommendation": {
                "message": rec
            }
        },
        "salesTrend": {
            "chart": {
                "labels": chart_labels,
                "datasets": [
                    {"label": "Actual Sales", "data": [round(x, 2) for x in actual_vals]},
                    {"label": "Forecasted Sales", "data": [round(x, 2) for x in chart_yhat]},
                ]
            }
        }
    }
    return payload, total_sum, predicted_sum, chart_labels, actual_vals, chart_yhat

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "message": "Drug-sales backend is running",
        "endpoints": [
            "/api/health",
            "/api/dashboard"
        ]
    })

@app.route("/favicon.ico")
def favicon():
    # Avoid 404s for browsers requesting favicon
    return "", 204

@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    models = load_models()
    products = []
    overall_actual_sum = 0.0
    overall_pred_sum = 0.0

    # For overall chart, sum element-wise across series using index alignment
    overall_labels = None
    overall_actual_series = None
    overall_forecast_series = None

    for series, model in models.items():
        prod_payload, total_sum, pred_sum, labels, actual, yhat = build_series_payload(series, model)
        products.append(prod_payload)
        overall_actual_sum += total_sum
        overall_pred_sum += pred_sum

        if overall_labels is None:
            overall_labels = labels
            overall_actual_series = np.array(actual, dtype=float)
            overall_forecast_series = np.array(yhat, dtype=float)
        else:
            # ensure same length; truncate to min length if needed
            m = min(len(overall_actual_series), len(actual))
            overall_actual_series[:m] += np.array(actual[:m], dtype=float)
            overall_forecast_series[:m] += np.array(yhat[:m], dtype=float)

    # overall KPIs based on sums
    # simple trend: infer from product-level average change
    if products:
        pct_values = []
        for p in products:
            try:
                v = float(p["kpi"]["predictedSales"]["percentageChange"].strip("%"))
                pct_values.append(v)
            except Exception:
                pass
        overall_change = np.mean(pct_values) if pct_values else 0.0
    else:
        overall_change = 0.0
        overall_labels = []
        overall_actual_series = np.array([], dtype=float)
        overall_forecast_series = np.array([], dtype=float)

    overall_trend = "up" if overall_change > 0 else ("down" if overall_change < 0 else "flat")
    overall_payload = {
        "kpi": {
            "totalSales": {
                "value": humanize_number(overall_actual_sum),
                "trend": overall_trend,
                "percentageChange": f"{round(overall_change, 0):.0f}%"
            },
            "predictedSales": {
                "value": humanize_number(overall_pred_sum),
                "period": "next 7 days",
                "trend": overall_trend,
                "percentageChange": f"{round(overall_change, 0):.0f}%"
            },
            "smartRecommendation": {
                "message": "Overall sales expected to grow by "
                           f"{round(max(overall_change, 0.0), 0):.0f}% in next 7 days" if overall_change >= 0
                           else "Overall sales may decline; consider promotions"
            }
        },
        "salesTrend": {
            "chart": {
                "labels": overall_labels or [],
                "datasets": [
                    {"label": "Actual Sales", "data": [round(x, 2) for x in (overall_actual_series.tolist() if overall_labels else [])]},
                    {"label": "Forecasted Sales", "data": [round(x, 2) for x in (overall_forecast_series.tolist() if overall_labels else [])]}
                ]
            }
        }
    }

    return jsonify({
        "overall": overall_payload,
        "products": products
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)