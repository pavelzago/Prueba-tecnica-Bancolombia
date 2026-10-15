# PLAN — Conciliador de facturas y retenciones

> Tablero de ejecución. Marca `[x]` al completar. Cada fase se cierra con revisión del candidato + commit.

## Avance

### Fase 0 — Setup (sesión principal) · 25 min
- [x] `git init`, `.gitignore`, limpiar `*:Zone.Identifier`
- [x] Estructura de carpetas (backend, frontend, docs, test-data)
- [x] CSV originales en `test-data/` + archivos de error en `test-data/errores/`
- [x] `CLAUDE.md`, `.claude/settings.json`, 4 agentes, skill `/verificar-entrega`
- [x] `docs/api-contract.md`
- [x] Frontend generado (Angular CLI 21.2.24, Vitest) + carpetas Atomic Design
- [x] venv backend + dependencias instaladas (requiere `python3.10-venv`)
- [x] Primer commit

### Fase 1 — Dominio y reglas · `backend-dev` · 60 min
- [x] `domain/models.py`, `domain/issue_codes.py`
- [x] `domain/rules.py` (IVA, retención, total, duplicados, cruce contable)
- [x] `services/csv_reader.py` (utf-8-sig, extensión, vacío, columnas)
- [x] `tests/test_rules.py`, `tests/test_csv_reader.py` en verde

### Fase 2 — API · `backend-dev` · 35 min
- [x] `services/reconciliation.py` (resumen + detalle)
- [x] `schemas.py`, `errors.py`, `api/routes.py`, `main.py` (CORS), `config.py`
- [x] `tests/test_api.py` golden 50/28/22 + errores
- [x] Verificado en Swagger y con curl

### Fase 3 — Frontend · `frontend-dev` (en paralelo con 1–2) · 90 min
- [x] Modelos, `ReconciliationApiService`, `ReconciliationStore`, `http-error.mapper`
- [x] Atoms: button, badge, spinner, alert, file-input
- [x] Molecules: file-drop-field, stat-card, status-filter
- [x] Organisms: upload-panel, summary-panel, results-table
- [x] Template + página; estilos y locale `es-CO`
- [x] Specs: api.service y store

### Fase 4 — Integración y QA · `qa-reviewer` · 20 min
- [x] Reporte de hallazgos
- [x] Hallazgos Bloqueante/Alta corregidos por el agente dueño (no hubo; se corrigieron Media y Bajas de código)
- [x] Flujo E2E manual en el navegador (datos reales, filtro y errores validados por el candidato, 15-oct)

### Fase 5 — Documentación · `docs-writer` · 25 min
- [ ] `README.md` reproducible
- [ ] `docs/DECLARACION_USO_IA.md` (revisada y completada por el candidato)

### Fase 6 — Presentación · `docs-writer` · 25 min
- [ ] `docs/presentacion/presentacion.md` (≤ 5 diapositivas) + capturas
- [ ] PDF exportado

### Cierre
- [ ] `/verificar-entrega` sin hallazgos bloqueantes
- [ ] Commit final y empaquetado

### Extras (solo si sobra tiempo)
- [ ] Exportar resultados a CSV
- [ ] Búsqueda por id/NIT y filtro por causa
- [ ] Posibles duplicados por contenido (FAC-0007 ↔ FAC-0045)
- [ ] docker-compose
- [ ] CI (GitHub Actions)

---

# Plan aprobado


## Contexto
La Gerencia de Evolución Contable y Tributaria cruza a mano `facturas.csv` y `contabilidad.csv`. Hay que entregar un prototipo (Angular + Python) que cargue los dos archivos, aplique reglas de validación y muestre un resumen y un detalle filtrable, junto con un README reproducible, los archivos de prueba, una presentación de máximo 5 diapositivas y la declaración de uso de IA. Tiempo: 4–5 h. Peso de la evaluación: Backend 25 %, Frontend 25 %, Integración 20 %, Contable 20 %, Documentación 10 %.

Objetivo personal: mostrar criterio, orden y trazabilidad, sin sobreingeniería.

---

## 1. Análisis de los datos de ejemplo (hecho, solo lectura)
Ambos archivos tienen **BOM UTF-8** (`EF BB BF`): si se leen con `utf-8`, la primera columna se llama `﻿id_factura` y el parser falla. Hay que leerlos con `utf-8-sig`. Es un detalle fácil de pasar por alto y conviene mencionarlo en el README.

