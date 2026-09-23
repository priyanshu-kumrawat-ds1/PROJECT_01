import osmnx as ox
import networkx as nx


def build_road_graph(latitude, longitude, distance=5000):
    """
    Download the drivable road network around a center point.

    Parameters:
        latitude: center latitude
        longitude: center longitude
        distance: radius around the center in meters

    Returns:
        OSMnx road graph
    """

    return ox.graph_from_point(
        (latitude, longitude),
        dist=distance,
        network_type="drive"
    )


def get_road_distance(
    graph,
    source_lat,
    source_lon,
    destination_lat,
    destination_lon
):
    """
    Calculate the shortest road distance between two coordinates.

    Returns:
        Distance in meters.
    """

    source_node = ox.distance.nearest_nodes(
        graph,
        source_lon,
        source_lat
    )

    destination_node = ox.distance.nearest_nodes(
        graph,
        destination_lon,
        destination_lat
    )

    path = nx.shortest_path(
        graph,
        source_node,
        destination_node,
        weight="length"
    )

    distance = 0.0

    for u, v in zip(path[:-1], path[1:]):
        distance += graph[u][v][0]["length"]

    return float(distance)


def build_distance_matrix(graph, locations):
    """
    Build a pairwise shortest-road-distance matrix.

    Parameters:
        graph: OSMnx road graph

        locations:
            List of dictionaries:
            [
                {
                    "latitude": 12.9716,
                    "longitude": 77.5946
                },
                ...
            ]

    Returns:
        2D list containing distances in meters.
    """

    nodes = []

    # Convert every coordinate into its nearest road node
    for location in locations:
        node = ox.distance.nearest_nodes(
            graph,
            location["longitude"],
            location["latitude"]
        )

        nodes.append(node)

    matrix = []

    # Calculate shortest road distance
    # between every pair of locations
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

            row.append(float(distance))

        matrix.append(row)

    return matrix