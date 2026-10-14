"""Orquesta la conciliación: lee los CSV → parsea filas → aplica reglas → arma resumen y detalle."""

from collections import Counter
from decimal import Decimal

from app.domain import rules
from app.domain.issue_codes import IssueCode
from app.domain.models import (
    CauseCount,
    Invoice,
    InvoiceResult,
    Issue,
    LedgerEntry,
    ReconciliationReport,
    ReconciliationSummary,
)
from app.services.csv_reader import CsvRow, read_csv

INVOICE_COLUMNS: tuple[str, ...] = (
    "id_factura",
    "nit_proveedor",
    "fecha_factura",
    "concepto",
    "base_gravable",
    "tarifa_iva",
    "valor_iva",
    "tarifa_retencion",
    "valor_retencion",
    "total_factura",
)
LEDGER_COLUMNS: tuple[str, ...] = (
    "id_factura",
    "fecha_contabilizacion",
    "cuenta_contable",
    "centro_costo",
    "valor_debito",
    "valor_credito",
    "estado",
)
INVOICE_AMOUNT_COLUMNS: tuple[str, ...] = (
    "base_gravable",
    "tarifa_iva",
    "valor_iva",
    "tarifa_retencion",
    "valor_retencion",
    "total_factura",
)


def reconcile_files(
    invoices_content: bytes,
    invoices_filename: str | None,
    ledger_content: bytes,
    ledger_filename: str | None,
    max_file_size_bytes: int,
    tolerance: Decimal,
) -> ReconciliationReport:
    invoice_rows = read_csv(
        invoices_content, invoices_filename, INVOICE_COLUMNS, "facturas", max_file_size_bytes
    )
    ledger_rows = read_csv(
        ledger_content, ledger_filename, LEDGER_COLUMNS, "contabilidad", max_file_size_bytes
    )
    return reconcile(invoice_rows, ledger_rows, tolerance)


def reconcile(
    invoice_rows: list[CsvRow], ledger_rows: list[CsvRow], tolerance: Decimal
) -> ReconciliationReport:
    parsed_invoices = [parse_invoice(row) for row in invoice_rows]
    ledger_by_invoice = rules.group_ledger_by_invoice(parse_ledger_entry(row) for row in ledger_rows)
    duplicate_ids = rules.find_duplicate_ids(invoice.id_factura for invoice, _ in parsed_invoices)

    results = [
        evaluate_invoice(invoice, parse_issues, ledger_by_invoice, duplicate_ids, tolerance)
        for invoice, parse_issues in parsed_invoices
    ]
    return ReconciliationReport(summary=summarize(results, len(ledger_rows)), results=results)


def parse_invoice(row: CsvRow) -> tuple[Invoice, list[Issue]]:
    """Convierte una fila en Invoice; los campos vacíos o inválidos quedan en None con su causa."""
    values = row.values
    issues = [rules.empty_field_issue(name) for name in rules.find_empty_fields(values, INVOICE_COLUMNS)]

    amounts: dict[str, Decimal | None] = {}
    for column in INVOICE_AMOUNT_COLUMNS:
        raw = values.get(column, "")
        amounts[column] = None
        if raw:
            try:
                amounts[column] = rules.parse_amount(raw)
            except ValueError:
                issues.append(rules.invalid_value_issue(column, raw))

    invoice_date = None
    raw_date = values.get("fecha_factura", "")
    if raw_date:
        try:
            invoice_date = rules.parse_iso_date(raw_date)
        except ValueError:
            issues.append(rules.invalid_value_issue("fecha_factura", raw_date))

    invoice = Invoice(
        line_number=row.line_number,
        id_factura=values.get("id_factura", ""),
        nit_proveedor=values.get("nit_proveedor") or None,
        fecha_factura=invoice_date,
        concepto=values.get("concepto") or None,
        base_gravable=amounts["base_gravable"],
        tarifa_iva=amounts["tarifa_iva"],
        valor_iva=amounts["valor_iva"],
        tarifa_retencion=amounts["tarifa_retencion"],
        valor_retencion=amounts["valor_retencion"],
        total_factura=amounts["total_factura"],
    )
    return invoice, issues


