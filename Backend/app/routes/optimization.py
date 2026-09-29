from fastapi import APIRouter, HTTPException

from app.schemas.optimization import OptimizationRequest
from app.services.qpso_service import optimize_routes


router = APIRouter()


@router.post("/optimization")
def optimization(request: OptimizationRequest):

    try:
        result = optimize_routes(request)

        return result

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Optimization failed: {str(error)}"
        )