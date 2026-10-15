# Declaración de uso de inteligencia artificial generativa

**Sí se utilizó IA generativa** en el desarrollo de esta solución.

## Herramienta

- **Claude Code** (CLI de Anthropic), modelo **Claude Opus 5.5**.
- Una **sesión principal** orquestó el trabajo y delegó partes concretas en **subagentes** con un rol definido en `.claude/agents/`:
  - `backend-dev`: dominio, reglas, API y tests de Python;
  - `frontend-dev`: aplicación Angular;
  - `qa-reviewer`: revisión de solo lectura (no escribe código de producción);
  - `docs-writer`: README, esta declaración y la presentación.
- Como esos agentes aún no estaban cargados en la sesión cuando se usaron, se ejecutaron como agentes de propósito general siguiendo las instrucciones de su archivo de rol.
- El contexto común (reglas, convenciones, comandos) está en `CLAUDE.md`, y el contrato entre backend y frontend en `docs/api-contract.md`.

Toda la interacción con la IA se hizo con los datos ficticios del enunciado; no se usó información real ni credenciales.

## Uso por parte de la solución

| Parte | Qué generó la IA | Con qué propósito | Qué revisó, decidió o corrigió el candidato |
|---|---|---|---|
| **Análisis de datos** | Lectura del enunciado y de los CSV. Detectó el BOM UTF-8 en ambos archivos y catalogó los casos: duplicados, sin registro contable, estados pendientes, campos vacíos, diferencias de IVA y de total, registros contables duplicados. Calculó el resultado esperado 50 / 28 / 22. | Entender los datos antes de programar y fijar una cifra objetivo verificable (test "golden"). | [COMPLETAR POR EL CANDIDATO: indicar si contrastó personalmente algunos casos o cifras con los CSV] |
| **Planificación** | Plan por fases (`docs/PLAN.md`): arquitectura, reglas, supuestos de negocio, estructura de carpetas, pruebas y tiempos. | Ordenar el trabajo de 4–5 h y justificar cada decisión. | Pidió explícitamente **Angular con Atomic Design** y **Python con API REST**, **sin sobreingeniería**. Pidió la estructura de carpetas y el esquema de agentes. **Aprobó el plan** antes de empezar. |
| **Scaffolding** | Sesión principal: `git init`, `.gitignore`, estructura de carpetas, `CLAUDE.md`, archivos de agentes, contrato `docs/api-contract.md`, proyecto Angular con `ng new` (Angular CLI 21.2.24, elegido por compatibilidad con Node 20), entorno virtual de Python. | Dejar el repositorio listo y un contrato común para desarrollar backend y frontend en paralelo. | Aprobó el cierre de la fase y el commit. [COMPLETAR POR EL CANDIDATO: si revisó o ajustó el contrato API] |
| **Backend** | Subagente `backend-dev`: dominio, reglas como funciones puras, lector CSV, API FastAPI, manejo de errores y 61 tests iniciales. La sesión principal verificó el resultado de forma independiente (tests y llamadas reales). Correcciones posteriores: CORS para `127.0.0.1:4200`, respuestas 500 con cabeceras CORS, 404 con formato uniforme y redirección de `/` a `/docs` (hoy 64 tests). | Implementar las reglas del enunciado con trazabilidad (valores reportados frente a calculados) y errores claros. | **Detectó al probar en el navegador** que la app abierta en `127.0.0.1:4200` no conectaba con el backend (CORS), lo que originó la corrección. [COMPLETAR POR EL CANDIDATO: nivel de revisión del código del backend] |
| **Frontend** | Subagente `frontend-dev`: modelos, servicio HTTP, store con signals, componentes Atomic Design, estilos y 6 tests iniciales. Después, un subagente de rediseño de UX/UI guiado por una skill de diseño, y mejoras de uso (archivos de ejemplo, causas clicables, buscador, exportación CSV, tema oscuro). | Construir la pantalla de carga, resumen y detalle filtrable que pide el enunciado, con una experiencia cuidada. | **Pidió el rediseño de UX/UI** y las mejoras. [COMPLETAR POR EL CANDIDATO: qué revisó o ajustó del resultado visual] |
| **Tests** | Tests de backend (reglas, lector CSV, API con test golden 50/28/22 y casos de error) y tests de frontend en Vitest (servicio HTTP y store). | Proteger las reglas de negocio de punta a punta y el contrato con la API. | [COMPLETAR POR EL CANDIDATO: si ejecutó los tests personalmente] |
| **QA e integración** | Subagente `qa-reviewer` (solo lectura): recálculo independiente de 6 facturas, 10 casos de error, verificación del contrato y de CORS. La sesión principal corrigió los hallazgos. | Tener una segunda revisión independiente antes de documentar. | **Hizo las pruebas manuales en el navegador**: flujo principal con los CSV de ejemplo, filtro por estado y archivos de error. |
| **Documentación** | Subagente `docs-writer`: `README.md` y esta declaración, a partir del código, el plan y comprobaciones en vivo (tests, cifras del endpoint y respuestas de error). | Que el evaluador pueda reproducir la solución siguiendo solo el README y que el uso de IA quede explícito. | [COMPLETAR POR EL CANDIDATO: revisión y ajustes de esta declaración y del README] |
| **Presentación** | Subagente `docs-writer`: presentación ejecutiva (≤ 5 diapositivas) en lenguaje funcional, con las cifras reales y capturas. | Exponer la propuesta al equipo funcional. | [COMPLETAR POR EL CANDIDATO: revisión del contenido y del mensaje] |
| **Control de versiones** | Commits por fase con mensajes Conventional Commits en español, con la línea `Co-Authored-By: Claude` visible en el historial. | Que el historial muestre el orden del trabajo y la participación de la IA. | Aprobó el cierre de cada fase. **El `push` al repositorio lo ejecuta el candidato.** |

## Decisiones de negocio

Los siguientes supuestos los **propuso la IA** en el plan y el candidato los **aprobó al aprobar el plan**:

1. **El total se valida contra el IVA calculado** (no contra el reportado), para distinguir "IVA mal reportado" de "total mal calculado".
2. **En facturas duplicadas se marcan todas las ocurrencias**, porque no hay criterio para saber cuál es la válida.
3. **Un registro contable duplicado es inconsistencia** (opción conservadora: la línea en 0 debe revisarse).
4. **El estado contable `Pendiente` es inconsistencia**: la factura no está conciliada.
5. **Montos con `Decimal`, redondeo a pesos y tolerancia de ±1 COP**, para evitar errores de precisión y falsos positivos por redondeo.

[COMPLETAR POR EL CANDIDATO: confirmar o ajustar cada supuesto y, si aplica, explicar con su propio criterio contable por qué lo acepta.]

## Responsabilidad

[COMPLETAR POR EL CANDIDATO: declaración personal, p. ej. que entiende la solución entregada, que puede explicar y defender sus reglas y decisiones, y que asume la responsabilidad de su contenido.]
