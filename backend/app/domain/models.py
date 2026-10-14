"""Modelos del dominio (dataclasses). Pydantic solo vive en el borde HTTP (schemas.py)."""

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal

from app.domain.issue_codes import IssueCode

INVOICE_STATUS_OK = "Correcta"
INVOICE_STATUS_WITH_ISSUES = "Con inconsistencia"
LEDGER_STATUS_POSTED = "Contabilizada"


@dataclass(frozen=True)
class Issue:
    code: IssueCode
    description: str


@dataclass(frozen=True)
class Invoice:
    """Fila de facturas.csv ya parseada. Un campo es None si venía vacío o era inválido."""

    line_number: int
    id_factura: str
    nit_proveedor: str | None
    fecha_factura: date | None
    concepto: str | None
    base_gravable: Decimal | None
    tarifa_iva: Decimal | None
    valor_iva: Decimal | None
    tarifa_retencion: Decimal | None
    valor_retencion: Decimal | None
    total_factura: Decimal | None


@dataclass(frozen=True)
class LedgerEntry:
    """Fila de contabilidad.csv con los campos que usa la conciliación."""

    line_number: int
    id_factura: str
    valor_debito: Decimal | None
    estado: str | None


@dataclass(frozen=True)
class InvoiceResult:
    invoice: Invoice
    iva_calculado: Decimal | None
    retencion_calculada: Decimal | None
    total_calculado: Decimal | None
    valor_contabilizado: Decimal | None
    lineas_contables: int
    estado_contable: str | None
    issues: list[Issue] = field(default_factory=list)

    @property
    def status(self) -> str:
        return INVOICE_STATUS_WITH_ISSUES if self.issues else INVOICE_STATUS_OK


@dataclass(frozen=True)
class CauseCount:
    code: IssueCode
    count: int


@dataclass(frozen=True)
class ReconciliationSummary:
    total_invoices: int
    correct: int
    with_issues: int
    total_ledger_entries: int
    by_cause: list[CauseCount]


@dataclass(frozen=True)
class ReconciliationReport:
    summary: ReconciliationSummary
    results: list[InvoiceResult]
