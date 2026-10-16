"""Modelos Pydantic del borde HTTP (ver docs/api-contract.md) y conversión desde el dominio."""

from decimal import ROUND_HALF_UP, Decimal
from typing import Literal

from pydantic import BaseModel

from app.domain.issue_codes import ISSUE_DESCRIPTIONS, IssueCode
from app.domain.models import InvoiceResult, ReconciliationReport

# Un monto se serializa como número JSON: entero si no tiene centavos, si no con máx. 2 decimales.
Amount = int | float | None
InvoiceStatus = Literal["Correcta", "Con inconsistencia"]


class HealthResponse(BaseModel):
    status: str


class ErrorResponse(BaseModel):
    code: str
    message: str
    details: list[str]
    file: str | None = None


class InconsistencySchema(BaseModel):
    codigo: IssueCode
    descripcion: str


class CauseSummarySchema(BaseModel):
    codigo: IssueCode
    descripcion: str
    cantidad: int


class SummarySchema(BaseModel):
    total_facturas: int
    correctas: int
    con_inconsistencia: int
    total_registros_contables: int
    por_causa: list[CauseSummarySchema]


class InvoiceResultSchema(BaseModel):
    fila: int
    id_factura: str
    nit_proveedor: str | None
    fecha_factura: str | None
    concepto: str | None
    base_gravable: Amount
    tarifa_iva: float | None
    iva_reportado: Amount
    iva_calculado: Amount
    tarifa_retencion: float | None
    retencion_reportada: Amount
    retencion_calculada: Amount
    total_reportado: Amount
    total_calculado: Amount
    valor_contabilizado: Amount
    lineas_contables: int
    estado_contable: str | None
    estado: InvoiceStatus
    inconsistencias: list[InconsistencySchema]


class ReconciliationResponse(BaseModel):
    summary: SummarySchema
    results: list[InvoiceResultSchema]


def to_amount(value: Decimal | None) -> Amount:
    if value is None:
        return None
    rounded = value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if rounded == rounded.to_integral_value():
        return int(rounded)
    return float(rounded)


def to_rate(value: Decimal | None) -> float | None:
    return None if value is None else float(value)


def to_invoice_result_schema(result: InvoiceResult) -> InvoiceResultSchema:
    invoice = result.invoice
    return InvoiceResultSchema(
        fila=invoice.line_number,
        id_factura=invoice.id_factura,
        nit_proveedor=invoice.nit_proveedor,
        fecha_factura=invoice.fecha_factura.isoformat() if invoice.fecha_factura else None,
        concepto=invoice.concepto,
        base_gravable=to_amount(invoice.base_gravable),
        tarifa_iva=to_rate(invoice.tarifa_iva),
        iva_reportado=to_amount(invoice.valor_iva),
        iva_calculado=to_amount(result.iva_calculado),
        tarifa_retencion=to_rate(invoice.tarifa_retencion),
        retencion_reportada=to_amount(invoice.valor_retencion),
        retencion_calculada=to_amount(result.retencion_calculada),
        total_reportado=to_amount(invoice.total_factura),
        total_calculado=to_amount(result.total_calculado),
        valor_contabilizado=to_amount(result.valor_contabilizado),
        lineas_contables=result.lineas_contables,
        estado_contable=result.estado_contable,
        estado=result.status,  # type: ignore[arg-type]
        inconsistencias=[
            InconsistencySchema(codigo=issue.code, descripcion=issue.description) for issue in result.issues
        ],
    )


def to_reconciliation_response(report: ReconciliationReport) -> ReconciliationResponse:
    summary = report.summary
    return ReconciliationResponse(
        summary=SummarySchema(
            total_facturas=summary.total_invoices,
            correctas=summary.correct,
            con_inconsistencia=summary.with_issues,
            total_registros_contables=summary.total_ledger_entries,
            por_causa=[
                CauseSummarySchema(
                    codigo=cause.code, descripcion=ISSUE_DESCRIPTIONS[cause.code], cantidad=cause.count
                )
                for cause in summary.by_cause
            ],
        ),
        results=[to_invoice_result_schema(result) for result in report.results],
    )