`facturas.csv`: 50 filas. `contabilidad.csv`: 50 filas.

| Caso | Facturas |
|---|---|
| IVA reportado ≠ base × tarifa (el total cuadra con el IVA **calculado**) | FAC-0006, FAC-0018 |
| Total ≠ base + IVA − retención | FAC-0009, FAC-0023, FAC-0036 |
| Factura duplicada (mismo id, otro NIT y otros valores) | FAC-0004 ×2, FAC-0015 ×2 |
| Sin registro contable | FAC-0007, FAC-0021, FAC-0034, FAC-0042 |
| Estado contable `Pendiente` | FAC-0011, FAC-0027, FAC-0039 |
| Campo obligatorio vacío | FAC-0013 (nit), FAC-0029 (concepto), FAC-0042 (fecha) |
| Registro contable duplicado (segunda línea con débito/crédito en 0) | FAC-0001 a FAC-0006 |
| Valor contabilizado ≠ total factura | 2.ª ocurrencia de FAC-0004 y de FAC-0015 |

**Resultado esperado con las reglas propuestas: 50 facturas, 28 correctas y 22 con inconsistencia.** Estas cifras se usan en el test "golden" y en la diapositiva de resultados.

Una observación para dejar como extra: FAC-0007 (sin contabilizar) tiene exactamente los mismos valores que FAC-0045, que sí está contabilizada, pero con otro NIT. Podría ser un duplicado por contenido.

---

## 2. Reglas de negocio y supuestos (van al README)
Cada factura se evalúa **por fila** (con `fila` para trazabilidad) y acumula una lista de causas. El estado es `Correcta` si no tiene causas y `Con inconsistencia` en caso contrario.

| Código | Regla | Origen |
|---|---|---|
| `CAMPO_VACIO` | Campo obligatorio vacío (indica cuál) | Validación |
| `VALOR_INVALIDO` | Número o fecha no parseable | Validación |
| `IVA_DIFERENTE` | `valor_iva` ≠ `base × tarifa_iva` | Regla 1 |
| `RETENCION_DIFERENTE` | `valor_retencion` ≠ `base × tarifa_retencion` | Extensión natural de la regla 1 |
| `TOTAL_DIFERENTE` | `total` ≠ `base + IVA calculado − retención` | Regla 2 |
| `FACTURA_DUPLICADA` | `id_factura` aparece más de una vez (se marcan todas las ocurrencias) | Regla 3 |
| `SIN_REGISTRO_CONTABLE` | No existe en contabilidad | Regla 3 |
| `REGISTRO_CONTABLE_DUPLICADO` | Más de una línea contable para el id | Supuesto |
| `CONTABILIZACION_PENDIENTE` | Estado contable distinto de `Contabilizada` | Caso de negocio ("estados") |
| `VALOR_CONTABLE_DIFERENTE` | Suma de débitos ≠ total de la factura | Caso de negocio ("valores") |

Supuestos que hay que documentar:
- Montos con `Decimal` y redondeo a pesos (`ROUND_HALF_UP`), con tolerancia de ±1 COP. Se evita `float` por precisión contable.
- El total se valida contra el IVA **calculado**: así se distingue "IVA mal reportado" de "total mal calculado" (FAC-0006/0018 frente a FAC-0009/0023/0036).
- Cuando una factura está duplicada, se marcan todas sus ocurrencias, porque no hay criterio para saber cuál es la válida.
- Los registros contables duplicados se marcan como inconsistencia. Es la opción conservadora, porque la línea en 0 no aporta valor y requiere revisión.
- Los errores de archivo (extensión, archivo vacío, columnas obligatorias faltantes, codificación) rechazan la carga con 400/422. Los errores de fila no la rechazan: se convierten en causas de inconsistencia.

---

## 3. Arquitectura
```
Angular (SPA, :4200) ──multipart/form-data──▶ FastAPI (:8000) ──▶ parser CSV ─▶ motor de reglas (funciones puras) ─▶ respuesta JSON
```
- **Sin estado y sin base de datos**: un POST procesa y responde. El enunciado no pide persistencia y así se evita infraestructura innecesaria.
- **CORS** habilitado de forma explícita para `http://localhost:4200`, configurable por variable de entorno.

