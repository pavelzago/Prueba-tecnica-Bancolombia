import { ResultadoFactura } from '../models/reconciliation.model';

/** UTF-8 byte order mark: lets Excel detect the encoding (accents, ñ). */
export const CSV_BOM = '﻿';
/** Excel with Spanish regional settings expects `;` as list separator. */
export const CSV_SEPARATOR = ';';
const LINE_BREAK = '\r\n';

const COLUMNS: { header: string; value: (r: ResultadoFactura) => string | number | null }[] = [
  { header: 'fila', value: (r) => r.fila },
  { header: 'id_factura', value: (r) => r.id_factura },
  { header: 'nit_proveedor', value: (r) => r.nit_proveedor },
  { header: 'fecha_factura', value: (r) => r.fecha_factura },
  { header: 'concepto', value: (r) => r.concepto },
  { header: 'base_gravable', value: (r) => r.base_gravable },
  { header: 'iva_reportado', value: (r) => r.iva_reportado },
  { header: 'iva_calculado', value: (r) => r.iva_calculado },
  { header: 'retencion_reportada', value: (r) => r.retencion_reportada },
  { header: 'retencion_calculada', value: (r) => r.retencion_calculada },
  { header: 'total_reportado', value: (r) => r.total_reportado },
  { header: 'total_calculado', value: (r) => r.total_calculado },
  { header: 'valor_contabilizado', value: (r) => r.valor_contabilizado },
  { header: 'estado_contable', value: (r) => r.estado_contable },
  { header: 'estado', value: (r) => r.estado },
  { header: 'causas', value: (r) => r.inconsistencias.map((i) => i.descripcion).join(' | ') },
];

/** Formats one cell: decimal comma for numbers, quoting/escaping for text. */
export function formatCsvCell(value: string | number | null): string {
  if (value === null) {
    return '';
  }
  if (typeof value === 'number') {
    return String(value).replace('.', ',');
  }
  // Neutralise spreadsheet formulas coming from user data (CSV injection).
  const text = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Pure function: builds the CSV (with BOM) for the given — already filtered — rows. */
export function buildResultsCsv(rows: readonly ResultadoFactura[]): string {
  const header = COLUMNS.map((c) => c.header).join(CSV_SEPARATOR);
  const lines = rows.map((row) =>
    COLUMNS.map((c) => formatCsvCell(c.value(row))).join(CSV_SEPARATOR),
  );
  return CSV_BOM + [header, ...lines].join(LINE_BREAK) + LINE_BREAK;
}

/** Browser side effect: offers `content` as a file download. */
export function downloadTextFile(filename: string, content: string, mime = 'text/csv;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
