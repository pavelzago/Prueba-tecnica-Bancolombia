# Conciliador de facturas y retenciones

Prototipo web para la Gerencia de Evolución Contable y Tributaria (prueba técnica Analista III). Carga `facturas.csv` y `contabilidad.csv`, aplica las reglas contables y tributarias (IVA, total, duplicados, cruce con contabilidad) y muestra:

- un **resumen**: total de facturas, correctas, con inconsistencia y desglose por causa;
- un **detalle** por factura, filtrable por estado (`Correcta` / `Con inconsistencia`), con la causa y los valores **reportados frente a calculados** para que cada diferencia sea trazable.

Stack: **Angular 21** (frontend) + **Python / FastAPI** (API REST). Sin base de datos: cada carga se procesa y se responde en una sola petición.

![Resultados de la conciliación](docs/presentacion/img/conciliador-claro-desktop-resultados.png)

---

## 1. Requisitos

| Herramienta | Versión mínima | Versión probada |
|---|---|---|
| Python | >= 3.10 | 3.10.12 |
| Node.js | >= 20.19 | 20.20.0 |
| npm | incluido con Node | 10.8.2 |
| Angular CLI | se usa vía `npx` (devDependency del proyecto), **no** hace falta instalarlo global | 21.2.24 |
| Git | cualquiera reciente | 2.34 |

Probado en Ubuntu sobre WSL2. Los comandos sirven para Linux, macOS y WSL; donde cambian en Windows (PowerShell) se indica.

**Ubuntu / WSL:** el Python del sistema no trae `venv` ni `pip`. Sin estos paquetes, `python3 -m venv` falla con un error de `ensurepip`:

```bash
sudo apt update
sudo apt install python3.10-venv python3-pip
```

### Dependencias (versiones fijadas)

- Backend (`backend/requirements.txt`): `fastapi==0.115.12`, `pydantic==2.14.1`, `uvicorn[standard]==0.34.2`, `python-multipart==0.0.20`.
- Tests del backend (`backend/requirements-dev.txt`): `pytest==8.3.5`, `httpx==0.28.1`.
- Frontend (`frontend/package.json`): `@angular/*` ^21.2.0, `@angular/cli` y `@angular/build` ^21.2.24, `typescript` ~5.9.2, `rxjs` ~7.8.0, `vitest` ^4.0.8, `jsdom` ^28.0.0.

---

## 2. Estructura del repositorio

```
.
├── backend/                 API REST en FastAPI
│   ├── app/
│   │   ├── main.py          crea la app, CORS, manejadores de error, GET / → /docs
│   │   ├── config.py        variables de entorno (CORS_ORIGINS, MAX_FILE_SIZE_BYTES, AMOUNT_TOLERANCE)
│   │   ├── api/routes.py    endpoints /api/health y /api/reconciliations
│   │   ├── schemas.py       modelos Pydantic de respuesta
│   │   ├── errors.py        formato único de error {code, message, details}
│   │   ├── domain/          reglas de negocio como funciones puras (rules.py), códigos de inconsistencia
│   │   └── services/        lectura de CSV (csv_reader.py) y orquestación (reconciliation.py)
│   ├── tests/               pytest: reglas, lector CSV y API (test "golden" 50/28/22)
│   └── requirements.txt / requirements-dev.txt
├── frontend/                Angular 21 standalone + signals, Atomic Design, tests con Vitest
│   └── src/app/
│       ├── core/            modelos, servicio HTTP, store con signals, mapeo de errores
│       ├── shared/ui/       atoms / molecules / organisms (presentacionales)
│       ├── templates/       layout de la página
│       └── pages/           página que conecta el store con los componentes
├── test-data/               CSV de ejemplo originales + errores/ para probar validaciones
├── docs/                    plan, contrato API, declaración de IA, presentación
└── README.md
```

---

## 3. Instalación y ejecución

Se necesitan **dos terminales**: una para el backend y otra para el frontend. Todos los comandos parten de la raíz del repositorio.

### 3.1 Backend (puerto 8000)

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/uvicorn app.main:app --port 8000
```

Windows (PowerShell):

```powershell
cd backend
py -3 -m venv .venv
.venv\Scripts\pip install -r requirements-dev.txt
.venv\Scripts\uvicorn app.main:app --port 8000
```

> Si prefieres activar el entorno: `source .venv/bin/activate` (Linux/macOS/WSL) o `.venv\Scripts\Activate.ps1` (PowerShell). Después basta con `pip ...`, `uvicorn ...`, `pytest`.

El backend **debe** quedar en el puerto **8000**: el frontend apunta a `http://localhost:8000/api` (`frontend/src/environments/environment.ts`).

Comprobar que arrancó:

```bash
curl http://localhost:8000/api/health
# {"status":"ok"}
```

