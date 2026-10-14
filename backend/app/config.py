"""Configuración del backend, leída de variables de entorno con valores por defecto."""

import os
from dataclasses import dataclass
from decimal import Decimal


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    cors_origins: list[str]
    max_file_size_bytes: int
    amount_tolerance: Decimal


def load_settings() -> Settings:
    return Settings(
        # localhost y 127.0.0.1 son orígenes distintos para el navegador: se permiten ambos.
        cors_origins=_split_csv(
            os.getenv("CORS_ORIGINS", "http://localhost:4200,http://127.0.0.1:4200")
        ),
        max_file_size_bytes=int(os.getenv("MAX_FILE_SIZE_BYTES", str(2 * 1024 * 1024))),
        amount_tolerance=Decimal(os.getenv("AMOUNT_TOLERANCE", "1")),
    )


settings = load_settings()
