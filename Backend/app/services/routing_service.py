import osmnx as ox
import networkx as nx


def get_route(source, destination):
    """
    Basic routing endpoint compatibility function.

    This keeps the existing /routing API working.
    The actual road-routing logic is provided by the
    functions below and is used by the optimization service.
    """

    return {
        "source": source,
        "destination": destination,
        "message": "Routing service is working"
    }


def build_road_graph(latitude, longitude, distance=5000):

    return ox.graph_from_point(
        (latitude, longitude),
        dist=distance,
        network_type="drive"
    )


def get_nearest_node(graph, latitude, longitude):

    return ox.distance.nearest_nodes(
        graph,
        longitude,
        latitude
    )


def get_road_distance(
    graph,
    source_lat,
    source_lon,
    destination_lat,
    destination_lon
):

    source_node = get_nearest_node(
        graph,
        source_lat,
        source_lon
    )

    destination_node = get_nearest_node(
        graph,
        destination_lat,
        destination_lon
    )

    try:

        distance = nx.shortest_path_length(
            graph,
            source_node,
            destination_node,
            weight="length"
        )

    except nx.NetworkXNoPath:

        return float("inf")

    return float(distance)


def get_road_path(
    graph,
    source_lat,
    source_lon,
    destination_lat,
    destination_lon
):

    source_node = get_nearest_node(
        graph,
        source_lat,
        source_lon
    )

    destination_node = get_nearest_node(
        graph,
        destination_lat,
        destination_lon
    )

    try:

        path = nx.shortest_path(
            graph,
            source_node,
            destination_node,
            weight="length"
        )

    except nx.NetworkXNoPath:

        return []

    road_path = []

    for node in path:

        latitude = graph.nodes[node]["y"]
        longitude = graph.nodes[node]["x"]

        road_path.append(
            [
                float(latitude),
                float(longitude)
            ]
        )

    return road_path


def build_distance_matrix(graph, locations):

    nodes = []

    for location in locations:

        node = get_nearest_node(
            graph,
            location["latitude"],
            location["longitude"]
        )

        nodes.append(node)

    matrix = []

    for source_node in nodes:

        row = []

        for destination_node in nodes:

            if source_node == destination_node:

                distance = 0.0

            else:

                try:

                    distance = nx.shortest_path_length(
                        graph,
                        source_node,
                        destination_node,
                        weight="length"
                    )

                except nx.NetworkXNoPath:

                    distance = float("inf")

            row.append(
                float(distance)
            )

        matrix.append(row)

    return matrix


def build_route_geometry(
    graph,
    locations,
    route
):

    if not route:

        return []

    # 0 = depot
    # customer index + 1 = matrix node

    node_sequence = [0]

    for customer_index in route:

        node_sequence.append(
            customer_index + 1
        )

    # Return to depot

    node_sequence.append(0)

    complete_path = []

    for i in range(
        len(node_sequence) - 1
    ):

        source_index = node_sequence[i]

        destination_index = node_sequence[i + 1]

        source = locations[source_index]

        destination = locations[destination_index]

        segment = get_road_path(
            graph,
            source["latitude"],
            source["longitude"],
            destination["latitude"],
            destination["longitude"]
        )

        if not segment:

            continue

        if complete_path:

            complete_path.extend(
                segment[1:]
            )

        else:

            complete_path.extend(
                segment
            )

    return complete_path