- Documentación interactiva (Swagger): <http://localhost:8000/docs>. Abrir <http://localhost:8000/> redirige ahí.
- `requirements-dev.txt` incluye `requirements.txt` más las dependencias de test. Para solo ejecutar la API basta con `requirements.txt`.
- Durante desarrollo puedes añadir `--reload` para que el servidor se reinicie al cambiar el código; sin esa opción **no** recarga solo.

### 3.2 Frontend (puerto 4200)

```bash
cd frontend
npm install
npx ng serve
```

(Igual en PowerShell.) Abrir <http://localhost:4200>.

`npx ng` usa la versión de Angular CLI fijada en el proyecto (21.2.24), no una instalación global.

---

## 4. Cómo probar

### 4.1 Flujo principal

1. Con backend y frontend en marcha, abrir <http://localhost:4200>.
2. Seleccionar `test-data/facturas.csv` como archivo de facturas y `test-data/contabilidad.csv` como archivo de contabilidad.
3. Pulsar **Procesar conciliación**.

Atajo: el botón **Probar con archivos de ejemplo** hace los pasos 2 y 3 con esos mismos archivos.

**Resultado esperado: 50 facturas, 28 correctas, 22 con inconsistencia.**

Desglose por causa (cuenta **facturas** afectadas, no ocurrencias; una factura puede tener varias causas, por eso la suma supera 22):

| Causa | Facturas | Ejemplos |
|---|---|---|
| `REGISTRO_CONTABLE_DUPLICADO` | 7 | FAC-0001 a FAC-0006 (FAC-0004 aparece dos veces en facturas) |
| `FACTURA_DUPLICADA` | 4 | FAC-0004 ×2, FAC-0015 ×2 |
| `SIN_REGISTRO_CONTABLE` | 4 | FAC-0007, FAC-0021, FAC-0034, FAC-0042 |
| `CAMPO_VACIO` | 3 | FAC-0013 (nit), FAC-0029 (concepto), FAC-0042 (fecha) |
| `TOTAL_DIFERENTE` | 3 | FAC-0009, FAC-0023, FAC-0036 |
| `CONTABILIZACION_PENDIENTE` | 3 | FAC-0011, FAC-0027, FAC-0039 |
| `IVA_DIFERENTE` | 2 | FAC-0006, FAC-0018 |
| `VALOR_CONTABLE_DIFERENTE` | 2 | 2.ª ocurrencia de FAC-0004 y de FAC-0015 |

Las mismas cifras se pueden obtener sin interfaz:

```bash
curl -s -F facturas=@test-data/facturas.csv -F contabilidad=@test-data/contabilidad.csv \
  http://localhost:8000/api/reconciliations
```

### 4.2 Archivos de error (`test-data/errores/`)

Cargar cualquiera de ellos como archivo de facturas (con `contabilidad.csv` válido) debe mostrar un mensaje de error claro en la interfaz:

| Archivo | Respuesta | Mensaje |
|---|---|---|
| `facturas_columnas_faltantes.csv` | 422 `MISSING_COLUMNS` | "El archivo de facturas no tiene las columnas obligatorias." (+ lista de columnas faltantes) |
| `vacio.csv` | 400 `INVALID_FILE` | "El archivo de facturas está vacío." |
| `archivo.txt` | 400 `INVALID_FILE` | "El archivo de facturas debe tener extensión .csv." |

Con curl:

```bash
curl -s -F facturas=@test-data/errores/facturas_columnas_faltantes.csv \
  -F contabilidad=@test-data/contabilidad.csv http://localhost:8000/api/reconciliations
```

Otra prueba útil: detener el backend y pulsar **Procesar conciliación**; la interfaz muestra un mensaje de error de conexión en lugar de romperse.

### 4.3 Swagger

En <http://localhost:8000/docs> se puede ejecutar `POST /api/reconciliations` adjuntando los dos archivos ("Try it out"). Todos los errores siguen el formato `{code, message, details}`, descrito en [`docs/api-contract.md`](docs/api-contract.md).

### 4.4 Uso de la interfaz

La pantalla sigue tres pasos: **1. Cargar archivos** (se compacta en una línea tras procesar; "Cambiar archivos" la reabre), **2. Resumen** y **3. Detalle por factura**. Además:

- **Probar con archivos de ejemplo**: procesa directamente los CSV de ejemplo sin buscarlos en disco. Se sirven desde `frontend/public/ejemplos/`, una copia idéntica de `test-data/` (se usa copia y no enlace simbólico para que funcione al clonar en Windows).
- **Causas clicables** en el resumen: al pulsar una causa, la tabla se filtra a las facturas que la tienen; se quita con la × del chip o pulsando de nuevo.
- **Buscador** por número de factura, NIT o concepto (ignora mayúsculas y tildes).
- **Valores reportado vs calculado**: si el IVA, la retención o el total no cuadran, la tabla muestra el valor reportado tachado, el calculado y la diferencia.
- **Filtro por estado**: Todas / Correctas / Con inconsistencia.
- **Exportar CSV** de las filas filtradas, con separador `;`, coma decimal y BOM UTF-8 para que Excel en español lo abra con acentos y columnas correctas.
- **Tema oscuro** automático según la preferencia del sistema operativo.