### Por qué cada decisión
- **FastAPI** (frente a Flask): validación y serialización con Pydantic, OpenAPI/Swagger gratis (`/docs`, útil para el evaluador), soporte nativo de `UploadFile` y `TestClient` para pruebas.
- **`csv` de la stdlib + `Decimal`** (frente a pandas): son 50 filas. pandas añade un peso grande, castea los montos a `float` y hace las reglas menos explícitas. Con la stdlib el código se lee como las reglas contables.
- **Reglas como funciones puras** separadas de HTTP y del parseo: se prueban de forma aislada y cada regla se puede leer por sí misma, lo que da trazabilidad.
- **Capas mínimas** (api → services → domain): sin repositorios, inyección de dependencias ni patrones que este alcance no justifica.
- **Angular standalone + signals + nuevo control flow** (`@if`, `@for`): es lo idiomático en Angular moderno y evita NgModules y NgRx.
- **Atomic Design** para reutilización. El estado vive en un único servicio de facade con signals, sin librería de estado.
- **Filtrado en el cliente**: los datos ya están en memoria y 50 filas no justifican otro endpoint.

---

## 4. Backend (Python ≥ 3.10, FastAPI, Uvicorn, Pydantic v2, pytest)

### Estructura
```
backend/
├── app/
│   ├── main.py                 # crea la app, CORS, registra routers y manejadores de errores
│   ├── config.py               # settings (CORS origins, tamaño máx. de archivo, tolerancia)
│   ├── api/routes.py           # endpoints
│   ├── schemas.py              # modelos Pydantic de respuesta y error
│   ├── errors.py               # FileValidationError + handler → {code, message, details}
│   ├── domain/
│   │   ├── models.py           # dataclasses Invoice, LedgerEntry, Issue
│   │   ├── issue_codes.py      # Enum de códigos y su descripción en español
│   │   └── rules.py            # funciones puras: expected_iva, check_total, find_duplicates…
│   └── services/
│       ├── csv_reader.py       # utf-8-sig, valida extensión, archivo vacío y columnas requeridas
│       └── reconciliation.py   # orquesta: parsea → aplica reglas → arma resumen y detalle
├── tests/
│   ├── test_rules.py           # unitarias de cálculo (IVA, total, tolerancia, duplicados)
│   ├── test_csv_reader.py      # BOM, columnas faltantes, archivo vacío
│   └── test_api.py             # golden: archivos de ejemplo → 50 / 28 / 22 y causas clave
├── requirements.txt            # versiones fijadas
└── pyproject.toml              # config de pytest/ruff (opcional)
```

### Endpoints
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Health check (lo usa el README para verificar que el backend arrancó) |
| POST | `/api/reconciliations` | multipart con `facturas` y `contabilidad`; devuelve `{summary, results}` |

### Contrato de respuesta (resumido)
```json
{
  "summary": { "total_facturas": 50, "correctas": 28, "con_inconsistencia": 22,
               "por_causa": { "SIN_REGISTRO_CONTABLE": 4, "...": 0 },
               "total_registros_contables": 50 },
  "results": [{
    "fila": 7, "id_factura": "FAC-0006", "nit_proveedor": "...", "fecha_factura": "...", "concepto": "...",
    "base_gravable": 3800000, "iva_reportado": 215000, "iva_calculado": 190000,
    "retencion_reportada": 0, "retencion_calculada": 0,
    "total_reportado": 3990000, "total_calculado": 3990000,
    "valor_contabilizado": 3990000, "estado_contable": "Contabilizada",
    "estado": "Con inconsistencia",
    "inconsistencias": [{ "codigo": "IVA_DIFERENTE", "descripcion": "IVA reportado 215.000 ≠ calculado 190.000" }]
  }]
}
```
Incluir los valores **reportado frente a calculado** es lo que da trazabilidad, y apunta al criterio contable del 20 %.

### Errores
Formato único `{code, message, details}`:
- 400 `INVALID_FILE`: extensión distinta de `.csv`, archivo vacío o codificación ilegible.
- 413: el archivo supera el tamaño máximo (p. ej. 2 MB).
- 422 `MISSING_COLUMNS`: indica qué columnas faltan y en qué archivo.
- 422 de FastAPI si no se envía alguno de los dos archivos.
- 500: handler genérico que no expone el stacktrace.

