
from app.schemas.routing import RouteRequest


def get_route(request: RouteRequest):
    return {
        "source": request.source,
        "destination": request.destination,
        "message": "Routing service is working"
    }