---

## 5. Tests

```bash
# Backend: 64 tests (reglas, lector CSV, API con test golden 50/28/22 y errores)
cd backend
.venv/bin/pytest -q          # PowerShell: .venv\Scripts\pytest -q

# Frontend: 18 tests con Vitest (servicio HTTP, store con filtros/búsqueda y exportación CSV)
cd frontend
npx ng test --watch=false
```

El test golden (`backend/tests/test_api.py`) procesa los CSV de `test-data/` y comprueba 50/28/22 y las causas de facturas representativas: protege las reglas de negocio de punta a punta.

---

## 6. Reglas de negocio y supuestos

Cada fila de `facturas.csv` se evalúa por separado (con su número de `fila` para trazabilidad) y acumula una lista de causas. Sin causas → `Correcta`; con al menos una → `Con inconsistencia`.

| Código | Regla | Origen |
|---|---|---|
| `CAMPO_VACIO` | Campo obligatorio vacío (indica cuál) | Validación |
| `VALOR_INVALIDO` | Número o fecha no interpretable | Validación |
| `IVA_DIFERENTE` | `valor_iva` ≠ `base_gravable × tarifa_iva` | Regla 1 del enunciado |
| `RETENCION_DIFERENTE` | `valor_retencion` ≠ `base_gravable × tarifa_retencion` | Extensión natural de la regla 1 |
| `TOTAL_DIFERENTE` | `total_factura` ≠ `base + IVA calculado − retención reportada` | Regla 2 |
| `FACTURA_DUPLICADA` | `id_factura` repetido en facturas | Regla 3 |
| `SIN_REGISTRO_CONTABLE` | `id_factura` no existe en contabilidad | Regla 3 |
| `REGISTRO_CONTABLE_DUPLICADO` | Más de una línea contable para el mismo id | Supuesto |
| `CONTABILIZACION_PENDIENTE` | Estado contable distinto de `Contabilizada` | Caso de negocio ("estados") |
| `VALOR_CONTABLE_DIFERENTE` | Suma de `valor_debito` ≠ total de la factura | Caso de negocio ("valores") |

Supuestos y su porqué:

- **Montos con `Decimal`, redondeo a pesos `ROUND_HALF_UP` y tolerancia de ±1 COP** (configurable con `AMOUNT_TOLERANCE`). `float` introduce errores de precisión inaceptables en cifras contables; la tolerancia evita falsos positivos por redondeo.
- **El total se valida contra el IVA calculado**, no contra el reportado. Así se distingue "IVA mal reportado" (FAC-0006, FAC-0018: el total cuadra con el IVA correcto) de "total mal calculado" (FAC-0009, FAC-0023, FAC-0036).
- **Facturas duplicadas: se marcan todas las ocurrencias**, porque no hay criterio para saber cuál es la válida; la decisión queda al analista.
- **Registro contable duplicado = inconsistencia**. Es la opción conservadora: la segunda línea (débito/crédito en 0) no aporta valor pero indica un registro que hay que revisar.
- **Estado `Pendiente` = inconsistencia**: una factura no contabilizada no está conciliada.
- **Errores de archivo vs. errores de fila**: un archivo con extensión incorrecta, vacío, ilegible o sin columnas obligatorias se **rechaza** (400/413/422). Un problema en una fila (campo vacío, valor inválido) **no** rechaza la carga: se reporta como causa de esa factura.
- **Codificación**: los CSV de ejemplo traen BOM UTF-8; se leen con `utf-8-sig` (con o sin BOM funciona).
- La tolerancia ±1 COP que usa el frontend solo afecta al **resaltado visual** de montos en la tabla; la clasificación la decide siempre el backend.

---

## 7. Arquitectura y decisiones técnicas

```
Angular (SPA, :4200) ──multipart/form-data──▶ FastAPI (:8000) ──▶ lector CSV ──▶ reglas (funciones puras) ──▶ JSON {summary, results}
```

