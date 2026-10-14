"""Punto de entrada de la API: `uvicorn app.main:app`."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.config import settings
from app.errors import register_error_handlers


def create_app() -> FastAPI:
    app = FastAPI(
        title="Conciliador de facturas y retenciones",
        description="Cruza facturas.csv contra contabilidad.csv y reporta inconsistencias.",
        version="0.1.0",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )
    register_error_handlers(app)
    app.include_router(router)
    return app


app = create_app()
