from app.ml.predict import predict_travel_time


def get_predicted_travel_time(data):
    """
    Predict travel time using the trained LightGBM model.
    """
    return predict_travel_time(data)


def build_travel_time_matrix(
    locations,
    distance_matrix,
    traffic_context
):
    """
    Build a travel-time matrix using LightGBM.

    Matrix values are predicted travel time in minutes.
    """

    matrix = []

    for i, source in enumerate(locations):

        row = []

        for j, destination in enumerate(locations):

            # Same location
            if i == j:
                row.append(0.0)
                continue

            distance_meters = distance_matrix[i][j]

            # No road connection
            if distance_meters == float("inf"):
                row.append(float("inf"))
                continue

            distance_km = distance_meters / 1000.0

            data = {
                "lat_src": source["latitude"],
                "lon_src": source["longitude"],
                "lat_dest": destination["latitude"],
                "lon_dest": destination["longitude"],
                "distance": distance_km,
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

            row.append(
                float(predicted_time)
            )

        matrix.append(row)

    return matrix


def build_traffic_cost_matrix(
    locations,
    distance_matrix,
    traffic_context
):
    """
    Build traffic-cost matrix.

    Traffic cost represents the additional travel time
    caused by traffic compared with expected travel time.

    Formula:

        expected_time =
            (distance_km / speed) * 60

        traffic_cost =
            max(0, predicted_time - expected_time)

    Time is measured in minutes.
    """

    matrix = []

    speed = traffic_context["speed"]

    if speed <= 0:
        raise ValueError(
            "Traffic speed must be greater than zero"
        )

    for i, source in enumerate(locations):

        row = []

        for j, destination in enumerate(locations):

            # Same location
            if i == j:
                row.append(0.0)
                continue

            distance_meters = distance_matrix[i][j]

            # No road connection
            if distance_meters == float("inf"):
                row.append(float("inf"))
                continue

            distance_km = distance_meters / 1000.0

            # Expected travel time without traffic
            expected_time = (
                distance_km / speed
            ) * 60.0

            # Prepare LightGBM input
            data = {
                "lat_src": source["latitude"],
                "lon_src": source["longitude"],
                "lat_dest": destination["latitude"],
                "lon_dest": destination["longitude"],
                "distance": distance_km,
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

            # Additional time caused by traffic
            traffic_cost = max(
                0.0,
                predicted_time - expected_time
            )

            row.append(
                float(traffic_cost)
            )

        matrix.append(row)

    return matrix