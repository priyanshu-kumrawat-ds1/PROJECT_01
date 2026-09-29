import numpy as np

from app.database.queries import get_customers_by_ids
from app.schemas.optimization import OptimizationRequest

from app.optimization.qpso_solver import QPSOSolver
from app.optimization.fitness import (
    calculate_fitness,
    decode_particle
)

from app.services.routing_service import (
    build_road_graph,
    build_distance_matrix
)

from app.services.traffic_service import (
    build_travel_time_matrix,
    build_traffic_cost_matrix
)


def optimize_routes(request: OptimizationRequest):

    # =========================================================
    # 1. Prepare customers and vehicles
    # =========================================================

    customers = request.customers
    vehicles = request.vehicles

    if not customers:
        raise ValueError("At least one customer is required")

    if not vehicles:
        raise ValueError("At least one vehicle is required")

    customer_demands = [
        customer.demand
        for customer in customers
    ]

    vehicle_capacities = [
        vehicle.capacity
        for vehicle in vehicles
    ]

    earliest_times = [
        customer.earliest
        for customer in customers
    ]

    latest_times = [
        customer.latest
        for customer in customers
    ]

    service_times = [
        customer.service_time
        for customer in customers
    ]

    num_customers = len(customers)
    num_vehicles = len(vehicles)

    # =========================================================
    # 2. Get customer coordinates from PostgreSQL/PostGIS
    # =========================================================

    customer_ids = [
        customer.node_id
        for customer in customers
    ]

    db_customers = get_customers_by_ids(customer_ids)

    customer_coordinates = {}

    for row in db_customers:

        customer_id = row[0]

        customer_coordinates[customer_id] = {
            "latitude": float(row[5]),
            "longitude": float(row[6])
        }

    # Make sure every requested customer exists in database
    for customer_id in customer_ids:

        if customer_id not in customer_coordinates:
            raise ValueError(
                f"Customer {customer_id} coordinates not found"
            )

    # =========================================================
    # 3. Depot
    # =========================================================

    # Current prototype depot.
    # Later this will come from the frontend request.

    depot_latitude = 12.9716
    depot_longitude = 77.5946

    # =========================================================
    # 4. Build locations
    # =========================================================

    # Matrix indexing:
    #
    # 0 = depot
    # 1 = first customer
    # 2 = second customer
    # 3 = third customer
    # ...

    locations = [
        {
            "latitude": depot_latitude,
            "longitude": depot_longitude
        }
    ]

    for customer in customers:

        coordinates = customer_coordinates[
            customer.node_id
        ]

        locations.append(
            {
                "latitude": coordinates["latitude"],
                "longitude": coordinates["longitude"]
            }
        )

    # =========================================================
    # 5. Build OSM road graph
    # =========================================================

    graph = build_road_graph(
        depot_latitude,
        depot_longitude,
        distance=5000
    )

    # =========================================================
    # 6. Build real road distance matrix
    # =========================================================

    distance_matrix = build_distance_matrix(
        graph,
        locations
    )

    # =========================================================
    # 7. Traffic context
    # =========================================================

    # Current prototype traffic context.
    #
    # Later these values can come from:
    # frontend / live traffic API / database.

    traffic_context = {
        "day_of_week": "Monday",
        "hour": 20,
        "is_peak": 1,
        "weather": "Rainy",
        "road_capacity": 1500,
        "vehicles": 1318,
        "speed": 20.64,
        "signal_time": 40
    }

    # =========================================================
    # 8. Build LightGBM travel-time matrix
    # =========================================================

    travel_time_matrix = build_travel_time_matrix(
        locations,
        distance_matrix,
        traffic_context
    )

    # =========================================================
    # 9. Build traffic-cost matrix
    # =========================================================

    traffic_cost_matrix = build_traffic_cost_matrix(
        locations,
        distance_matrix,
        traffic_context
    )

    # =========================================================
    # 10. Convert matrices to NumPy
    # =========================================================

    distance_matrix = np.array(
        distance_matrix,
        dtype=float
    )

    travel_time_matrix = np.array(
        travel_time_matrix,
        dtype=float
    )

    traffic_cost_matrix = np.array(
        traffic_cost_matrix,
        dtype=float
    )

    # =========================================================
    # 11. QPSO fitness function
    # =========================================================

    def fitness_function(particle):

        return calculate_fitness(
            particle,
            distance_matrix,
            travel_time_matrix,
            traffic_cost_matrix,
            customer_demands,
            vehicle_capacities,
            earliest_times,
            latest_times,
            service_times
        )

    # =========================================================
    # 12. Run QPSO
    # =========================================================

    dimensions = (
        num_customers
        + num_customers
    )

    solver = QPSOSolver(
        fitness_function=fitness_function,
        dimensions=dimensions,
        num_particles=30,
        max_iterations=100,
        beta=0.5,
        seed=42
    )

    result = solver.solve()

    best_solution = result["best_solution"]
    best_fitness = result["best_fitness"]

    # =========================================================
    # 13. Decode optimized solution
    # =========================================================

    routes = decode_particle(
        best_solution,
        num_customers=num_customers,
        num_vehicles=num_vehicles
    )

    # =========================================================
    # 14. Prepare route results
    # =========================================================

    optimized_routes = []

    total_distance = 0.0
    total_time = 0.0
    total_traffic_cost = 0.0
    total_demand = 0.0

    for route in routes:

        route_distance = 0.0
        route_time = 0.0
        route_traffic_cost = 0.0

        route_path = []

        # Start at depot
        route_path.append(
            [
                depot_latitude,
                depot_longitude
            ]
        )

        previous_node = 0

        # -----------------------------------------------------
        # Visit customers
        # -----------------------------------------------------

        for customer_index in route.customers:

            matrix_node = customer_index + 1

            # Distance
            route_distance += distance_matrix[
                previous_node,
                matrix_node
            ]

            # Travel time
            route_time += travel_time_matrix[
                previous_node,
                matrix_node
            ]

            # Traffic cost
            route_traffic_cost += traffic_cost_matrix[
                previous_node,
                matrix_node
            ]

            # Customer information
            customer = customers[customer_index]

            customer_id = customer.node_id

            coordinates = customer_coordinates[
                customer_id
            ]

            # Add coordinate to frontend route
            route_path.append(
                [
                    coordinates["latitude"],
                    coordinates["longitude"]
                ]
            )

            previous_node = matrix_node

        # -----------------------------------------------------
        # Return to depot
        # -----------------------------------------------------

        if route.customers:

            route_distance += distance_matrix[
                previous_node,
                0
            ]

            route_time += travel_time_matrix[
                previous_node,
                0
            ]

            route_traffic_cost += traffic_cost_matrix[
                previous_node,
                0
            ]

            route_path.append(
                [
                    depot_latitude,
                    depot_longitude
                ]
            )

        # -----------------------------------------------------
        # Route demand
        # -----------------------------------------------------

        route_demand = sum(
            customer_demands[customer_index]
            for customer_index in route.customers
        )

        vehicle_capacity = vehicle_capacities[
            route.vehicle_id
        ]

        utilization = (
            (route_demand / vehicle_capacity) * 100
            if vehicle_capacity > 0
            else 0.0
        )

        vehicle_id = vehicles[
            route.vehicle_id
        ].vehicle_id

        # -----------------------------------------------------
        # Store route
        # -----------------------------------------------------

        optimized_routes.append(
            {
                "vehicle_id": vehicle_id,

                "customers": [
                    customers[customer_index].node_id
                    for customer_index in route.customers
                ],

                "path": route_path,

                "distance": float(
                    route_distance
                ),

                "time": float(
                    route_time
                ),

                "traffic_cost": float(
                    route_traffic_cost
                ),

                "total_demand": float(
                    route_demand
                ),

                "capacity": float(
                    vehicle_capacity
                ),

                "utilization": float(
                    utilization
                )
            }
        )

        # Overall totals
        total_distance += route_distance
        total_time += route_time
        total_traffic_cost += route_traffic_cost
        total_demand += route_demand

    # =========================================================
    # 15. Overall dashboard metrics
    # =========================================================

    vehicles_used = sum(
        1
        for route in routes
        if route.customers
    )

    total_capacity_used = sum(
        vehicle_capacities[
            route.vehicle_id
        ]
        for route in routes
        if route.customers
    )

    overall_utilization = (
        (total_demand / total_capacity_used) * 100
        if total_capacity_used > 0
        else 0.0
    )

    # =========================================================
    # 16. Final frontend response
    # =========================================================

    return {
        "status": "success",

        "message": "Optimization completed",

        "best_fitness": float(
            best_fitness
        ),

        "summary": {
            "total_distance": float(
                total_distance
            ),

            "total_time": float(
                total_time
            ),

            "total_traffic_cost": float(
                total_traffic_cost
            ),

            "total_demand": float(
                total_demand
            ),

            "vehicles_used": vehicles_used,

            "total_vehicles": num_vehicles,

            "overall_utilization": float(
                overall_utilization
            )
        },

        "routes": optimized_routes
    }