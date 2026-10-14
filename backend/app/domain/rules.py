"""Reglas contables y tributarias de la conciliación.

Funciones puras: sin I/O ni dependencias de HTTP. Cada regla se puede leer y
probar de forma aislada. Los montos se manejan siempre con `Decimal`.
"""

from collections import Counter
from collections.abc import Iterable, Mapping
from datetime import date
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation

from app.domain.issue_codes import IssueCode
from app.domain.models import LEDGER_STATUS_POSTED, Issue, LedgerEntry

PESO = Decimal("1")


# --- Parseo y formato -------------------------------------------------------


def parse_amount(raw: str) -> Decimal:
    """Convierte un texto a Decimal. Lanza ValueError si no es un número finito."""
    try:
        value = Decimal(raw.strip())
    except InvalidOperation as exc:
        raise ValueError(f"'{raw}' no es un número válido") from exc
    if not value.is_finite():
        raise ValueError(f"'{raw}' no es un número válido")
    return value


def parse_iso_date(raw: str) -> date:
    """Convierte un texto yyyy-mm-dd a fecha. Lanza ValueError si no es válida."""
    return date.fromisoformat(raw.strip())


def round_to_pesos(amount: Decimal) -> Decimal:
    """Redondea a pesos enteros con ROUND_HALF_UP (criterio contable)."""
    return amount.quantize(PESO, rounding=ROUND_HALF_UP)


def format_cop(amount: Decimal) -> str:
    """Formatea un monto como pesos colombianos: $1.234.567 (o $1.234,50 si tiene centavos)."""
    sign = "-" if amount < 0 else ""
    absolute = abs(amount)
    if absolute == absolute.to_integral_value():
        text = f"{int(absolute):,}".replace(",", ".")
    else:
        integer_part, decimals = f"{absolute.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP):,.2f}".split(".")
        text = f"{integer_part.replace(',', '.')},{decimals}"
    return f"{sign}${text}"


# --- Validación de campos ---------------------------------------------------


def find_empty_fields(values: Mapping[str, str | None], required_fields: Iterable[str]) -> list[str]:
    """Devuelve, en orden, los campos obligatorios que vienen vacíos o ausentes."""
    return [name for name in required_fields if not (values.get(name) or "").strip()]


def empty_field_issue(field_name: str) -> Issue:
    return Issue(IssueCode.CAMPO_VACIO, f"Campo obligatorio vacío: {field_name}")


def invalid_value_issue(field_name: str, raw_value: str) -> Issue:
    return Issue(IssueCode.VALOR_INVALIDO, f"Valor inválido en {field_name}: '{raw_value}'")


# --- Regla 1: IVA y retención ----------------------------------------------


def amounts_match(reported: Decimal, expected: Decimal, tolerance: Decimal) -> bool:
    """Dos montos coinciden si su diferencia absoluta no supera la tolerancia (±1 COP)."""
    return abs(reported - expected) <= tolerance


def expected_iva(base_gravable: Decimal, tarifa_iva: Decimal) -> Decimal:
    """IVA esperado = base gravable × tarifa de IVA, redondeado a pesos."""
    return round_to_pesos(base_gravable * tarifa_iva)


def expected_retention(base_gravable: Decimal, tarifa_retencion: Decimal) -> Decimal:
    """Retención esperada = base gravable × tarifa de retención, redondeada a pesos."""
    return round_to_pesos(base_gravable * tarifa_retencion)


def check_iva(reported_iva: Decimal, calculated_iva: Decimal, tolerance: Decimal) -> Issue | None:
    if amounts_match(reported_iva, calculated_iva, tolerance):
        return None
    return Issue(
        IssueCode.IVA_DIFERENTE,
        f"IVA reportado {format_cop(reported_iva)} difiere del calculado {format_cop(calculated_iva)}",
    )


def check_retention(
    reported_retention: Decimal, calculated_retention: Decimal, tolerance: Decimal
) -> Issue | None:
    if amounts_match(reported_retention, calculated_retention, tolerance):
        return None
    return Issue(
        IssueCode.RETENCION_DIFERENTE,
        f"Retención reportada {format_cop(reported_retention)} difiere de la calculada "
        f"{format_cop(calculated_retention)}",
    )


# --- Regla 2: total de la factura ------------------------------------------


def expected_total(
    base_gravable: Decimal, calculated_iva: Decimal, reported_retention: Decimal
) -> Decimal:
    """Total esperado = base + IVA **calculado** − retención reportada.

    Se usa el IVA calculado para distinguir "IVA mal reportado" (IVA_DIFERENTE)
    de "total mal calculado" (TOTAL_DIFERENTE).
    """
    return round_to_pesos(base_gravable + calculated_iva - reported_retention)


