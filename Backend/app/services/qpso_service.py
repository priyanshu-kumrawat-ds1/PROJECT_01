import numpy as np

from app.schemas.optimization import OptimizationRequest

from app.optimization.qpso_solver import QPSOSolver

from app.optimization.fitness import (
    calculate_fitness,
    decode_particle
)


# --------------------------------------------------
# TEST MATRICES
# --------------------------------------------------

distance_matrix = np.array([
    [0, 5, 8, 6, 7],
    [5, 0, 4, 7, 3],
    [8, 4, 0, 3, 6],
    [6, 7, 3, 0, 4],
    [7, 3, 6, 4, 0]
], dtype=float)


travel_time_matrix = np.array([
    [0, 10, 16, 12, 14],
    [10, 0, 8, 14, 6],
    [16, 8, 0, 6, 12],
    [12, 14, 6, 0, 8],
    [14, 6, 12, 8, 0]
], dtype=float)


traffic_cost_matrix = np.array([
    [0, 2, 4, 3, 2],
    [2, 0, 2, 4, 1],
    [4, 2, 0, 1, 3],
    [3, 4, 1, 0, 2],
    [2, 1, 3, 2, 0]
], dtype=float)


# --------------------------------------------------
# OPTIMIZATION SERVICE
# --------------------------------------------------

def optimize_routes(request: OptimizationRequest):

    customer_demands = [
        customer.demand
        for customer in request.customers
    ]

    vehicle_capacities = [
        vehicle.capacity
        for vehicle in request.vehicles
    ]

    num_customers = len(customer_demands)
    num_vehicles = len(vehicle_capacities)

    dimensions = num_customers + num_customers

    # --------------------------------------------------
    # FITNESS FUNCTION
    # --------------------------------------------------

    def fitness_function(particle):

        return calculate_fitness(
            particle,
            distance_matrix,
            travel_time_matrix,
            traffic_cost_matrix,
            customer_demands,
            vehicle_capacities
        )

    # --------------------------------------------------
    # CREATE QPSO SOLVER
    # --------------------------------------------------

    solver = QPSOSolver(
        fitness_function=fitness_function,
        dimensions=dimensions,
        num_particles=30,
        max_iterations=100,
        beta=0.5,
        seed=42
    )

    # --------------------------------------------------
    # RUN QPSO
    # --------------------------------------------------

    result = solver.solve()

    best_solution = result["best_solution"]
    best_fitness = result["best_fitness"]

    # --------------------------------------------------
    # DECODE BEST SOLUTION
    # --------------------------------------------------

    routes = decode_particle(
        best_solution,
        num_customers=num_customers,
        num_vehicles=num_vehicles
    )

    # --------------------------------------------------
    # BUILD ROUTE RESPONSE
    # --------------------------------------------------

    optimized_routes = []

    for route in routes:

        total_demand = sum(
            customer_demands[customer_id]
            for customer_id in route.customers
        )

        optimized_routes.append({
            "vehicle_id": route.vehicle_id,
            "customers": route.customers,
            "total_demand": total_demand,
            "capacity": vehicle_capacities[route.vehicle_id]
        })

    # --------------------------------------------------
    # RESPONSE
    # --------------------------------------------------

    return {
        "message": "Optimization completed",
        "best_fitness": float(best_fitness),
        "routes": optimized_routes
    }