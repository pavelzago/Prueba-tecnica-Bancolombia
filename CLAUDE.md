# Conciliador de facturas y retenciones — Prueba técnica Analista III (Bancolombia)

Prototipo full stack que carga `facturas.csv` y `contabilidad.csv`, aplica reglas contables/tributarias y muestra un resumen y un detalle filtrable de facturas **Correctas** o **Con inconsistencia** (con la causa).

- Enunciado original: `docs/Caso de estudio Analista III.md`
- Plan y avance por fases: `docs/PLAN.md` (marcar checkboxes al completar)
- Contrato API (fuente de verdad back ↔ front): `docs/api-contract.md`

## Principios
- Prototipo, no producción: **claridad y trazabilidad > abstracción**. Nada de sobreingeniería (sin BD, sin repositorios, sin NgRx, sin librerías de UI).
- Código e identificadores en **inglés**; textos de negocio, mensajes al usuario, códigos de inconsistencia y documentación en **español**.
- Cambios al contrato API → actualizar primero `docs/api-contract.md` y avisar; backend y frontend deben coincidir campo a campo.
- No incluir datos reales, credenciales ni secretos.

## Estructura
```
backend/    FastAPI (Python >= 3.10)  → app/{api,domain,services}, tests/
frontend/   Angular 21 (CLI 21.2.24) standalone + signals, Atomic Design, tests con Vitest
test-data/  CSV de ejemplo (originales) + errores/ para probar validaciones
docs/       plan, contrato, declaración IA, presentación
```

## Reglas de negocio (resumen — detalle en docs/PLAN.md §2)
Evaluación **por fila** de facturas; cada fila acumula causas. Sin causas → `Correcta`; con causas → `Con inconsistencia`.

| Código | Regla |
|---|---|
| CAMPO_VACIO | Campo obligatorio vacío (indicar cuál) |
| VALOR_INVALIDO | Número/fecha no parseable |
| IVA_DIFERENTE | valor_iva ≠ base_gravable × tarifa_iva |
| RETENCION_DIFERENTE | valor_retencion ≠ base_gravable × tarifa_retencion |
| TOTAL_DIFERENTE | total_factura ≠ base + IVA **calculado** − retención reportada |
| FACTURA_DUPLICADA | id_factura repetido en facturas (se marcan todas las ocurrencias) |
| SIN_REGISTRO_CONTABLE | id_factura no existe en contabilidad |
| REGISTRO_CONTABLE_DUPLICADO | más de una línea contable para el id |
| CONTABILIZACION_PENDIENTE | estado contable ≠ "Contabilizada" |
| VALOR_CONTABLE_DIFERENTE | suma de valor_debito ≠ total_factura |

- Montos con `decimal.Decimal`, redondeo a pesos `ROUND_HALF_UP`, tolerancia ±1 COP. **Nunca float.**
- CSV con BOM → leer siempre con `encoding="utf-8-sig"`.
- Errores de archivo (extensión, vacío, columnas faltantes) → rechazo 400/422 con `{code, message, details}`. Errores de fila → causa de inconsistencia, no rechazo.
- **Resultado esperado con `test-data/` originales: 50 facturas, 28 correctas, 22 con inconsistencia** (test golden).

## Comandos
```bash
# Backend
cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000   # Swagger: http://localhost:8000/docs
cd backend && .venv/bin/pytest -q

# Frontend
cd frontend && npm install
cd frontend && npx ng serve          # http://localhost:4200
cd frontend && npx ng test --watch=false
```

## Convenciones
- **Backend**: capas `api → services → domain`. `domain/rules.py` = funciones puras sin I/O. Pydantic solo en `schemas.py` (borde HTTP); dentro del dominio, dataclasses. Type hints en todo.
- **Frontend**: standalone, `ChangeDetectionStrategy.OnPush`, `input()`/`output()`, control flow `@if/@for`. Atoms/molecules/organisms son presentacionales (no inyectan servicios). Solo `pages/` usa `ReconciliationStore`. Montos con `CurrencyPipe` locale `es-CO`.
- **Tests**: priorizar valor (reglas + golden + errores), no cobertura.
- **Git**: commits pequeños por fase, Conventional Commits en español (`feat(backend): reglas de IVA y total`). El usuario valida y aprueba el cierre de cada fase.
