from pydantic import BaseModel
from typing import List


class Customer(BaseModel):
    node_id: int
    demand: float
    earliest: float
    latest: float
    service_time: float


class Vehicle(BaseModel):
    vehicle_id: int
    capacity: float


class OptimizationRequest(BaseModel):
    depot: int
    customers: List[Customer]
    vehicles: List[Vehicle]