from decimal import Decimal

import pytest

from app.domain import rules
from app.domain.issue_codes import IssueCode
from app.domain.models import LedgerEntry

TOLERANCE = Decimal("1")


def entry(debit: str | None, status: str | None = "Contabilizada", invoice_id: str = "FAC-1") -> LedgerEntry:
    return LedgerEntry(
        line_number=2,
        id_factura=invoice_id,
        valor_debito=Decimal(debit) if debit is not None else None,
        estado=status,
    )


# --- IVA ---------------------------------------------------------------------


def test_expected_iva_is_base_times_rate():
    assert rules.expected_iva(Decimal("3800000"), Decimal("0.05")) == Decimal("190000")


def test_expected_iva_rounds_half_up_to_pesos():
    assert rules.expected_iva(Decimal("10"), Decimal("0.05")) == Decimal("1")  # 0.5 → 1
    assert rules.expected_iva(Decimal("1001"), Decimal("0.19")) == Decimal("190")  # 190.19 → 190


def test_check_iva_reports_difference_with_cop_format():
    issue = rules.check_iva(Decimal("215000"), Decimal("190000"), TOLERANCE)
    assert issue is not None
    assert issue.code is IssueCode.IVA_DIFERENTE
    assert issue.description == "IVA reportado $215.000 difiere del calculado $190.000"


def test_check_iva_accepts_matching_value():
    assert rules.check_iva(Decimal("190000"), Decimal("190000"), TOLERANCE) is None


# --- Retención -----------------------------------------------------------------


def test_expected_retention_is_base_times_rate():
    assert rules.expected_retention(Decimal("3570000"), Decimal("0.025")) == Decimal("89250")


def test_check_retention_detects_difference():
    issue = rules.check_retention(Decimal("100"), Decimal("90"), TOLERANCE)
    assert issue is not None and issue.code is IssueCode.RETENCION_DIFERENTE


# --- Total ---------------------------------------------------------------------


def test_expected_total_uses_calculated_iva():
    # FAC-0006: IVA reportado 215.000 pero el total cuadra con el IVA calculado (190.000).
    total = rules.expected_total(Decimal("3800000"), Decimal("190000"), Decimal("0"))
    assert total == Decimal("3990000")
    assert rules.check_total(Decimal("3990000"), total, TOLERANCE) is None


def test_check_total_detects_difference():
    # FAC-0009: 560.000 + 28.000 − 22.400 = 565.600, reportado 615.600.
    total = rules.expected_total(Decimal("560000"), Decimal("28000"), Decimal("22400"))
    issue = rules.check_total(Decimal("615600"), total, TOLERANCE)
    assert issue is not None and issue.code is IssueCode.TOTAL_DIFERENTE


# --- Tolerancia ----------------------------------------------------------------


@pytest.mark.parametrize(
    ("reported", "expected", "matches"),
    [("100", "100", True), ("101", "100", True), ("99", "100", True), ("102", "100", False), ("98", "100", False)],
)
def test_amounts_match_within_one_peso(reported: str, expected: str, matches: bool):
    assert rules.amounts_match(Decimal(reported), Decimal(expected), TOLERANCE) is matches


# --- Duplicados ----------------------------------------------------------------


def test_find_duplicate_ids_returns_only_repeated_ids_with_count():
    ids = ["FAC-1", "FAC-2", "FAC-1", "FAC-3", "FAC-1", "", ""]
    assert rules.find_duplicate_ids(ids) == {"FAC-1": 3}


# --- Cruce contable ------------------------------------------------------------


def test_check_ledger_without_entries_reports_missing_record():
    issues = rules.check_ledger(Decimal("100"), [], TOLERANCE)
    assert [issue.code for issue in issues] == [IssueCode.SIN_REGISTRO_CONTABLE]


def test_check_ledger_ok_when_posted_and_amount_matches():
    assert rules.check_ledger(Decimal("100"), [entry("100")], TOLERANCE) == []


def test_check_ledger_duplicate_entries_with_zero_line_keep_amount():
    issues = rules.check_ledger(Decimal("100"), [entry("100"), entry("0")], TOLERANCE)
    assert [issue.code for issue in issues] == [IssueCode.REGISTRO_CONTABLE_DUPLICADO]
    assert issues[0].description == "La factura tiene 2 registros contables"


def test_check_ledger_pending_status():
    issues = rules.check_ledger(Decimal("100"), [entry("100", "Pendiente")], TOLERANCE)
    assert [issue.code for issue in issues] == [IssueCode.CONTABILIZACION_PENDIENTE]


def test_check_ledger_posted_amount_differs_from_invoice_total():
    issues = rules.check_ledger(Decimal("2213500"), [entry("3659250")], TOLERANCE)
    assert [issue.code for issue in issues] == [IssueCode.VALOR_CONTABLE_DIFERENTE]


def test_check_ledger_invalid_debit_is_reported():
    issues = rules.check_ledger(Decimal("100"), [entry(None)], TOLERANCE)
    assert [issue.code for issue in issues] == [IssueCode.VALOR_INVALIDO]


def test_ledger_status_returns_first_non_posted_status():
    assert rules.ledger_status([entry("1"), entry("0", "Pendiente")]) == "Pendiente"
    assert rules.ledger_status([entry("1")]) == "Contabilizada"
    assert rules.ledger_status([]) is None


# --- Parseo, campos vacíos y formato -------------------------------------------


@pytest.mark.parametrize("raw", ["abc", "NaN", "Infinity", "1,5", ""])
def test_parse_amount_rejects_invalid_values(raw: str):
    with pytest.raises(ValueError):
        rules.parse_amount(raw)


def test_parse_amount_accepts_decimal_text():
    assert rules.parse_amount(" 0.025 ") == Decimal("0.025")


def test_find_empty_fields_lists_missing_values_in_order():
    values = {"id_factura": "FAC-1", "nit_proveedor": " ", "concepto": ""}
    assert rules.find_empty_fields(values, ["id_factura", "nit_proveedor", "concepto", "total_factura"]) == [
        "nit_proveedor",
        "concepto",
        "total_factura",
    ]


@pytest.mark.parametrize(
    ("amount", "text"),
    [("4435200", "$4.435.200"), ("0", "$0"), ("1234.5", "$1.234,50"), ("-1500", "-$1.500")],
)
def test_format_cop(amount: str, text: str):
    assert rules.format_cop(Decimal(amount)) == text
