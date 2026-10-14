from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.api import routes
from app.main import app

TEST_DATA = Path(__file__).resolve().parents[2] / "test-data"
ERRORS_DIR = TEST_DATA / "errores"

RESULT_FIELDS = {
    "fila", "id_factura", "nit_proveedor", "fecha_factura", "concepto", "base_gravable", "tarifa_iva",
    "iva_reportado", "iva_calculado", "tarifa_retencion", "retencion_reportada", "retencion_calculada",
    "total_reportado", "total_calculado", "valor_contabilizado", "lineas_contables", "estado_contable",
    "estado", "inconsistencias",
}

client = TestClient(app)


def upload(facturas: Path | tuple, contabilidad: Path | tuple):
    def as_file(item):
        return (item.name, item.read_bytes(), "text/csv") if isinstance(item, Path) else item

    return client.post(
        "/api/reconciliations",
        files={"facturas": as_file(facturas), "contabilidad": as_file(contabilidad)},
    )


@pytest.fixture(scope="module")
def golden() -> dict:
    response = upload(TEST_DATA / "facturas.csv", TEST_DATA / "contabilidad.csv")
    assert response.status_code == 200
    return response.json()


def codes_for(body: dict, invoice_id: str) -> list[set[str]]:
    return [
        {issue["codigo"] for issue in result["inconsistencias"]}
        for result in body["results"]
        if result["id_factura"] == invoice_id
    ]


def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}


# --- Golden: archivos de ejemplo → 50 / 28 / 22 ---------------------------------


def test_golden_summary(golden: dict):
    summary = golden["summary"]
    assert summary["total_facturas"] == 50
    assert summary["correctas"] == 28
    assert summary["con_inconsistencia"] == 22
    assert summary["total_registros_contables"] == 50
    counts = [cause["cantidad"] for cause in summary["por_causa"]]
    assert counts == sorted(counts, reverse=True) and all(count > 0 for count in counts)
    by_code = {cause["codigo"]: cause["cantidad"] for cause in summary["por_causa"]}
    assert by_code["SIN_REGISTRO_CONTABLE"] == 4
    assert by_code["FACTURA_DUPLICADA"] == 4
    assert by_code["CONTABILIZACION_PENDIENTE"] == 3


def test_golden_results_keep_file_order_and_contract_fields(golden: dict):
    results = golden["results"]
    assert len(results) == 50
    assert [result["fila"] for result in results] == list(range(2, 52))
    for result in results:
        assert set(result) == RESULT_FIELDS
        assert result["estado"] == ("Correcta" if not result["inconsistencias"] else "Con inconsistencia")


def test_golden_fac_0006_iva_diferente(golden: dict):
    fac = next(result for result in golden["results"] if result["id_factura"] == "FAC-0006")
    assert fac["fila"] == 7
    assert fac["iva_reportado"] == 215000
    assert fac["iva_calculado"] == 190000
    assert fac["total_calculado"] == 3990000
    assert fac["lineas_contables"] == 2
    assert {"codigo": "IVA_DIFERENTE", "descripcion": "IVA reportado $215.000 difiere del calculado $190.000"} in fac[
        "inconsistencias"
    ]
    assert "TOTAL_DIFERENTE" not in {issue["codigo"] for issue in fac["inconsistencias"]}


def test_golden_fac_0009_total_diferente(golden: dict):
    assert codes_for(golden, "FAC-0009") == [{"TOTAL_DIFERENTE"}]


def test_golden_fac_0007_sin_registro_contable(golden: dict):
    fac = next(result for result in golden["results"] if result["id_factura"] == "FAC-0007")
    assert codes_for(golden, "FAC-0007") == [{"SIN_REGISTRO_CONTABLE"}]
    assert fac["valor_contabilizado"] is None
    assert fac["lineas_contables"] == 0
    assert fac["estado_contable"] is None


def test_golden_fac_0004_duplicada_marks_all_occurrences(golden: dict):
    occurrences = codes_for(golden, "FAC-0004")
    assert len(occurrences) == 2
    assert all("FACTURA_DUPLICADA" in codes for codes in occurrences)
    assert "VALOR_CONTABLE_DIFERENTE" in occurrences[1]


def test_golden_fac_0011_contabilizacion_pendiente(golden: dict):
    fac = next(result for result in golden["results"] if result["id_factura"] == "FAC-0011")
    assert codes_for(golden, "FAC-0011") == [{"CONTABILIZACION_PENDIENTE"}]
    assert fac["estado_contable"] == "Pendiente"


