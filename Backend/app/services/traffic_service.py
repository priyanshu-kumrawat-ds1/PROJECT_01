from app.ml.predict import predict_travel_time


def get_predicted_travel_time(data):
    return predict_travel_time(data)


def build_travel_time_matrix(
    locations,
    distance_matrix,
    traffic_context
):
    """
    Build a predicted travel-time matrix using LightGBM.

    locations:
        List of dictionaries containing:
        {
            "latitude": float,
            "longitude": float
        }

    distance_matrix:
        Road-distance matrix in meters.

    traffic_context:
        Traffic conditions used for the prediction, for example:
        {
            "day_of_week": "Monday",
            "hour": 20,
            "is_peak": 1,
            "weather": "Rainy",
            "road_capacity": 1500,
            "vehicles": 1318,
            "speed": 20.64,
            "signal_time": 40
        }

    Returns:
        Travel-time matrix in minutes.
    """

    matrix = []

    for i, source in enumerate(locations):

        row = []

        for j, destination in enumerate(locations):

            # Same location = zero travel time
            if i == j:
                row.append(0.0)
                continue

            distance_meters = distance_matrix[i][j]

            if distance_meters == float("inf"):
                row.append(float("inf"))
                continue

            data = {
                "lat_src": source["latitude"],
                "lon_src": source["longitude"],
                "lat_dest": destination["latitude"],
                "lon_dest": destination["longitude"],
                "distance": distance_meters / 1000.0,
                "day_of_week": traffic_context["day_of_week"],
                "hour": traffic_context["hour"],
                "is_peak": traffic_context["is_peak"],
                "weather": traffic_context["weather"],
                "road_capacity": traffic_context["road_capacity"],
                "vehicles": traffic_context["vehicles"],
                "speed": traffic_context["speed"],
                "signal_time": traffic_context["signal_time"]
            }

            predicted_time = predict_travel_time(data)

            row.append(float(predicted_time))

        matrix.append(row)

    return matrix