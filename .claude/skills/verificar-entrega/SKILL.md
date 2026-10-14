---
name: verificar-entrega
description: Ejecuta la checklist final de entrega del conciliador (tests, golden 50/28/22, errores, contrato, README, higiene) delegando en el agente qa-reviewer, y resume si la entrega está lista.
---

# Verificar entrega

1. Lanza el subagente **qa-reviewer** con este encargo: "Ejecuta tu verificación completa (puntos 1 a 8) y entrega tu reporte final".
2. Con su reporte, verifica también estos entregables de la prueba:
   - [ ] Código de backend y frontend.
   - [ ] `README.md` con versiones, dependencias, comandos, configuración, supuestos y funcionalidades no completadas.
   - [ ] Archivos de prueba en `test-data/` (originales + `errores/`).
   - [ ] Presentación de máximo 5 diapositivas en `docs/presentacion/` (fuente + PDF).
   - [ ] `docs/DECLARACION_USO_IA.md` sin marcadores `[COMPLETAR POR EL CANDIDATO]` pendientes.
3. Revisa `git status`: no deben quedar cambios sin commit ni archivos que no deberían versionarse (`.venv`, `node_modules`, `*:Zone.Identifier`).
4. Responde al usuario con:
   - la tabla de hallazgos Bloqueante/Alta;
   - el checklist de entregables;
   - el veredicto final.

   No corrijas nada sin que el usuario lo pida.
