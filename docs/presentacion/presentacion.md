---
marp: true
size: 16:9
paginate: true
lang: es
title: Conciliador de facturas y retenciones
---

<style>
@font-face { font-family: 'Plex'; font-weight: 400; src: url('../../frontend/node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2') format('woff2'); }
@font-face { font-family: 'Plex'; font-weight: 500; src: url('../../frontend/node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2') format('woff2'); }
@font-face { font-family: 'Plex'; font-weight: 600; src: url('../../frontend/node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2') format('woff2'); }
@font-face { font-family: 'Plex'; font-weight: 700; src: url('../../frontend/node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-700-normal.woff2') format('woff2'); }

:root {
  --bg: #f7f5f0;
  --card: #ffffff;
  --ink: #1f1d1a;
  --muted: #6b665d;
  --line: #e2ddd2;
  --accent: #fdda24;
  --ok: #1f6b3a;
  --bad: #b3261e;
}
section {
  font-family: 'Plex', 'IBM Plex Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  background: var(--bg);
  color: var(--ink);
  font-size: 24px;
  line-height: 1.4;
  padding: 56px 72px 48px;
  border-top: 10px solid var(--accent);
  justify-content: flex-start !important;
}
section::after { color: var(--muted); font-size: 16px; right: 40px; bottom: 24px; }
h1 { font-size: 44px; font-weight: 600; margin: 0 0 6px; color: var(--ink); line-height: 1.15; }
.kicker { font-size: 15px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); font-weight: 500; margin: 0 0 10px; }
.lead { font-size: 26px; color: var(--muted); margin: 0 0 26px; max-width: 980px; }
strong { font-weight: 600; }
.mark { background: linear-gradient(transparent 58%, var(--accent) 58%); }
.grid { display: grid; gap: 22px; }
.g2 { grid-template-columns: 1fr 1fr; }
.g3 { grid-template-columns: repeat(3, 1fr); }
.g4 { grid-template-columns: repeat(4, 1fr); }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 20px 22px; }
.card h3 { font-size: 22px; margin: 0 0 6px; font-weight: 600; }
.card p { font-size: 19px; color: var(--muted); margin: 0; }
.ok { color: var(--ok); }
.bad { color: var(--bad); }
.tag { display: inline-block; font-size: 17px; font-weight: 600; padding: 3px 12px; border-radius: 4px; border: 1px solid; }
.tag.ok { background: #eaf4ed; }
.tag.bad { background: #fbeceb; }

/* Diapositiva 1 */
.pain .card { border-left: 4px solid var(--ink); }
.big { font-size: 64px; font-weight: 600; line-height: 1; margin: 0 0 8px; }

/* Diapositiva 2 */
.rules { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 22px; }
.rule { background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 12px 18px; }
.rule b { display: block; font-size: 20px; font-weight: 600; }
.rule span { display: block; line-height: 1.35; font-size: 17px; color: var(--muted); }
.outcome { margin-top: 20px; font-size: 21px; display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }

/* Diapositiva 3 */
.flow { display: grid; grid-template-columns: 1fr 40px 1fr 40px 1fr 40px 1fr; align-items: stretch; margin-top: 48px; }
.flow .step { min-height: 210px; }
.step { background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 22px 20px; }
.step .n { display: inline-flex; width: 40px; height: 40px; align-items: center; justify-content: center; background: var(--accent); font-weight: 700; font-size: 20px; border-radius: 4px; margin-bottom: 14px; }
.step h3 { font-size: 23px; margin: 0 0 8px; font-weight: 600; }
.step p { font-size: 18px; color: var(--muted); margin: 0; }
.arrow { display: flex; align-items: center; justify-content: center; font-size: 30px; color: var(--muted); }
.note { margin-top: 44px; font-size: 20px; color: var(--muted); }

/* Diapositiva 4 */
.res { display: grid; grid-template-columns: 450px 1fr; gap: 28px; }
.kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
.kpi { background: var(--card); border: 1px solid var(--line); border-left: 4px solid var(--muted); border-radius: 6px; padding: 10px 12px; }
.kpi.ok { border-left-color: var(--ok); }
.kpi.bad { border-left-color: var(--bad); }
.kpi .v { font-size: 46px; font-weight: 600; line-height: 1; color: var(--ink); }
.kpi .l { font-size: 14px; white-space: nowrap; color: var(--muted); }
.kpi .p { font-size: 18px; font-weight: 500; }
table.causes { width: 100%; border-collapse: collapse; font-size: 16px; display: table; }
table.causes td { padding: 4px 6px; border: 0; border-bottom: 1px solid var(--line); background: transparent; }
table.causes td:last-child { text-align: right; font-weight: 600; width: 40px; }
table.causes tr { background: transparent !important; }
.fine { font-size: 13px; color: var(--muted); margin-top: 6px; }
.shot { height: 330px; overflow: hidden; border: 1px solid var(--line); border-radius: 6px; background: #fff; }
.shot img { width: 100%; margin-top: -62px; display: block; }
.example { margin-top: 14px; background: var(--card); border: 1px solid var(--line); border-left: 4px solid var(--bad); border-radius: 6px; padding: 12px 18px; font-size: 18px; }
.example .nums { display: flex; gap: 30px; margin-top: 4px; align-items: baseline; flex-wrap: wrap; }
.example .nums div { font-size: 14px; color: var(--muted); }
.example .nums b { display: block; font-size: 26px; color: var(--ink); font-weight: 600; }
.strike { text-decoration: line-through; color: var(--bad) !important; }

/* Diapositiva 5 */
.two { display: grid; grid-template-columns: 1.1fr 1fr; gap: 36px; }
.two h2 { font-size: 22px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); margin: 0 0 12px; border: 0; }
.ben { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.ben .card { padding: 16px 18px; }
.ben .card h3 { font-size: 21px; }
.ben .card p { font-size: 17px; }
ul.next { margin: 0; padding: 0; list-style: none; }
ul.next li { font-size: 19px; padding: 10px 0 10px 18px; border-bottom: 1px solid var(--line); position: relative; }
ul.next li::before { content: ''; position: absolute; left: 0; top: 18px; width: 8px; height: 8px; background: var(--accent); }
ul.next li span { display: block; font-size: 15px; color: var(--muted); }
</style>

<p class="kicker">Conciliador de facturas y retenciones · El problema</p>

# Hoy el cruce entre facturas y contabilidad es manual

<p class="lead">Cada mes alguien compara, factura por factura, lo que reportan los proveedores con lo que quedó registrado en contabilidad.</p>

<div class="grid g2 pain">
  <div class="card"><h3>Toma horas</h3><p>Revisión línea a línea en hojas de cálculo, repetida en cada cierre.</p></div>
  <div class="card"><h3>Reprocesos</h3><p>Los errores se detectan tarde y obligan a volver sobre facturas ya revisadas.</p></div>
  <div class="card"><h3>Poca trazabilidad</h3><p>No queda registro de qué se revisó, con qué criterio ni por qué una factura no cuadra.</p></div>
  <div class="card"><h3>Riesgo tributario</h3><p>Diferencias de IVA o retención y facturas sin contabilizar pueden pasar inadvertidas.</p></div>
</div>

---

<p class="kicker">La solución</p>

# Un conciliador que aplica las mismas reglas a todas las facturas

<p class="lead">Se cargan los dos archivos y la herramienta indica qué facturas cuadran, cuáles no y <span class="mark">por qué</span>.</p>

<div class="rules">
  <div class="rule"><b>IVA correcto</b><span>IVA esperado = base gravable × tarifa (igual con la retención)</span></div>
  <div class="rule"><b>Total correcto</b><span>Total = base + IVA − retención</span></div>
  <div class="rule"><b>Sin duplicados</b><span>La factura no se repite, ni tiene más de un registro contable</span></div>
  <div class="rule"><b>Registrada en contabilidad</b><span>Toda factura debe tener su registro contable</span></div>
  <div class="rule"><b>Contabilizada</b><span>Un registro en estado pendiente no está conciliado</span></div>
  <div class="rule"><b>Mismo valor contabilizado</b><span>Lo registrado en contabilidad coincide con el total de la factura</span></div>
</div>

<div class="outcome">Cada factura queda <b class="tag ok">Correcta</b> o <b class="tag bad">Con inconsistencia</b> con la causa exacta.</div>

---

<p class="kicker">Cómo funciona</p>

# Cuatro pasos, sin fórmulas ni cruces manuales

<div class="flow">
  <div class="step"><div class="n">1</div><h3>Cargar</h3><p>Se suben el archivo de facturas y el de contabilidad (CSV).</p></div>
  <div class="arrow">→</div>
  <div class="step"><div class="n">2</div><h3>Validar</h3><p>La herramienta aplica todas las reglas a cada factura de forma automática.</p></div>
  <div class="arrow">→</div>
  <div class="step"><div class="n">3</div><h3>Resumen</h3><p>Cuántas facturas están correctas, cuántas no y cuáles son las causas más frecuentes.</p></div>
  <div class="arrow">→</div>
  <div class="step"><div class="n">4</div><h3>Revisar y exportar</h3><p>Se filtran las inconsistencias por causa y se descargan a Excel para gestionarlas.</p></div>
</div>

<p class="note">Si un archivo no es válido (vacío, formato incorrecto o sin las columnas necesarias), se rechaza con un mensaje claro antes de procesar.</p>

---

<p class="kicker">Resultados con los datos de prueba</p>

# 22 de 50 facturas requieren revisión

<div class="res">
<div>
  <div class="kpis">
    <div class="kpi"><div class="l">Procesadas</div><div class="v">50</div></div>
    <div class="kpi ok"><div class="l">Correctas</div><div class="v">28</div><div class="p ok">56 %</div></div>
    <div class="kpi bad"><div class="l">Inconsistentes</div><div class="v">22</div><div class="p bad">44 %</div></div>
  </div>
  <table class="causes">
    <tr><td>Registro contable duplicado</td><td>7</td></tr>
    <tr><td>Factura duplicada</td><td>4</td></tr>
    <tr><td>Sin registro contable</td><td>4</td></tr>
    <tr><td>Campo obligatorio vacío</td><td>3</td></tr>
    <tr><td>Total diferente</td><td>3</td></tr>
    <tr><td>Contabilización pendiente</td><td>3</td></tr>
    <tr><td>IVA diferente</td><td>2</td></tr>
    <tr><td>Valor contable diferente</td><td>2</td></tr>
  </table>
  <p class="fine">Una factura puede tener varias causas.</p>
</div>
<div>
  <div class="shot"><img src="img/conciliador-claro-desktop-resultados.png" alt="Resumen del conciliador con los datos de prueba"></div>
  <div class="example">
    <strong>Ejemplo: FAC-0006</strong> · el IVA reportado no corresponde a base × tarifa
    <div class="nums">
      <div>Reportado<b class="strike">$215.000</b></div>
      <div>Calculado (3.800.000 × 5 %)<b>$190.000</b></div>
      <div>Diferencia<b>$25.000</b></div>
    </div>
  </div>
</div>
</div>

---

<p class="kicker">Beneficios y siguientes pasos</p>

# De horas de cruce manual a minutos de revisión

<div class="two">
<div>
  <h2>Beneficios</h2>
  <div class="ben">
    <div class="card"><h3>Minutos, no horas</h3><p>Todas las facturas se validan en segundos; el tiempo se dedica a resolver.</p></div>
    <div class="card"><h3>Trazabilidad</h3><p>Valor reportado vs. calculado y la causa de cada inconsistencia.</p></div>
    <div class="card"><h3>Exportable a Excel</h3><p>Las inconsistencias se descargan para asignarlas y hacerles seguimiento.</p></div>
    <div class="card"><h3>Criterios uniformes</h3><p>Las mismas reglas en cada cierre, sin depender de quién revise.</p></div>
  </div>
</div>
<div>
  <h2>Siguientes pasos</h2>
  <ul class="next">
    <li>Histórico de conciliaciones<span>Comparar cierres y seguir la corrección de cada inconsistencia</span></li>
    <li>Integración con el ERP y fuentes contables<span>Sin preparar archivos a mano</span></li>
    <li>Más reglas<span>Cuentas contables, centros de costo y fechas</span></li>
    <li>Duplicados por contenido<span>Ej.: FAC-0007 y FAC-0045 tienen los mismos valores con distinto NIT</span></li>
    <li>Acceso con usuario y contraseña</li>
  </ul>
</div>
</div>