---

## 5. Frontend (Angular LTS vigente, standalone, signals, SCSS propio sin librería de UI)

### Estructura (Atomic Design)
```
frontend/src/app/
├── core/
│   ├── models/reconciliation.model.ts     # interfaces que reflejan el contrato de la API
│   ├── services/reconciliation-api.service.ts   # HttpClient: POST multipart
│   ├── services/reconciliation.store.ts   # signals: loading, error, result, filter + computed filteredResults
│   └── utils/http-error.mapper.ts         # HttpErrorResponse → mensaje legible
├── shared/ui/
│   ├── atoms/        button, badge (Correcta/Inconsistencia), spinner, alert, file-input
│   ├── molecules/    file-drop-field (label + input + nombre del archivo), stat-card, status-filter
│   └── organisms/    upload-panel, summary-panel, results-table (con fila expandible de causas)
├── templates/reconciliation-layout/       # header + slots (ng-content) para las secciones
├── pages/reconciliation-page/             # página "smart": conecta el store con los organisms
├── app.config.ts (provideHttpClient)  app.routes.ts
└── environments/environment.ts            # apiUrl
```
- **Atoms, molecules y organisms son "dumb"**: solo usan `input()` y `output()` y no inyectan servicios. Por eso son reutilizables y fáciles de probar.
- Solo la página habla con el store, lo que deja un flujo de datos unidireccional y claro.
- UX:
  - El botón "Procesar" está deshabilitado hasta tener ambos archivos y durante la carga.
  - Spinner mientras procesa y alert con el mensaje del backend si hay error.
  - Tarjetas de resumen: total, correctas, con inconsistencia y desglose por causa.
  - Filtro Todas/Correctas/Con inconsistencia y tabla con badge de estado y montos en formato COP (`CurrencyPipe` con locale `es-CO`).
  - Cada fila con inconsistencia muestra sus causas legibles.

---

## 6. Pruebas mínimas que aportan valor
- **Backend (prioridad)**:
  1. Unitarias de `rules.py`: IVA, total, tolerancia de ±1 y duplicados.
  2. `csv_reader`: BOM, columnas faltantes y archivo vacío.
  3. **Test golden de la API** con los CSV de ejemplo: 50/28/22 más las causas de 4–5 facturas representativas.
  4. Error 422 por columnas faltantes.

  El test golden protege la regla de negocio de punta a punta.
- **Frontend (mínimo)**:
  1. `reconciliation-api.service.spec` con `HttpTestingController`: verifica el FormData y la URL.
  2. `reconciliation.store.spec`: el filtro por estado.

  No se escriben specs de cada componente visual, porque aportan poco valor para el tiempo que cuestan.
- **Archivos de prueba extra** en `test-data/`: `facturas_columnas_faltantes.csv` y `vacio.csv`, para demostrar el manejo de errores (entregable 3).

---

## 7. Fases y tiempos (MVP ≈ 4 h 20 min + 20 min de colchón)

| # | Fase | Tiempo | Resultado |
|---|---|---|---|
| 0 | Setup (sesión principal): `git init` y `.gitignore`; estructura de la sección 10; `CLAUDE.md`, `.claude/settings.json`, los 4 agentes y la skill; `docs/PLAN.md` y `docs/api-contract.md`; venv; `ng new`; mover los CSV a `test-data/` | 25 min | Repo listo, agentes disponibles y primer commit |
| 1 | Dominio y reglas (models, issue_codes, rules, csv_reader) + tests unitarios | 60 min | Reglas probadas en verde |
| 2 | Servicio de conciliación, endpoint, schemas, errores, CORS + test golden | 35 min | API completa, verificada en Swagger |
| 3 | Frontend: modelos, servicio y store; atoms → molecules → organisms → página; estilos | 90 min | Flujo de UI completo |
| 4 | Integración E2E manual: cargar los CSV reales y los de error; ajustar mensajes; 2 specs de front | 20 min | Flujo principal validado |
| 5 | README + declaración de IA | 25 min | Entregables 2, 3 y 5 |
| 6 | Presentación ejecutiva (5 diapositivas) | 25 min | Entregable 4 |
| — | Colchón e imprevistos | 20 min | |

