def calculate_capacity_penalty(
    routes,
    customer_demands,
    vehicle_capacities
):
    penalty = 0.0

    for route in routes:

        vehicle_id = route.vehicle_id

        capacity = vehicle_capacities[vehicle_id]

        total_demand = sum(
            customer_demands[customer_id]
            for customer_id in route.customers
        )

        if total_demand > capacity:
            excess = total_demand - capacity

            penalty += excess * 1000.0

    return penalty