"""Códigos de inconsistencia (contrato API) y su descripción genérica en español."""

from enum import Enum


class IssueCode(str, Enum):
    CAMPO_VACIO = "CAMPO_VACIO"
    VALOR_INVALIDO = "VALOR_INVALIDO"
    IVA_DIFERENTE = "IVA_DIFERENTE"
    RETENCION_DIFERENTE = "RETENCION_DIFERENTE"
    TOTAL_DIFERENTE = "TOTAL_DIFERENTE"
    FACTURA_DUPLICADA = "FACTURA_DUPLICADA"
    SIN_REGISTRO_CONTABLE = "SIN_REGISTRO_CONTABLE"
    REGISTRO_CONTABLE_DUPLICADO = "REGISTRO_CONTABLE_DUPLICADO"
    CONTABILIZACION_PENDIENTE = "CONTABILIZACION_PENDIENTE"
    VALOR_CONTABLE_DIFERENTE = "VALOR_CONTABLE_DIFERENTE"


# Descripción genérica de cada causa; se usa en el resumen (`por_causa`).
ISSUE_DESCRIPTIONS: dict[IssueCode, str] = {
    IssueCode.CAMPO_VACIO: "Campo obligatorio vacío",
    IssueCode.VALOR_INVALIDO: "Valor numérico o fecha inválida",
    IssueCode.IVA_DIFERENTE: "IVA reportado difiere del calculado",
    IssueCode.RETENCION_DIFERENTE: "Retención reportada difiere de la calculada",
    IssueCode.TOTAL_DIFERENTE: "Total de la factura no coincide con base + IVA − retención",
    IssueCode.FACTURA_DUPLICADA: "Factura duplicada",
    IssueCode.SIN_REGISTRO_CONTABLE: "Factura sin registro contable",
    IssueCode.REGISTRO_CONTABLE_DUPLICADO: "Registro contable duplicado",
    IssueCode.CONTABILIZACION_PENDIENTE: "Contabilización pendiente",
    IssueCode.VALOR_CONTABLE_DIFERENTE: "Valor contabilizado difiere del total de la factura",
}