Commits pequeños por fase (`feat(backend): reglas de IVA y total`…) para que el historial cuente el orden del trabajo.

### Extras opcionales (solo si sobra tiempo, en este orden)
1. Exportar resultados a CSV (endpoint `?format=csv` o generarlo en el cliente). Es útil para el analista.
2. Búsqueda por id/NIT y filtro por tipo de causa.
3. Detectar posibles duplicados por contenido (FAC-0007 ↔ FAC-0045).
4. `docker-compose` para levantar todo con un comando.
5. GitHub Actions con pytest y `ng test`.

---

## 8. Entregables
```
prueba-tecnica-bancolombia/
├── backend/            frontend/
├── test-data/          facturas.csv, contabilidad.csv (originales) + archivos de error
├── docs/
│   ├── presentacion-ejecutiva.pdf (+ fuente)
│   └── DECLARACION_USO_IA.md
└── README.md
```
- **README**:
  - Requisitos con versiones (Python ≥ 3.10, Node ≥ 20.19, Angular CLI fijado vía npx).
  - Instalación y ejecución del backend y del frontend con comandos exactos.
  - Cómo correr los tests.
  - Cómo probar: archivos y resultado esperado 50/28/22.
  - Arquitectura breve, reglas y supuestos, decisiones técnicas.
  - Funcionalidades no completadas.
  - Enlace a la declaración de IA.
- **Presentación (5 diapositivas, lenguaje funcional)**:
  1. Problema: cruce manual, tiempo, riesgo y poca trazabilidad.
  2. Solución: el conciliador y las reglas, explicadas en lenguaje de negocio.
  3. Flujo: cargar → validar → revisar el resumen → gestionar las inconsistencias.
  4. Resultados: 50 facturas, 28 correctas, 22 con inconsistencia y desglose por causa, con capturas.
  5. Beneficios y siguientes pasos: ahorro de tiempo, trazabilidad, histórico, integración con el ERP.

  Herramienta: Marp (Markdown → PDF) o Google Slides; se entrega en PDF.
- **Declaración de IA**: herramienta (Claude Code), y por cada parte (análisis de datos, planificación, scaffolding, tests, README, presentación) qué se generó y qué revisé o validé yo. Debe ser específica, como pide el criterio.

---

## 9. Entorno detectado (WSL2)
- Python **3.10.12** (no hay 3.12). Se apunta a **Python ≥ 3.10**, que es compatible con FastAPI y Pydantic v2. Así el evaluador no tiene que instalar otra versión.
- Node **20.20.0** y npm 10.8.2. Angular CLI no está instalado de forma global, así que se usa `npx -p @angular/cli@<versión fija> ng new …` y la versión queda anotada en el README. Se elige la versión LTS de Angular vigente y compatible con Node 20.19+; se confirma con `npm view @angular/cli version` en la Fase 0.
- Git 2.34 está disponible, pero la carpeta todavía no es un repositorio. Se hace `git init` en la Fase 0.

---

## 10. Estructura de carpetas a crear (Fase 0)
```
prueba_tecnica_bancolombia/
├── CLAUDE.md                         # contexto del proyecto para Claude y los agentes (reglas, convenciones, comandos)
├── .claude/
│   ├── settings.json                 # permisos del proyecto: pytest, uvicorn, pip, npm, npx ng, git status/diff
│   ├── agents/
│   │   ├── backend-dev.md
│   │   ├── frontend-dev.md
│   │   ├── qa-reviewer.md
│   │   └── docs-writer.md
│   └── skills/
│       └── verificar-entrega/SKILL.md   # /verificar-entrega: ejecuta la checklist de la sección 12
├── docs/
│   ├── PLAN.md                       # este plan con checkboxes por fase, para ir marcando avances
│   ├── api-contract.md               # contrato JSON compartido (fuente de verdad entre back y front)
│   ├── DECLARACION_USO_IA.md
│   └── presentacion/                 # fuente de la presentación (Marp .md) + PDF exportado
├── test-data/
│   ├── facturas.csv  contabilidad.csv          # originales (se mueven desde la raíz)
│   ├── errores/facturas_columnas_faltantes.csv
│   └── errores/vacio.csv
├── backend/
│   ├── app/{api,domain,services}/  (con __init__.py)
│   ├── tests/
│   ├── requirements.txt  requirements-dev.txt
│   └── pyproject.toml
├── frontend/                         # generado con `ng new frontend --standalone --style=scss --routing --skip-git`
│   └── src/app/{core/{models,services,utils},shared/ui/{atoms,molecules,organisms},templates,pages}
├── .gitignore
└── README.md
```
`frontend/` no se crea a mano: lo genera `ng new` y después se le agregan las carpetas de Atomic Design. Así se evitan conflictos con el scaffolding.

