from fastapi import FastAPI
from app.routes import health, routing, traffic, optimization

app = FastAPI(
    title="Quantum-Inspired Intelligent Traffic Route Optimization",
    description="Backend API for traffic-aware vehicle routing using QPSO.",
    version="1.0.0"
)


app.include_router(health.router)
app.include_router(routing.router)
app.include_router(traffic.router)
app.include_router(optimization.router)


@app.get("/")
def root():
    return {
        "message": "Backend is running"
    }