def parse_ledger_entry(row: CsvRow) -> LedgerEntry:
    raw_debit = row.values.get("valor_debito", "")
    try:
        debit: Decimal | None = rules.parse_amount(raw_debit) if raw_debit else None
    except ValueError:
        debit = None
    return LedgerEntry(
        line_number=row.line_number,
        id_factura=row.values.get("id_factura", ""),
        valor_debito=debit,
        estado=row.values.get("estado") or None,
    )


def evaluate_invoice(
    invoice: Invoice,
    parse_issues: list[Issue],
    ledger_by_invoice: dict[str, list[LedgerEntry]],
    duplicate_ids: dict[str, int],
    tolerance: Decimal,
) -> InvoiceResult:
    issues = list(parse_issues)
    base = invoice.base_gravable

    # Regla 1: IVA y retención
    iva_calculado = None
    if base is not None and invoice.tarifa_iva is not None:
        iva_calculado = rules.expected_iva(base, invoice.tarifa_iva)
        if invoice.valor_iva is not None:
            _append_if_present(issues, rules.check_iva(invoice.valor_iva, iva_calculado, tolerance))

    retencion_calculada = None
    if base is not None and invoice.tarifa_retencion is not None:
        retencion_calculada = rules.expected_retention(base, invoice.tarifa_retencion)
        if invoice.valor_retencion is not None:
            _append_if_present(
                issues, rules.check_retention(invoice.valor_retencion, retencion_calculada, tolerance)
            )

    # Regla 2: total contra el IVA calculado
    total_calculado = None
    if base is not None and iva_calculado is not None and invoice.valor_retencion is not None:
        total_calculado = rules.expected_total(base, iva_calculado, invoice.valor_retencion)
        if invoice.total_factura is not None:
            _append_if_present(issues, rules.check_total(invoice.total_factura, total_calculado, tolerance))

    # Regla 3: duplicados y cruce contable (solo si hay id para cruzar)
    entries: list[LedgerEntry] = []
    if invoice.id_factura:
        if invoice.id_factura in duplicate_ids:
            issues.append(
                rules.duplicate_invoice_issue(invoice.id_factura, duplicate_ids[invoice.id_factura])
            )
        entries = ledger_by_invoice.get(invoice.id_factura, [])
        issues.extend(rules.check_ledger(invoice.total_factura, entries, tolerance))

    return InvoiceResult(
        invoice=invoice,
        iva_calculado=iva_calculado,
        retencion_calculada=retencion_calculada,
        total_calculado=total_calculado,
        valor_contabilizado=rules.posted_amount(entries),
        lineas_contables=len(entries),
        estado_contable=rules.ledger_status(entries),
        issues=issues,
    )


def summarize(results: list[InvoiceResult], total_ledger_entries: int) -> ReconciliationSummary:
    """`por_causa` cuenta facturas afectadas por cada código (una factura cuenta una vez por código)."""
    cause_counter: Counter[IssueCode] = Counter()
    for result in results:
        cause_counter.update({issue.code for issue in result.issues})

    code_order = list(IssueCode)
    by_cause = sorted(
        (CauseCount(code=code, count=count) for code, count in cause_counter.items()),
        key=lambda cause: (-cause.count, code_order.index(cause.code)),
    )
    with_issues = sum(1 for result in results if result.issues)
    return ReconciliationSummary(
        total_invoices=len(results),
        correct=len(results) - with_issues,
        with_issues=with_issues,
        total_ledger_entries=total_ledger_entries,
        by_cause=by_cause,
    )


def _append_if_present(issues: list[Issue], issue: Issue | None) -> None:
    if issue is not None:
        issues.append(issue)
