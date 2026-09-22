import numpy as np

from app.optimization.constraints import calculate_capacity_penalty
from app.optimization.solution import VehicleRoute


def decode_particle(
    particle,
    num_customers,
    num_vehicles
):
    """
    Convert a continuous QPSO particle into:

    1. Customer delivery order
    2. Vehicle assignment
    """

    order_values = particle[:num_customers]

    vehicle_values = particle[num_customers:]

    customer_order = np.argsort(order_values)

    vehicle_assignment = np.floor(
        vehicle_values * num_vehicles
    ).astype(int)

    vehicle_assignment = np.clip(
        vehicle_assignment,
        0,
        num_vehicles - 1
    )

    routes = []

    for vehicle_id in range(num_vehicles):

        assigned_customers = [
            int(customer_id)
            for customer_id in customer_order
            if vehicle_assignment[customer_id] == vehicle_id
        ]

        routes.append(
            VehicleRoute(
                vehicle_id=vehicle_id,
                customers=assigned_customers
            )
        )

    return routes


def calculate_fitness(
    particle,
    distance_matrix,
    travel_time_matrix,
    traffic_cost_matrix,
    customer_demands,
    vehicle_capacities,
    alpha=1.0,
    beta=1.0,
    gamma=1.0
):
    """
    Calculate fitness for a VRP solution.

    Lower fitness = better solution.
    """

    num_customers = len(customer_demands)

    num_vehicles = len(vehicle_capacities)

    routes = decode_particle(
        particle,
        num_customers,
        num_vehicles
    )

    total_distance = 0.0
    total_time = 0.0
    total_traffic_cost = 0.0

    depot = 0

    for route in routes:

        previous_node = depot

        for customer_id in route.customers:

            node = customer_id + 1

            total_distance += distance_matrix[
                previous_node,
                node
            ]

            total_time += travel_time_matrix[
                previous_node,
                node
            ]

            total_traffic_cost += traffic_cost_matrix[
                previous_node,
                node
            ]

            previous_node = node

        if route.customers:

            total_distance += distance_matrix[
                previous_node,
                depot
            ]

            total_time += travel_time_matrix[
                previous_node,
                depot
            ]

            total_traffic_cost += traffic_cost_matrix[
                previous_node,
                depot
            ]

    penalty = calculate_capacity_penalty(
        routes,
        customer_demands,
        vehicle_capacities
    )

    fitness = (
        alpha * total_distance
        + beta * total_time
        + gamma * total_traffic_cost
        + penalty
    )

    return fitness