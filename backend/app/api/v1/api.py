from fastapi import APIRouter
from app.api.v1.endpoints import auth, tasks, categories, analytics, export, agent

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(export.router, prefix="/export", tags=["Export"])
api_router.include_router(agent.router, prefix="/agent", tags=["Agentic AI"])
