import pytest

from app.errors import FileValidationError
from app.services.csv_reader import read_csv

COLUMNS = ("id_factura", "valor")
MAX_SIZE = 1024


def read(content: bytes, filename: str = "datos.csv", max_size: int = MAX_SIZE):
    return read_csv(content, filename, COLUMNS, "facturas", max_size)


def test_reads_file_with_utf8_bom():
    rows = read("﻿id_factura,valor\nFAC-1,100\n".encode("utf-8"))
    assert rows[0].values == {"id_factura": "FAC-1", "valor": "100"}


def test_line_number_counts_header_as_line_one_and_skips_blank_lines():
    rows = read(b"id_factura,valor\nFAC-1,100\n\nFAC-2,200\n")
    assert [row.line_number for row in rows] == [2, 4]


def test_missing_cells_are_empty_strings():
    rows = read(b"id_factura,valor\nFAC-1\n")
    assert rows[0].values == {"id_factura": "FAC-1", "valor": ""}


def test_missing_columns_raise_422_with_column_names():
    with pytest.raises(FileValidationError) as error:
        read(b"id_factura,otra\nFAC-1,1\n")
    assert error.value.status_code == 422
    assert error.value.code == "MISSING_COLUMNS"
    assert error.value.details == ["valor"]


@pytest.mark.parametrize("content", [b"", b"   \n\n", "﻿".encode("utf-8")])
def test_empty_file_raises_invalid_file(content: bytes):
    with pytest.raises(FileValidationError) as error:
        read(content)
    assert (error.value.status_code, error.value.code) == (400, "INVALID_FILE")
    assert "vacío" in error.value.message


def test_header_only_file_raises_invalid_file():
    with pytest.raises(FileValidationError) as error:
        read(b"id_factura,valor\n")
    assert (error.value.status_code, error.value.code) == (400, "INVALID_FILE")


def test_non_csv_extension_raises_invalid_file():
    with pytest.raises(FileValidationError) as error:
        read(b"id_factura,valor\nFAC-1,1\n", filename="datos.txt")
    assert (error.value.status_code, error.value.code) == (400, "INVALID_FILE")


def test_non_utf8_content_raises_invalid_file():
    with pytest.raises(FileValidationError) as error:
        read("id_factura,valor\nFAC-ñ,1\n".encode("utf-16"))
    assert (error.value.status_code, error.value.code) == (400, "INVALID_FILE")


def test_file_over_max_size_raises_413():
    with pytest.raises(FileValidationError) as error:
        read(b"id_factura,valor\nFAC-1,1\n", max_size=10)
    assert (error.value.status_code, error.value.code) == (413, "FILE_TOO_LARGE")