def check_total(reported_total: Decimal, calculated_total: Decimal, tolerance: Decimal) -> Issue | None:
    if amounts_match(reported_total, calculated_total, tolerance):
        return None
    return Issue(
        IssueCode.TOTAL_DIFERENTE,
        f"Total reportado {format_cop(reported_total)} difiere del calculado "
        f"{format_cop(calculated_total)} (base + IVA calculado − retención)",
    )


# --- Regla 3: duplicados y cruce contable ----------------------------------


def find_duplicate_ids(invoice_ids: Iterable[str]) -> dict[str, int]:
    """Devuelve {id_factura: ocurrencias} solo para los ids que aparecen más de una vez.

    Los ids vacíos se ignoran (ya se reportan como CAMPO_VACIO).
    """
    counts = Counter(invoice_id for invoice_id in invoice_ids if invoice_id)
    return {invoice_id: count for invoice_id, count in counts.items() if count > 1}


def duplicate_invoice_issue(invoice_id: str, occurrences: int) -> Issue:
    return Issue(
        IssueCode.FACTURA_DUPLICADA,
        f"El id {invoice_id} aparece {occurrences} veces en el archivo de facturas",
    )


def group_ledger_by_invoice(entries: Iterable[LedgerEntry]) -> dict[str, list[LedgerEntry]]:
    """Agrupa las líneas contables por id_factura (las líneas sin id se descartan)."""
    grouped: dict[str, list[LedgerEntry]] = {}
    for entry in entries:
        if entry.id_factura:
            grouped.setdefault(entry.id_factura, []).append(entry)
    return grouped


def posted_amount(entries: list[LedgerEntry]) -> Decimal | None:
    """Suma de valor_debito de las líneas; None si no hay líneas o alguna no tiene valor válido."""
    if not entries or any(entry.valor_debito is None for entry in entries):
        return None
    return sum((entry.valor_debito for entry in entries), Decimal("0"))  # type: ignore[misc]


def ledger_status(entries: list[LedgerEntry]) -> str | None:
    """Estado contable consolidado: el primer estado distinto de 'Contabilizada', si existe."""
    if not entries:
        return None
    for entry in entries:
        if not is_posted(entry.estado):
            return entry.estado
    return LEDGER_STATUS_POSTED


def is_posted(status: str | None) -> bool:
    return (status or "").strip().casefold() == LEDGER_STATUS_POSTED.casefold()


def check_ledger(
    invoice_total: Decimal | None, entries: list[LedgerEntry], tolerance: Decimal
) -> list[Issue]:
    """Cruce de una factura contra sus líneas contables.

    - Sin líneas → SIN_REGISTRO_CONTABLE (no se evalúa nada más).
    - Más de una línea → REGISTRO_CONTABLE_DUPLICADO.
    - Alguna línea no 'Contabilizada' → CONTABILIZACION_PENDIENTE.
    - Valor de débito inválido → VALOR_INVALIDO.
    - Suma de débitos ≠ total de la factura → VALOR_CONTABLE_DIFERENTE.
    """
    if not entries:
        return [Issue(IssueCode.SIN_REGISTRO_CONTABLE, "La factura no tiene registro en contabilidad")]

    issues: list[Issue] = []
    if len(entries) > 1:
        issues.append(
            Issue(
                IssueCode.REGISTRO_CONTABLE_DUPLICADO,
                f"La factura tiene {len(entries)} registros contables",
            )
        )

    for entry in entries:
        if not is_posted(entry.estado):
            shown_status = (entry.estado or "").strip()
            description = (
                f"Estado contable '{shown_status}' (se espera '{LEDGER_STATUS_POSTED}')"
                if shown_status
                else f"Estado contable sin informar (se espera '{LEDGER_STATUS_POSTED}')"
            )
            issues.append(Issue(IssueCode.CONTABILIZACION_PENDIENTE, description))
            break

    total_posted = posted_amount(entries)
    if total_posted is None:
        issues.append(
            Issue(
                IssueCode.VALOR_INVALIDO,
                "El registro contable tiene un valor_debito vacío o inválido",
            )
        )
    elif invoice_total is not None and not amounts_match(total_posted, invoice_total, tolerance):
        issues.append(
            Issue(
                IssueCode.VALOR_CONTABLE_DIFERENTE,
                f"Valor contabilizado {format_cop(total_posted)} difiere del total de la factura "
                f"{format_cop(invoice_total)}",
            )
        )
    return issues