- **Sin estado ni base de datos**: el enunciado no pide persistencia; un POST procesa y responde.
- **FastAPI**: validación con Pydantic, Swagger automático en `/docs` y `TestClient` para los tests.
- **`csv` de la librería estándar + `Decimal`** en lugar de pandas: son decenas de filas; pandas convierte montos a `float` y oculta las reglas. Con la stdlib el código se lee como las reglas contables.
- **Capas mínimas `api → services → domain`**: las reglas (`domain/rules.py`) son funciones puras sin I/O, probadas de forma aislada. Sin repositorios ni inyección de dependencias: el alcance no lo justifica.
- **Contrato primero** (`docs/api-contract.md`): backend y frontend se desarrollaron en paralelo contra el mismo contrato, campo a campo.
- **Angular standalone + signals + control flow `@if/@for`**: lo idiomático en Angular moderno, sin NgModules ni NgRx. El estado vive en un único `ReconciliationStore` con signals.
- **Atomic Design**: atoms, molecules y organisms son presentacionales (solo `input()`/`output()`); solo la página usa el store. Flujo de datos unidireccional y componentes reutilizables.
- **Filtrado en el cliente**: los resultados ya están en memoria; no justifica otro endpoint.
- **SCSS propio, sin librería de UI**; montos en formato COP (`CurrencyPipe`, locale `es-CO`).

---

## 8. Configuración

Backend (variables de entorno, todas opcionales):

| Variable | Por defecto | Descripción |
|---|---|---|
| `CORS_ORIGINS` | `http://localhost:4200,http://127.0.0.1:4200` | Orígenes permitidos, separados por comas |
| `MAX_FILE_SIZE_BYTES` | `2097152` (2 MB) | Tamaño máximo por archivo (si se supera → 413 `FILE_TOO_LARGE`) |
| `AMOUNT_TOLERANCE` | `1` | Tolerancia en pesos para comparar montos |

Ejemplo:

```bash
CORS_ORIGINS="http://localhost:4200,http://localhost:4300" .venv/bin/uvicorn app.main:app --port 8000
```

PowerShell: `$env:CORS_ORIGINS="http://localhost:4200,http://localhost:4300"; .venv\Scripts\uvicorn app.main:app --port 8000`

Frontend: la URL de la API está en `frontend/src/environments/environment.ts` (`apiUrl: 'http://localhost:8000/api'`). Si el backend corre en otro host o puerto, cambiar ese valor.

---

## 9. Solución de problemas

| Síntoma | Causa | Solución |
|---|---|---|
| `python3 -m venv` falla mencionando `ensurepip` | Faltan paquetes en Ubuntu/WSL | `sudo apt install python3.10-venv python3-pip`, borrar `backend/.venv` y repetir |
| La interfaz dice "No fue posible conectar con el servidor" | Backend apagado o en otro puerto | Arrancarlo en el puerto 8000 y comprobar `curl http://localhost:8000/api/health` |
| La interfaz dice "No fue posible conectar con el servidor" **aunque el backend responde 200** (se ve en su log) | El frontend se abrió desde un origen que no está en `CORS_ORIGINS` (otro puerto, IP de red, etc.) y el navegador bloquea la respuesta | Abrir el frontend en `http://localhost:4200` o `http://127.0.0.1:4200`, o añadir el origen a `CORS_ORIGINS` y reiniciar el backend |
| Un cambio en el código o en una variable de entorno del backend no se refleja | Uvicorn no recarga solo | Reiniciar el proceso, o arrancarlo con `--reload` |
| El puerto 4200 u 8000 está ocupado | Otro proceso lo usa | Liberarlo. Si se usa otro puerto para el front, añadirlo a `CORS_ORIGINS`; si se cambia el del backend, ajustar `environment.ts` |

---

## 10. Limitaciones y funcionalidades no completadas

- **Sin persistencia ni histórico**: cada conciliación vive solo en el navegador; al recargar la página se pierde.
- **Sin autenticación** ni control de usuarios: es un prototipo local.
- **No se detectan duplicados por contenido**: FAC-0007 (sin registro contable) tiene los mismos valores que FAC-0045 con otro NIT; podría ser la misma factura, pero no se marca como duplicada (solo se detectan duplicados por `id_factura`).
- **El cruce contable es por `id_factura`**: no se validan `cuenta_contable`, `centro_costo`, `valor_credito` ni la fecha de contabilización frente a la de la factura.
- **Formato de entrada fijo**: separador coma, punto decimal y fechas ISO `yyyy-mm-dd`; no se detectan otros formatos regionales.
- **Tests del frontend enfocados en la lógica** (servicio HTTP, store y exportación CSV); no hay tests de componentes visuales ni pruebas E2E automatizadas (el flujo E2E se validó manualmente).
- No hay `docker-compose` ni CI.
- Configuración del frontend por `environment.ts` (requiere recompilar si cambia la URL de la API).

---

## 11. Uso de inteligencia artificial

Esta solución se desarrolló con apoyo de IA generativa (Claude Code). El detalle de qué se generó, con qué propósito y qué revisó o decidió el candidato está en [`docs/DECLARACION_USO_IA.md`](docs/DECLARACION_USO_IA.md).
