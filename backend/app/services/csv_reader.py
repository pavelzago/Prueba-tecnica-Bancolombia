"""Lectura y validación de archivos CSV a nivel de archivo (no de fila).

Los errores de archivo rechazan la carga (FileValidationError). Los problemas de
cada fila no se validan aquí: se convierten en inconsistencias más adelante.
"""

import csv
import io
from collections.abc import Sequence
from dataclasses import dataclass

from app.errors import FileValidationError

CSV_EXTENSION = ".csv"


@dataclass(frozen=True)
class CsvRow:
    line_number: int  # línea en el archivo (encabezado = 1)
    values: dict[str, str]


def read_csv(
    content: bytes,
    filename: str | None,
    required_columns: Sequence[str],
    file_label: str,
    max_size_bytes: int,
) -> list[CsvRow]:
    """Valida y lee un CSV. `file_label` es el nombre de negocio usado en los mensajes.

    Los errores llevan `file=file_label` para que el frontend marque el archivo culpable.
    """
    if not (filename or "").lower().endswith(CSV_EXTENSION):
        raise FileValidationError(
            400,
            "INVALID_FILE",
            f"El archivo de {file_label} debe tener extensión .csv.",
            [filename or ""],
            file=file_label,
        )
    if len(content) > max_size_bytes:
        raise FileValidationError(
            413,
            "FILE_TOO_LARGE",
            f"El archivo de {file_label} supera el tamaño máximo de {max_size_bytes // (1024 * 1024)} MB.",
            [filename or ""],
            file=file_label,
        )

    try:
        text = content.decode("utf-8-sig")  # los archivos de origen traen BOM
    except UnicodeDecodeError as exc:
        raise FileValidationError(
            400,
            "INVALID_FILE",
            f"El archivo de {file_label} no está codificado en UTF-8.",
            [filename or ""],
            file=file_label,
        ) from exc

    if not text.strip():
        raise FileValidationError(
            400, "INVALID_FILE", f"El archivo de {file_label} está vacío.", [filename or ""], file=file_label
        )

    reader = csv.reader(io.StringIO(text, newline=""))
    header = [column.strip() for column in next(reader)]
    missing_columns = [column for column in required_columns if column not in header]
    if missing_columns:
        raise FileValidationError(
            422,
            "MISSING_COLUMNS",
            f"El archivo de {file_label} no tiene las columnas obligatorias.",
            missing_columns,
            file=file_label,
        )

    rows: list[CsvRow] = []
    for raw_values in reader:
        if not any(value.strip() for value in raw_values):
            continue  # líneas en blanco
        values = {
            column: (raw_values[index].strip() if index < len(raw_values) else "")
            for index, column in enumerate(header)
        }
        rows.append(CsvRow(line_number=reader.line_num, values=values))

    if not rows:
        raise FileValidationError(
            400, "INVALID_FILE", f"El archivo de {file_label} no tiene filas de datos.", [filename or ""], file=file_label
        )
    return rows
