import lightgbm as lgb
import pandas as pd


MODEL_PATH = "app/ml/lightgbm_model.txt"


FEATURES = [
    "lat_src",
    "lon_src",
    "lat_dest",
    "lon_dest",
    "distance",
    "day_of_week",
    "hour",
    "is_peak",
    "weather",
    "road_capacity",
    "vehicles",
    "speed",
    "signal_time"
]


model = lgb.Booster(
    model_file=MODEL_PATH
)


def predict_travel_time(data):
    df = pd.DataFrame([data])

    df["day_of_week"] = df["day_of_week"].astype("category")
    df["weather"] = df["weather"].astype("category")

    df = df[FEATURES]

    prediction = model.predict(df)

    return float(prediction[0])