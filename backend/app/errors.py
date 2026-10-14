"""Errores de archivo y manejadores HTTP con el formato único {code, message, details}."""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class FileValidationError(Exception):
    """Error que rechaza la carga completa (extensión, vacío, columnas, tamaño, encoding)."""

    def __init__(self, status_code: int, code: str, message: str, details: list[str] | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details or []


def error_body(code: str, message: str, details: list[str] | None = None) -> dict:
    return {"code": code, "message": message, "details": details or []}


async def file_validation_error_handler(_: Request, exc: FileValidationError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=error_body(exc.code, exc.message, exc.details))


async def request_validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    """La única entrada del endpoint son los dos archivos: cualquier error de validación
    del request significa que falta (o no es un archivo) `facturas` o `contabilidad`."""
    fields: list[str] = []
    for error in exc.errors():
        location = error.get("loc", ())
        name = str(location[-1]) if location else "archivo"
        if name not in fields:
            fields.append(name)
    return JSONResponse(
        status_code=422,
        content=error_body(
            "MISSING_FILE",
            "Debe adjuntar los dos archivos: facturas y contabilidad.",
            fields,
        ),
    )


async def unhandled_error_handler(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("Error no controlado", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content=error_body("INTERNAL_ERROR", "Ocurrió un error inesperado al procesar la solicitud."),
    )


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(FileValidationError, file_validation_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(RequestValidationError, request_validation_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, unhandled_error_handler)
