"""Punto de entrada de la API: `uvicorn app.main:app`."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.routes import router
from app.config import settings
from app.errors import catch_unhandled_errors, register_error_handlers


def create_app() -> FastAPI:
    app = FastAPI(
        title="Conciliador de facturas y retenciones",
        description="Cruza facturas.csv contra contabilidad.csv y reporta inconsistencias.",
        version="0.1.0",
    )
    # El último middleware añadido es el más externo: CORS debe envolver al captura-errores
    # para que también los 500 lleven cabeceras CORS.
    app.add_middleware(BaseHTTPMiddleware, dispatch=catch_unhandled_errors)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )
    register_error_handlers(app)
    app.include_router(router)

    @app.get("/", include_in_schema=False)
    def root() -> RedirectResponse:
        """La raíz no es parte de la API: redirige a la documentación interactiva."""
        return RedirectResponse(url="/docs")

    return app


app = create_app()
