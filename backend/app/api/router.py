from fastapi import APIRouter

from app.api.v1 import claims, health, upload

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(claims.router)
api_router.include_router(upload.router)

# Registered once implemented:
# from app.api.v1 import documents, reports
# api_router.include_router(documents.router)
# api_router.include_router(reports.router)
