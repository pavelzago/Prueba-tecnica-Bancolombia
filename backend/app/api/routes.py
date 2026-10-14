"""Endpoints HTTP del conciliador."""

from typing import Annotated

from fastapi import APIRouter, File, UploadFile

from app.config import settings
from app.schemas import ErrorResponse, HealthResponse, ReconciliationResponse, to_reconciliation_response
from app.services.reconciliation import reconcile_files

router = APIRouter(prefix="/api")

ERROR_RESPONSES: dict[int | str, dict] = {
    400: {"model": ErrorResponse, "description": "INVALID_FILE: extensión, archivo vacío o encoding"},
    413: {"model": ErrorResponse, "description": "FILE_TOO_LARGE: archivo mayor al máximo permitido"},
    422: {"model": ErrorResponse, "description": "MISSING_COLUMNS o MISSING_FILE"},
    500: {"model": ErrorResponse, "description": "INTERNAL_ERROR"},
}


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@router.post(
    "/reconciliations",
    response_model=ReconciliationResponse,
    responses=ERROR_RESPONSES,
    summary="Concilia facturas contra contabilidad",
)
async def create_reconciliation(
    facturas: Annotated[UploadFile, File(description="facturas.csv")],
    contabilidad: Annotated[UploadFile, File(description="contabilidad.csv")],
) -> ReconciliationResponse:
    # Se lee un byte más del máximo para detectar archivos demasiado grandes sin cargarlos completos.
    read_limit = settings.max_file_size_bytes + 1
    report = reconcile_files(
        invoices_content=await facturas.read(read_limit),
        invoices_filename=facturas.filename,
        ledger_content=await contabilidad.read(read_limit),
        ledger_filename=contabilidad.filename,
        max_file_size_bytes=settings.max_file_size_bytes,
        tolerance=settings.amount_tolerance,
    )
    return to_reconciliation_response(report)
