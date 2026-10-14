# Contrato API — Conciliador

Fuente de verdad entre `backend/` y `frontend/`. Cualquier cambio se hace **primero aquí**.

- Base URL (dev): `http://localhost:8000/api`
- Formato: JSON UTF-8. Nombres de campos en `snake_case` (español, lenguaje de negocio).
- Montos: `number` (pesos COP, redondeados a 2 decimales como máximo). Internamente el backend usa `Decimal`; se convierte a número solo al serializar.
- Campos que pueden no existir por datos vacíos/inválidos: `null`.
- CORS permitido: `http://localhost:4200` y `http://127.0.0.1:4200` (configurable con `CORS_ORIGINS`, separado por comas).

---

## GET `/api/health`
**200**
```json
{ "status": "ok" }
```

---

## POST `/api/reconciliations`
`Content-Type: multipart/form-data`

| Campo form | Tipo | Requerido | Descripción |
|---|---|---|---|
| `facturas` | file (.csv) | sí | Columnas: id_factura, nit_proveedor, fecha_factura, concepto, base_gravable, tarifa_iva, valor_iva, tarifa_retencion, valor_retencion, total_factura |
| `contabilidad` | file (.csv) | sí | Columnas: id_factura, fecha_contabilizacion, cuenta_contable, centro_costo, valor_debito, valor_credito, estado |

Tamaño máximo por archivo: 2 MB. Encoding: UTF-8 (con o sin BOM).

### 200 — `ReconciliationResponse`
```json
{
  "summary": {
    "total_facturas": 50,
    "correctas": 28,
    "con_inconsistencia": 22,
    "total_registros_contables": 50,
    "por_causa": [
      { "codigo": "SIN_REGISTRO_CONTABLE", "descripcion": "Factura sin registro contable", "cantidad": 4 }
    ]
  },
  "results": [
    {
      "fila": 7,
      "id_factura": "FAC-0006",
      "nit_proveedor": "900782207",
      "fecha_factura": "2026-03-07",
      "concepto": "Consultoría profesional",
      "base_gravable": 3800000,
      "tarifa_iva": 0.05,
      "iva_reportado": 215000,
      "iva_calculado": 190000,
      "tarifa_retencion": 0.0,
      "retencion_reportada": 0,
      "retencion_calculada": 0,
      "total_reportado": 3990000,
      "total_calculado": 3990000,
      "valor_contabilizado": 3990000,
      "lineas_contables": 2,
      "estado_contable": "Contabilizada",
      "estado": "Con inconsistencia",
      "inconsistencias": [
        { "codigo": "IVA_DIFERENTE", "descripcion": "IVA reportado $215.000 difiere del calculado $190.000" },
        { "codigo": "REGISTRO_CONTABLE_DUPLICADO", "descripcion": "La factura tiene 2 registros contables" }
      ]
    }
  ]
}
```

#### Tipos
```ts
type EstadoFactura = 'Correcta' | 'Con inconsistencia';

type CodigoInconsistencia =
  | 'CAMPO_VACIO' | 'VALOR_INVALIDO'
  | 'IVA_DIFERENTE' | 'RETENCION_DIFERENTE' | 'TOTAL_DIFERENTE'
  | 'FACTURA_DUPLICADA' | 'SIN_REGISTRO_CONTABLE' | 'REGISTRO_CONTABLE_DUPLICADO'
  | 'CONTABILIZACION_PENDIENTE' | 'VALOR_CONTABLE_DIFERENTE';

interface Inconsistencia { codigo: CodigoInconsistencia; descripcion: string; }

interface ResumenCausa { codigo: CodigoInconsistencia; descripcion: string; cantidad: number; }

interface Summary {
  total_facturas: number;          // filas de facturas.csv (sin encabezado)
  correctas: number;
  con_inconsistencia: number;
  total_registros_contables: number;
  por_causa: ResumenCausa[];       // solo causas con cantidad > 0, orden descendente por cantidad
}

interface ResultadoFactura {
  fila: number;                    // número de línea en el CSV (encabezado = 1)
  id_factura: string;
  nit_proveedor: string | null;
  fecha_factura: string | null;    // ISO yyyy-mm-dd
  concepto: string | null;
  base_gravable: number | null;
  tarifa_iva: number | null;
  iva_reportado: number | null;
  iva_calculado: number | null;
  tarifa_retencion: number | null;
  retencion_reportada: number | null;
  retencion_calculada: number | null;
  total_reportado: number | null;
  total_calculado: number | null;  // base + IVA calculado − retención reportada
  valor_contabilizado: number | null;  // suma de valor_debito; null si no hay registro
  lineas_contables: number;        // 0 si no hay registro
  estado_contable: string | null;  // 'Contabilizada' | 'Pendiente' | ... ; null si no hay registro
  estado: EstadoFactura;
  inconsistencias: Inconsistencia[];   // vacío si Correcta
}

interface ReconciliationResponse { summary: Summary; results: ResultadoFactura[]; }
```
`results` se entrega en el **orden original del archivo**.

---

## Errores — `ErrorResponse`
```json
{ "code": "MISSING_COLUMNS", "message": "El archivo de facturas no tiene las columnas obligatorias.", "details": ["valor_iva", "total_factura"] }
```
```ts
interface ErrorResponse { code: string; message: string; details: string[]; }
```

| HTTP | `code` | Cuándo |
|---|---|---|
| 400 | `INVALID_FILE` | Extensión distinta de `.csv`, archivo vacío o sin filas de datos, encoding ilegible |
| 413 | `FILE_TOO_LARGE` | Archivo > 2 MB |
| 422 | `MISSING_COLUMNS` | Faltan columnas obligatorias (`details` = columnas faltantes) |
| 422 | `MISSING_FILE` | No se envió `facturas` o `contabilidad` |
| 500 | `INTERNAL_ERROR` | Error no controlado (sin stacktrace) |

`message` está en español y es apto para mostrarse directamente al usuario.
