# Guía detallada del conciliador

Este documento amplía el [README](../README.md): instalación paso a paso, uso de la interfaz, reglas de negocio con fórmulas, análisis factura por factura de los datos de prueba, arquitectura, rendimiento y solución de problemas.

**Contenido**

1. [El problema y el alcance](#1-el-problema-y-el-alcance)
2. [Instalación detallada](#2-instalación-detallada)
3. [Uso de la interfaz](#3-uso-de-la-interfaz)
4. [Reglas de negocio](#4-reglas-de-negocio)
5. [Supuestos y su justificación](#5-supuestos-y-su-justificación)
6. [Análisis de los datos de prueba, factura por factura](#6-análisis-de-los-datos-de-prueba-factura-por-factura)
7. [Archivos de prueba y manejo de errores](#7-archivos-de-prueba-y-manejo-de-errores)
8. [API REST](#8-api-rest)
9. [Arquitectura y decisiones técnicas](#9-arquitectura-y-decisiones-técnicas)
10. [Tests](#10-tests)
11. [Volumen y rendimiento](#11-volumen-y-rendimiento)
12. [Configuración](#12-configuración)
13. [Solución de problemas](#13-solución-de-problemas)
14. [Limitaciones y siguientes pasos](#14-limitaciones-y-siguientes-pasos)

---

## 1. El problema y el alcance

Hoy la Gerencia de Evolución Contable y Tributaria cruza a mano el archivo de facturas de proveedores con el de contabilidad. Esto toma tiempo, se presta a errores y no deja rastro de por qué una factura se considera incorrecta.

El prototipo automatiza ese cruce:

1. Carga los dos archivos CSV.
2. Valida cada factura: campos, IVA, retención, total, duplicados y cruce contable.
3. Muestra un resumen y un detalle por factura donde cada inconsistencia lleva su **causa** y los **valores reportados frente a los calculados**.

Según el enunciado (`docs/Caso de estudio Analista III.md`), es un prototipo y no una solución de producción. Por eso no tiene base de datos, autenticación ni histórico. La prioridad es el flujo principal y la claridad de las reglas.

---

## 2. Instalación detallada

### 2.1 Requisitos

| Herramienta | Versión mínima | Versión probada |
|---|---|---|
| Python | >= 3.10 | 3.10.12 |
| Node.js | >= 20.19 | 20.20.0 |
| npm | incluido con Node | 10.8.2 |
| Angular CLI | se usa con `npx` (es una devDependency del proyecto); no hace falta instalarlo global | 21.2.24 |
| Git | cualquiera reciente | 2.34 |

Se probó en Ubuntu sobre WSL2. Los comandos sirven para Linux, macOS y WSL; cuando cambian en Windows (PowerShell), se indica.

En **Ubuntu/WSL**, el Python del sistema no trae `venv` ni `pip`, y sin ellos `python3 -m venv` falla con un error de `ensurepip`. Se instalan así:

```bash
sudo apt update
sudo apt install python3.10-venv python3-pip
```

### 2.2 Dependencias (versiones fijadas)

| Capa | Archivo | Dependencias |
|---|---|---|
| Backend | `backend/requirements.txt` | `fastapi==0.115.12`, `pydantic==2.14.1`, `uvicorn[standard]==0.34.2`, `python-multipart==0.0.20` |
| Tests del backend | `backend/requirements-dev.txt` (incluye el anterior) | `pytest==8.3.5`, `httpx==0.28.1` |
| Frontend | `frontend/package.json` | `@angular/*` ^21.2.0, `@angular/cli` y `@angular/build` ^21.2.24, `typescript` ~5.9.2, `rxjs` ~7.8.0, `vitest` ^4.0.8, `jsdom` ^28.0.0, `@fontsource/ibm-plex-sans` y `@fontsource/ibm-plex-mono` (fuentes alojadas en el proyecto, sin depender de CDN) |

### 2.3 Backend (puerto 8000)

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/uvicorn app.main:app --port 8000
```

En Windows (PowerShell):

```powershell
cd backend
py -3 -m venv .venv
.venv\Scripts\pip install -r requirements-dev.txt
.venv\Scripts\uvicorn app.main:app --port 8000
```

- Si prefieres activar el entorno, usa `source .venv/bin/activate` (Linux/macOS/WSL) o `.venv\Scripts\Activate.ps1` (PowerShell). Después basta con escribir `pip …`, `uvicorn …` o `pytest`.
- El backend **debe** quedar en el puerto **8000**, porque el frontend apunta a `http://localhost:8000/api`.
- Durante el desarrollo puedes añadir `--reload` para que el servidor se reinicie al cambiar el código. Sin esa opción no recarga solo.
- Para ejecutar solo la API basta con `requirements.txt`; `requirements-dev.txt` añade lo necesario para los tests.

Para comprobar que arrancó:

```bash
curl http://localhost:8000/api/health
# {"status":"ok"}
```

La documentación interactiva (Swagger) está en <http://localhost:8000/docs>, y <http://localhost:8000/> redirige ahí.

### 2.4 Frontend (puerto 4200)

```bash
cd frontend
npm install
npx ng serve
```

Los comandos son iguales en PowerShell. Abre <http://localhost:4200>. `npx ng` usa la versión de Angular CLI fijada en el proyecto, no una instalación global.

---

## 3. Uso de la interfaz

La pantalla sigue tres pasos:

1. **Cargar archivos.** Se elige un archivo de facturas y uno de contabilidad, arrastrándolos o con el selector, y se pulsa **Procesar conciliación**. El botón queda deshabilitado hasta tener los dos archivos y mientras se procesa. Después de procesar, el paso se compacta en una línea, y **Cambiar archivos** lo vuelve a abrir.
2. **Resumen.** De arriba abajo:
   - **Titular**: los archivos procesados, la fecha y hora, y cuántas facturas requieren revisión ("22 de 50 facturas requieren revisión.").
   - **Indicadores**: facturas analizadas, correctas y con inconsistencia (con su porcentaje), **monto sin contabilizar** (suma del total reportado de las facturas sin registro contable) y **diferencia neta contable** (suma de valor contabilizado − total de la factura en las facturas con `VALOR_CONTABLE_DIFERENTE`).
   - **Estado de las facturas**: gráfico de dona con las facturas correctas, las que tienen una inconsistencia y las que tienen dos o más (28 / 17 / 5 con los datos de ejemplo). Los segmentos suman el total de facturas y no dependen de ninguna prioridad entre causas.
   - **Diferencias por concepto**: para IVA, retención y total, la suma de (reportado − calculado) en las facturas marcadas por esa causa; para el valor contable, la suma de (contabilidad − factura). El signo indica hacia dónde va el error: `+` significa que se reportó (o contabilizó) de más.
   - **Inconsistencias por causa**: barras con el número de facturas que tienen cada causa. El encabezado enlaza con la dona: "28 causas en 22 facturas: 5 facturas tienen más de una, por eso la suma es mayor". La longitud de cada barra es proporcional a la causa más frecuente.
3. **Detalle por factura.** Es una tabla con estado, montos y causas.

Funciones adicionales:

- **Probar con archivos de ejemplo**: procesa directamente los CSV de ejemplo. Se sirven desde `frontend/public/ejemplos/`, que es una copia idéntica de `test-data/`. Se usa una copia y no un enlace simbólico para que funcione al clonar en Windows.
- **Causas clicables**: al pulsar una causa del resumen, la tabla muestra solo las facturas que la tienen. El filtro se quita eligiendo "Todos los tipos de error" o pulsando la causa otra vez.
- **Filtro por estado**: Todas, Correctas o Con inconsistencia.
- **Filtro por tipo de error**: un desplegable con las causas presentes en el resultado y cuántas facturas tiene cada una (por ejemplo, "Total diferente (3)"). Se combina con el estado y la búsqueda, y es el mismo filtro que se activa al pulsar una causa en el resumen.
- **Buscador** por número de factura, NIT o concepto. No distingue mayúsculas ni tildes y espera ~200 ms entre teclas antes de filtrar.
- **Reportado frente a calculado**: si el IVA, la retención o el total no cuadran, la tabla muestra el valor reportado tachado, el calculado y la diferencia.
- **Paginación** de 25, 50 o 100 filas. Los filtros, la búsqueda, los contadores y la exportación se aplican siempre a todas las facturas; solo se pinta la página actual.
- **Exportar CSV** de las filas filtradas, con separador `;`, coma decimal y BOM UTF-8 para que Excel en español lo abra con acentos y columnas correctas. Las celdas que empiezan por `=`, `+`, `-` o `@` se neutralizan para evitar la inyección de fórmulas.
- **Skeleton de carga** del resumen y la tabla, que solo aparece si el proceso tarda más de ~300 ms; así no parpadea con archivos pequeños.
- **Mensajes de error** con el texto que devuelve el backend (archivo inválido, columnas faltantes) o un aviso de conexión si el servidor no responde. El archivo rechazado se marca en su campo con una ✕ roja y el texto "Archivo con error, cámbialo", en lugar del ✓; la marca desaparece al elegir otro archivo.
- **Tema claro, oscuro o del sistema**, con un selector en la cabecera. "Sistema" sigue la preferencia del sistema operativo. La elección se guarda en el navegador y se aplica antes de que cargue la aplicación, para que no parpadee.

---

## 4. Reglas de negocio

Cada **fila** del archivo de facturas se evalúa por separado y conserva su número de fila para la trazabilidad. Cada regla que falla añade una causa a la fila. Si la fila no tiene causas, queda `Correcta`; si tiene al menos una, queda `Con inconsistencia`. Una misma factura puede acumular varias causas.

### 4.1 Cálculos

Todos los montos se manejan con `decimal.Decimal`, se redondean a pesos con `ROUND_HALF_UP` y se comparan con una tolerancia de **±1 COP**: un valor se considera correcto si `|reportado − calculado| ≤ 1`.

```
IVA calculado        = redondear(base_gravable × tarifa_iva)
Retención calculada  = redondear(base_gravable × tarifa_retencion)
Total calculado      = base_gravable + IVA calculado − retención reportada
Valor contabilizado  = suma de valor_debito de todas las líneas contables de la factura
```

Por ejemplo, FAC-0018 tiene una base de $3.450.000 y una tarifa de IVA del 19 %, así que el IVA calculado es $655.500. La factura reporta $645.500, una diferencia de $10.000 que supera la tolerancia, por lo que se marca `IVA_DIFERENTE`.

### 4.2 Códigos de inconsistencia

| Código | Cuándo se marca | Origen |
|---|---|---|
| `CAMPO_VACIO` | Un campo obligatorio está vacío. La descripción dice cuál | Validación de datos |
| `VALOR_INVALIDO` | Un número o una fecha no se puede interpretar | Validación de datos |
| `IVA_DIFERENTE` | `valor_iva` ≠ IVA calculado | Regla 1 del enunciado |
| `RETENCION_DIFERENTE` | `valor_retencion` ≠ retención calculada | Extensión natural de la regla 1 |
| `TOTAL_DIFERENTE` | `total_factura` ≠ total calculado | Regla 2 |
| `FACTURA_DUPLICADA` | El `id_factura` aparece más de una vez en el archivo de facturas | Regla 3 |
| `SIN_REGISTRO_CONTABLE` | El `id_factura` no tiene ninguna línea en contabilidad | Regla 3 |
| `REGISTRO_CONTABLE_DUPLICADO` | El `id_factura` tiene más de una línea en contabilidad | Supuesto (sección 5) |
| `CONTABILIZACION_PENDIENTE` | Alguna línea contable tiene un estado distinto de `Contabilizada` | Caso de negocio ("estados") |
| `VALOR_CONTABLE_DIFERENTE` | El valor contabilizado ≠ `total_factura` | Caso de negocio ("valores") |

Todas las columnas de facturas son obligatorias: `id_factura`, `nit_proveedor`, `fecha_factura`, `concepto`, `base_gravable`, `tarifa_iva`, `valor_iva`, `tarifa_retencion`, `valor_retencion` y `total_factura`. Si falta un valor que interviene en un cálculo, ese cálculo no se hace, pero el resto de las reglas sí se evalúa.

Si una factura no tiene registro contable, no se evalúan el estado ni el valor contabilizado, porque no hay contra qué compararlos.

---

## 5. Supuestos y su justificación

| Supuesto | Justificación |
|---|---|
| **Montos con `Decimal`, redondeo `ROUND_HALF_UP` y tolerancia de ±1 COP** (configurable con `AMOUNT_TOLERANCE`) | `float` introduce errores binarios inaceptables en cifras contables. La tolerancia evita falsos positivos por diferencias de redondeo de un peso. |
| **El total se valida contra el IVA calculado, no contra el reportado** | Así se separan dos errores distintos: "IVA mal reportado" (FAC-0006 y FAC-0018, cuyo total cuadra con el IVA correcto) y "total mal calculado" (FAC-0009, 0023 y 0036). Si se validara contra el IVA reportado, FAC-0006 aparecería además con un total erróneo que en realidad está bien. |
| **En una factura duplicada se marcan todas las ocurrencias** | No hay criterio para saber cuál es la válida: las dos ocurrencias de FAC-0004 tienen NIT y valores diferentes. La decisión queda en manos del analista. |
| **Un registro contable duplicado es una inconsistencia** | Es la opción conservadora. En los datos, la segunda línea viene con débito y crédito en 0: no altera el valor, pero indica un registro que hay que depurar. |
| **El estado `Pendiente` es una inconsistencia** | Una factura que no está contabilizada no está conciliada. |
| **Un error de archivo rechaza la carga; un error de fila no** | Un archivo con extensión incorrecta, vacío, ilegible, con más de 2 MB o sin columnas obligatorias no se puede procesar (400/413/422). Un problema en una fila, como un campo vacío o un valor inválido, solo afecta a esa factura y se reporta como su causa. |
| **Codificación UTF-8 con o sin BOM** | Los dos CSV de ejemplo traen BOM UTF-8 (`EF BB BF`). Si se leyeran con `utf-8`, la primera columna se llamaría `﻿id_factura` y fallaría la validación de columnas. Por eso se leen con `utf-8-sig`. |
| **La tolerancia del frontend es solo visual** | El frontend usa ±1 COP únicamente para resaltar montos en la tabla; la clasificación la decide siempre el backend. |

---

## 6. Análisis de los datos de prueba, factura por factura

Con `test-data/facturas.csv` (50 filas) y `test-data/contabilidad.csv` (50 líneas), el resultado es **50 facturas: 28 correctas y 22 con inconsistencia**.

### 6.1 Desglose por causa

El desglose cuenta **facturas** (filas), no ocurrencias. Como una factura puede tener varias causas, la suma (28) supera las 22 facturas con inconsistencia.

| Causa | Facturas |
|---|---|
| `REGISTRO_CONTABLE_DUPLICADO` | 7 |
| `FACTURA_DUPLICADA` | 4 |
| `SIN_REGISTRO_CONTABLE` | 4 |
| `CAMPO_VACIO` | 3 |
| `TOTAL_DIFERENTE` | 3 |
| `CONTABILIZACION_PENDIENTE` | 3 |
| `IVA_DIFERENTE` | 2 |
| `VALOR_CONTABLE_DIFERENTE` | 2 |

### 6.2 Las 22 facturas con inconsistencia

La columna "Fila" es la línea del CSV, contando el encabezado como fila 1. Montos en COP.

| Fila | Factura | Causas | Explicación |
|---|---|---|---|
| 2 | FAC-0001 | `REGISTRO_CONTABLE_DUPLICADO` | Dos líneas contables; la segunda tiene débito y crédito en 0. Los valores de la factura cuadran. |
| 3 | FAC-0002 | `REGISTRO_CONTABLE_DUPLICADO` | Igual que FAC-0001. |
| 4 | FAC-0003 | `REGISTRO_CONTABLE_DUPLICADO` | Igual que FAC-0001. |
| 5 | FAC-0004 (1.ª) | `FACTURA_DUPLICADA`, `REGISTRO_CONTABLE_DUPLICADO` | El id aparece también en la fila 50, con otro NIT. Su total (3.659.250) coincide con lo contabilizado. |
| 6 | FAC-0005 | `REGISTRO_CONTABLE_DUPLICADO` | Igual que FAC-0001. |
| 7 | FAC-0006 | `IVA_DIFERENTE`, `REGISTRO_CONTABLE_DUPLICADO` | Base 3.800.000 × 5 % = IVA de 190.000, pero se reporta 215.000. El total (3.990.000) cuadra con el IVA calculado: el error está solo en el campo IVA. |
| 8 | FAC-0007 | `SIN_REGISTRO_CONTABLE` | No existe en contabilidad. Tiene los mismos valores que FAC-0045 con otro NIT (posible duplicado por contenido, ver sección 14). |
| 10 | FAC-0009 | `TOTAL_DIFERENTE` | 560.000 + 28.000 − 22.400 = 565.600; se reporta 615.600 (+50.000). Lo contabilizado (615.600) replica el total erróneo. |
| 12 | FAC-0011 | `CONTABILIZACION_PENDIENTE` | Estado contable `Pendiente`. |
| 14 | FAC-0013 | `CAMPO_VACIO` (nit_proveedor) | Sin NIT del proveedor; los montos cuadran. |
| 16 | FAC-0015 (1.ª) | `FACTURA_DUPLICADA` | El id aparece también en la fila 51. Su total (3.603.250) coincide con lo contabilizado. |
| 19 | FAC-0018 | `IVA_DIFERENTE` | Base 3.450.000 × 19 % = 655.500, pero se reporta 645.500. El total (3.967.500) cuadra con el IVA calculado. |
| 22 | FAC-0021 | `SIN_REGISTRO_CONTABLE` | No existe en contabilidad. |
| 24 | FAC-0023 | `TOTAL_DIFERENTE` | 4.410.000 + 837.900 − 176.400 = 5.071.500; se reporta 5.051.500 (−20.000). |
| 28 | FAC-0027 | `CONTABILIZACION_PENDIENTE` | Estado contable `Pendiente`. |
| 30 | FAC-0029 | `CAMPO_VACIO` (concepto) | Sin concepto; los montos cuadran. |
| 35 | FAC-0034 | `SIN_REGISTRO_CONTABLE` | No existe en contabilidad. |
| 37 | FAC-0036 | `TOTAL_DIFERENTE` | 1.760.000 + 0 − 70.400 = 1.689.600; se reporta 1.691.100 (+1.500, por encima de la tolerancia de ±1). |
| 40 | FAC-0039 | `CONTABILIZACION_PENDIENTE` | Estado contable `Pendiente`. |
| 43 | FAC-0042 | `CAMPO_VACIO` (fecha_factura), `SIN_REGISTRO_CONTABLE` | Sin fecha y sin registro contable. |
| 50 | FAC-0004 (2.ª) | `FACTURA_DUPLICADA`, `REGISTRO_CONTABLE_DUPLICADO`, `VALOR_CONTABLE_DIFERENTE` | Otro NIT y otro total (2.213.500), pero contabilidad registra 3.659.250, que corresponde a la primera ocurrencia. |
| 51 | FAC-0015 (2.ª) | `FACTURA_DUPLICADA`, `VALOR_CONTABLE_DIFERENTE` | Otro NIT y otro total (3.425.100); contabilidad registra 3.603.250, de la primera ocurrencia. |

Observaciones para el equipo funcional:

- **FAC-0009**: contabilidad registró el total erróneo de la factura (615.600). Por eso el cruce contable cuadra y el error solo se detecta al recalcular el total. Esto muestra que el cruce contra contabilidad no basta sin validar la aritmética de la factura.
- **Duplicados FAC-0004 y FAC-0015**: hay una sola línea contable por id, pero dos facturas de proveedores distintos. Lo contabilizado coincide con la primera ocurrencia, lo que sugiere que la segunda factura no está registrada o que el id se reutilizó por error.
- **FAC-0036**: una diferencia de $1.500 es pequeña, pero supera la tolerancia de un peso. Si el negocio admitiera una tolerancia mayor, se ajustaría con `AMOUNT_TOLERANCE`, sin tocar el código.

---

## 7. Archivos de prueba y manejo de errores

`test-data/` contiene los dos CSV originales del enunciado y, en `errores/`, archivos para probar las validaciones. Si se carga cualquiera de ellos como archivo de facturas (con un `contabilidad.csv` válido), la interfaz muestra un mensaje claro:

| Archivo | Respuesta | Mensaje |
|---|---|---|
| `facturas_columnas_faltantes.csv` | 422 `MISSING_COLUMNS` | "El archivo de facturas no tiene las columnas obligatorias.", con la lista de las que faltan |
| `vacio.csv` | 400 `INVALID_FILE` | "El archivo de facturas está vacío." |
| `archivo.txt` | 400 `INVALID_FILE` | "El archivo de facturas debe tener extensión .csv." |

Otra prueba útil es detener el backend y pulsar **Procesar conciliación**: la interfaz muestra un mensaje de error de conexión en lugar de romperse.

Las mismas pruebas sin interfaz:

```bash
# Conciliación con los archivos originales
curl -s -F facturas=@test-data/facturas.csv -F contabilidad=@test-data/contabilidad.csv \
  http://localhost:8000/api/reconciliations

# Columnas faltantes → 422
curl -s -F facturas=@test-data/errores/facturas_columnas_faltantes.csv \
  -F contabilidad=@test-data/contabilidad.csv http://localhost:8000/api/reconciliations
```

---

## 8. API REST

El contrato completo, con los ejemplos de respuesta y error, está en [`api-contract.md`](api-contract.md).

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Health check: `{"status":"ok"}` |
| POST | `/api/reconciliations` | `multipart/form-data` con los campos `facturas` y `contabilidad`. Devuelve `{summary, results}` |

Cada elemento de `results` incluye la fila, los datos de la factura, los valores **reportados y calculados** (IVA, retención, total), el valor contabilizado, el número de líneas contables, el estado contable, el estado final y la lista de `inconsistencias` con su `codigo` y una `descripcion` legible.

Todos los errores siguen el formato `{code, message, details, file}`. `file` vale `"facturas"` o `"contabilidad"` cuando el error se refiere a uno de los archivos (la interfaz marca ese campo) y `null` en otro caso:

| HTTP | `code` | Cuándo |
|---|---|---|
| 400 | `INVALID_FILE` | Extensión distinta de .csv, archivo vacío o codificación ilegible |
| 413 | `FILE_TOO_LARGE` | El archivo supera `MAX_FILE_SIZE_BYTES` (2 MB) |
| 422 | `MISSING_COLUMNS` | Faltan columnas obligatorias (`details` dice cuáles y de qué archivo) |
| 422 | `MISSING_FILE` | No se envió alguno de los dos archivos |
| 404 / 405 | `NOT_FOUND` / `METHOD_NOT_ALLOWED` | Ruta o método inexistente |
| 500 | `INTERNAL_ERROR` | Error inesperado. No expone el stacktrace y lleva las cabeceras CORS para que el frontend pueda leerlo |

En Swagger (<http://localhost:8000/docs>) se puede ejecutar `POST /api/reconciliations` adjuntando los dos archivos con "Try it out".

---

## 9. Arquitectura y decisiones técnicas

```
Angular (SPA, :4200) ──multipart/form-data──▶ FastAPI (:8000) ──▶ lector CSV ──▶ reglas (funciones puras) ──▶ JSON {summary, results}
```

### 9.1 Estructura

```
backend/
├── app/
│   ├── main.py          crea la app, CORS, manejadores de error, GET / → /docs
│   ├── config.py        variables de entorno (CORS_ORIGINS, MAX_FILE_SIZE_BYTES, AMOUNT_TOLERANCE)
│   ├── api/routes.py    endpoints /api/health y /api/reconciliations
│   ├── schemas.py       modelos Pydantic de respuesta (solo en el borde HTTP)
│   ├── errors.py        formato único de error {code, message, details}
│   ├── domain/          dataclasses, códigos de inconsistencia y reglas puras (rules.py)
│   └── services/        lectura de CSV (csv_reader.py) y orquestación (reconciliation.py)
└── tests/               pytest: reglas, lector CSV y API (test golden 50/28/22)
frontend/src/app/
├── core/                modelos del contrato, servicio HTTP, store con signals, utilidades
├── shared/ui/
│   ├── atoms/           botón, badge, icono, chip, buscador, skeleton…
│   ├── molecules/       campo de archivo, tarjeta de cifra, filtro de estado…
│   └── organisms/       panel de carga, resumen, barra de herramientas, tabla de resultados
├── templates/           layout de la página
└── pages/               página que conecta el store con los componentes
```

### 9.2 Decisiones

| Decisión | Por qué |
|---|---|
| **Sin estado ni base de datos** | El enunciado no pide persistencia. Un POST procesa y responde, sin infraestructura adicional. |
| **FastAPI** en lugar de Flask | Validación y serialización con Pydantic, Swagger automático en `/docs` (útil para el evaluador), soporte nativo de archivos subidos y `TestClient` para los tests. |
| **`csv` de la stdlib y `Decimal`** en lugar de pandas | pandas convierte los montos a `float` y oculta las reglas detrás de operaciones vectoriales. Con la stdlib el código se lee como las reglas contables, y el volumen esperado no necesita pandas. |
| **Capas `api → services → domain`** | Las reglas (`domain/rules.py`) son funciones puras, sin I/O, y se prueban de forma aislada. Pydantic solo se usa en el borde HTTP; dentro del dominio se usan dataclasses. No hay repositorios ni inyección de dependencias, porque el alcance no lo justifica. |
| **Contrato primero** (`api-contract.md`) | Backend y frontend se desarrollaron en paralelo contra el mismo contrato y coinciden campo a campo. |
| **Angular standalone, signals y control flow `@if`/`@for`** | Es lo idiomático en Angular moderno y no necesita NgModules ni NgRx. El estado vive en un único `ReconciliationStore` con signals. |
| **Atomic Design** | Los atoms, molecules y organisms son presentacionales (solo `input()`/`output()`, con `OnPush`) y solo la página usa el store. El flujo de datos es unidireccional y los componentes son reutilizables. |
| **Filtrado y paginación en el cliente** | Los resultados ya están en memoria y no justifican otro endpoint (ver sección 11). |
| **SCSS propio, sin librería de UI** | Tokens de diseño (colores, espacios, tipografía IBM Plex) en CSS. Montos en formato COP con `CurrencyPipe` y locale `es-CO`. |

---

## 10. Tests

```bash
# Backend: 64 tests
cd backend
.venv/bin/pytest -q          # PowerShell: .venv\Scripts\pytest -q

# Frontend: 46 tests con Vitest
cd frontend
npx ng test --watch=false
```

| Suite | Qué cubre |
|---|---|
| `backend/tests/test_rules.py` | Cálculo de IVA, retención y total; redondeo `ROUND_HALF_UP`; tolerancia de ±1; duplicados; cruce contable |
| `backend/tests/test_csv_reader.py` | BOM, columnas faltantes, archivo vacío, extensión y tamaño |
| `backend/tests/test_api.py` | **Test golden**: procesa `test-data/` y comprueba 50/28/22, el desglose por causa y las causas de facturas representativas. También cubre los errores HTTP y el CORS |
| Frontend (`*.spec.ts`) | Servicio HTTP (FormData y URL), store (filtros por estado y tipo de error, búsqueda, paginación, skeleton y archivo marcado como inválido), debounce del buscador, cálculos del resumen (estado por número de causas y diferencias por concepto), selector de tema y exportación CSV |

El test golden protege las reglas de negocio de punta a punta: si un cambio altera la clasificación de alguna factura, falla.

Se priorizó el valor sobre la cobertura: no hay tests de cada componente visual ni pruebas E2E automatizadas. El flujo E2E se validó a mano.

---

## 11. Volumen y rendimiento

El límite por archivo es de 2 MB (`MAX_FILE_SIZE_BYTES`), que equivale a unas **20.000 facturas**. Estas son las mediciones del backend con archivos sintéticos (Python 3.10, equipo de desarrollo):

| Facturas | Tamaño del CSV | Respuesta del backend | JSON devuelto |
|---|---|---|---|
| 1.000 | 81 KB | ~90 ms | 0,5 MB |
| 5.000 | 406 KB | ~270 ms | 2,3 MB |
| 20.000 | 1,6 MB | ~1,4 s | 9,2 MB |

Con volúmenes altos, lo que más costaba era pintar la tabla en el navegador, no el cálculo. Por eso:

- el detalle se pagina en el cliente;
- la búsqueda usa texto precalculado y espera ~200 ms entre teclas;
- el skeleton solo aparece si la carga supera los ~300 ms.

Para volúmenes mayores, el siguiente paso sería paginar en el servidor, lo que implica persistir cada conciliación.

---

## 12. Configuración

Variables de entorno del backend (todas opcionales):

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `CORS_ORIGINS` | `http://localhost:4200,http://127.0.0.1:4200` | Orígenes permitidos, separados por comas |
| `MAX_FILE_SIZE_BYTES` | `2097152` (2 MB) | Tamaño máximo por archivo. Si se supera, responde 413 `FILE_TOO_LARGE` |
| `AMOUNT_TOLERANCE` | `1` | Tolerancia en pesos para comparar montos |

Ejemplo:

```bash
CORS_ORIGINS="http://localhost:4200,http://localhost:4300" .venv/bin/uvicorn app.main:app --port 8000
```

En PowerShell: `$env:CORS_ORIGINS="http://localhost:4200,http://localhost:4300"; .venv\Scripts\uvicorn app.main:app --port 8000`

En el frontend, la URL de la API está en `frontend/src/environments/environment.ts` (`apiUrl: 'http://localhost:8000/api'`). Si el backend corre en otro host o puerto, hay que cambiar ese valor.

---

## 13. Solución de problemas

| Síntoma | Causa | Solución |
|---|---|---|
| `python3 -m venv` falla y menciona `ensurepip` | Faltan paquetes en Ubuntu/WSL | `sudo apt install python3.10-venv python3-pip`, borrar `backend/.venv` y repetir |
| La interfaz dice "No fue posible conectar con el servidor" | El backend está apagado o en otro puerto | Arrancarlo en el puerto 8000 y comprobar con `curl http://localhost:8000/api/health` |
| El mismo mensaje aparece **aunque el backend responde 200** (se ve en su log) | El frontend se abrió desde un origen que no está en `CORS_ORIGINS` (otro puerto, una IP de red…) y el navegador bloquea la respuesta | Abrir `http://localhost:4200` o `http://127.0.0.1:4200`, o añadir el origen a `CORS_ORIGINS` y reiniciar el backend |
| Un cambio en el código o en una variable de entorno del backend no se refleja | Uvicorn no recarga solo | Reiniciar el proceso o arrancarlo con `--reload` |
| El puerto 4200 u 8000 está ocupado | Otro proceso lo usa | Liberarlo. Si el frontend usa otro puerto, añadirlo a `CORS_ORIGINS`; si cambia el del backend, ajustar `environment.ts` |
| El editor marca TS5011 sobre `rootDir` en `tsconfig.*.json` | VS Code trae TypeScript 6, que exige `rootDir` cuando hay `outDir` | Ya está resuelto en el repositorio (`"rootDir": "./src"`). No afecta a `ng build` ni a `ng test`, que usan TypeScript 5.9 |

---

## 14. Limitaciones y siguientes pasos

| Limitación | Siguiente paso posible |
|---|---|
| Sin persistencia ni histórico: al recargar la página se pierde la conciliación | Guardar cada conciliación con su fecha, sus archivos de origen y su resultado |
| Sin autenticación ni control de usuarios | Integrarlo con el directorio corporativo |
| **No se detectan duplicados por contenido**: FAC-0007 (sin registro contable) tiene los mismos valores que FAC-0045, pero con otro NIT | Regla adicional que compare base, IVA, retención, total y fecha, marcada como alerta en lugar de inconsistencia |
| El cruce contable es solo por `id_factura`: no se validan `cuenta_contable`, `centro_costo`, `valor_credito` ni la fecha de contabilización frente a la de la factura | Reglas de partida doble (débito = crédito), del plan de cuentas y de periodo contable |
| Formato de entrada fijo: coma como separador, punto decimal y fechas ISO `yyyy-mm-dd` | Detectar el separador y el formato regional |
| Volumen limitado a unas 20.000 facturas por archivo | Paginación en el servidor y procesamiento asíncrono |
| No hay tests E2E automatizados, `docker-compose` ni CI | Playwright para el flujo principal, `docker-compose` para levantar todo con un comando y GitHub Actions con pytest y `ng test` |
| La URL de la API se configura en `environment.ts` y requiere recompilar | Configuración en tiempo de ejecución (por ejemplo, un `config.json` servido con la app) |
