from fastapi import APIRouter

from app.schemas.traffic import TrafficRequest
from app.services.traffic_service import get_predicted_travel_time


router = APIRouter()


@router.post("/traffic")
def predict_traffic(data: TrafficRequest):
    predicted_time = get_predicted_travel_time(
        data.model_dump()
    )

    return {
        "predicted_travel_time": predicted_time
    }