def test_golden_empty_field_is_an_issue_not_a_rejection(golden: dict):
    fac = next(result for result in golden["results"] if result["id_factura"] == "FAC-0013")
    assert fac["nit_proveedor"] is None
    assert fac["inconsistencias"] == [
        {"codigo": "CAMPO_VACIO", "descripcion": "Campo obligatorio vacío: nit_proveedor"}
    ]


def test_golden_correct_invoice(golden: dict):
    fac = next(result for result in golden["results"] if result["id_factura"] == "FAC-0008")
    assert fac["estado"] == "Correcta"
    assert fac["inconsistencias"] == []
    assert fac["valor_contabilizado"] == fac["total_reportado"] == 254100


# --- Errores de fila: inconsistencias, nunca 500 ---------------------------------


def test_invalid_row_values_become_inconsistencies():
    facturas = (
        "facturas.csv",
        b"id_factura,nit_proveedor,fecha_factura,concepto,base_gravable,tarifa_iva,valor_iva,"
        b"tarifa_retencion,valor_retencion,total_factura\n"
        b"FAC-1,900,2026-13-40,Prueba,abc,0.19,190,0.0,0,1190\n",
        "text/csv",
    )
    response = upload(facturas, TEST_DATA / "contabilidad.csv")
    assert response.status_code == 200
    result = response.json()["results"][0]
    assert result["fecha_factura"] is None and result["base_gravable"] is None
    assert result["iva_calculado"] is None and result["total_calculado"] is None
    assert {issue["codigo"] for issue in result["inconsistencias"]} == {"VALOR_INVALIDO", "SIN_REGISTRO_CONTABLE"}


# --- Errores de archivo con test-data/errores/ ----------------------------------


def assert_error(response, status: int, code: str) -> dict:
    assert response.status_code == status
    body = response.json()
    assert set(body) == {"code", "message", "details"}
    assert body["code"] == code
    assert isinstance(body["details"], list)
    return body


def test_missing_columns_returns_422():
    response = upload(ERRORS_DIR / "facturas_columnas_faltantes.csv", TEST_DATA / "contabilidad.csv")
    body = assert_error(response, 422, "MISSING_COLUMNS")
    assert body["message"] == "El archivo de facturas no tiene las columnas obligatorias."
    assert body["details"] == ["tarifa_iva", "valor_iva", "tarifa_retencion", "valor_retencion", "total_factura"]


def test_empty_file_returns_400():
    body = assert_error(upload(TEST_DATA / "facturas.csv", ERRORS_DIR / "vacio.csv"), 400, "INVALID_FILE")
    assert "contabilidad" in body["message"]


def test_non_csv_extension_returns_400():
    assert_error(upload(ERRORS_DIR / "archivo.txt", TEST_DATA / "contabilidad.csv"), 400, "INVALID_FILE")


def test_file_too_large_returns_413(monkeypatch: pytest.MonkeyPatch):
    from decimal import Decimal

    from app.config import Settings

    monkeypatch.setattr(routes, "settings", Settings(cors_origins=[], max_file_size_bytes=100, amount_tolerance=Decimal("1")))
    assert_error(upload(TEST_DATA / "facturas.csv", TEST_DATA / "contabilidad.csv"), 413, "FILE_TOO_LARGE")


def test_missing_file_returns_422_missing_file():
    path = TEST_DATA / "facturas.csv"
    response = client.post("/api/reconciliations", files={"facturas": (path.name, path.read_bytes(), "text/csv")})
    body = assert_error(response, 422, "MISSING_FILE")
    assert body["details"] == ["contabilidad"]


def test_unexpected_error_returns_500_without_stacktrace(monkeypatch: pytest.MonkeyPatch):
    def boom(**_: object):
        raise RuntimeError("detalle interno")

    monkeypatch.setattr(routes, "reconcile_files", boom)
    safe_client = TestClient(app, raise_server_exceptions=False)
    path = TEST_DATA / "facturas.csv"
    response = safe_client.post(
        "/api/reconciliations",
        files={"facturas": (path.name, path.read_bytes()), "contabilidad": (path.name, path.read_bytes())},
    )
    assert_error(response, 500, "INTERNAL_ERROR")
    assert "detalle interno" not in response.text


@pytest.mark.parametrize("origin", ["http://localhost:4200", "http://127.0.0.1:4200"])
def test_cors_allows_angular_dev_origin(origin):
    response = client.options(
        "/api/reconciliations",
        headers={"Origin": origin, "Access-Control-Request-Method": "POST"},
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin
