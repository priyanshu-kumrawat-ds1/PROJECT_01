from fastapi import APIRouter

from app.schemas.optimization import OptimizationRequest
from app.services.qpso_service import optimize_routes

router = APIRouter()


@router.post("/optimization")
def optimization(request: OptimizationRequest):
    return optimize_routes(request)