Se eliminan los archivos `*:Zone.Identifier`, que son artefactos de Windows y no deben ir al repositorio.

---

## 11. Agentes de Claude Code (`.claude/agents/`)
Son cuatro agentes con responsabilidades claras. Un agente por capa evita mezclar contextos sin caer en un enjambre innecesario. Todos leen `CLAUDE.md` y `docs/api-contract.md`.

| Agente | Responsabilidad | Herramientas | Fases |
|---|---|---|---|
| **backend-dev** | Dominio, reglas, parser CSV, API FastAPI, errores y tests pytest. Debe dejar el test golden 50/28/22 en verde. | Read, Write, Edit, Bash, Grep, Glob | 1, 2 |
| **frontend-dev** | Angular con Atomic Design (componentes que solo usan `input()`/`output()`), servicio, store con signals, estilos y 2 specs. Solo puede consumir el contrato de `docs/api-contract.md`. | Read, Write, Edit, Bash, Grep, Glob | 3 |
| **qa-reviewer** | Verifica sin escribir código de producción: ejecuta pytest y `ng test`, levanta los dos servicios, prueba el endpoint con curl usando los CSV reales y los de error, contrasta con los criterios de evaluación y devuelve una lista de hallazgos priorizada. | Read, Bash, Grep, Glob (sin Edit/Write) | 4 y cierre |
| **docs-writer** | README reproducible, declaración de IA específica (por fase y por agente) y presentación de 5 diapositivas en lenguaje funcional. | Read, Write, Edit, Grep, Glob | 5, 6 |

Cada archivo de agente lleva frontmatter (`name`, `description`, `tools`) y un prompt corto con:
- el alcance de su carpeta y lo que **no** debe tocar;
- las convenciones del proyecto;
- la "definición de terminado" (tests en verde, comandos de verificación);
- el formato del reporte final: archivos tocados, decisiones y pendientes.

### Orquestación (quién hace qué y en qué orden)
```
Fase 0  (yo, sesión principal)  scaffolding + CLAUDE.md + agentes + api-contract.md + git init ──┐
                                                                                                  ▼
Fase 1-2  backend-dev  ───────────────┐   (en paralelo: los dos parten del mismo contrato)
Fase 3    frontend-dev ───────────────┤
                                       ▼
Fase 4    qa-reviewer → hallazgos → los corrige el agente dueño de la capa (backend-dev o frontend-dev)
Fase 5-6  docs-writer  (README, declaración de IA, presentación con capturas y cifras reales)
Cierre    /verificar-entrega + revisión tuya + commit final
```
- **Por qué se escribe el contrato primero**: permite paralelizar el backend y el frontend sin que se desalineen, y apunta directo al criterio de integración (20 %).
- **Por qué se revisa entre fases**: tú validas y haces commit al cerrar cada fase. El historial de git queda limpio y se mantiene el control humano, que además sirve para la declaración de IA.
- **Por qué no hay más agentes** (arquitecto, seguridad, etc.): con 4–5 horas, cada agente extra cuesta coordinación sin aportar valor.

---

## 12. Verificación final (checklist antes de entregar)
1. Clonar el repo en una carpeta limpia y seguir **solo** el README: el backend levanta y `GET /api/health` responde 200.
2. `pytest` pasa en verde y `ng test` pasa en verde.
3. `ng serve`: cargar `test-data/facturas.csv` y `contabilidad.csv` → ver 50 / 28 / 22. El filtro funciona y FAC-0006 muestra "IVA reportado ≠ calculado".
4. Cargar el CSV con columnas faltantes y el archivo vacío → se muestra un mensaje de error claro en la UI.
5. Apagar el backend y procesar → aparece un mensaje de error de conexión, no una pantalla rota.
6. Revisar que no haya datos sensibles ni credenciales, y que el `.gitignore` excluya `node_modules`, `.venv` y `__pycache__`.
