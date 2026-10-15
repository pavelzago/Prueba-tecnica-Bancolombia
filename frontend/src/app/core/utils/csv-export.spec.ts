import { ResultadoFactura } from '../models/reconciliation.model';
import { CSV_BOM, buildResultsCsv, formatCsvCell } from './csv-export';

const ROW: ResultadoFactura = {
  fila: 7,
  id_factura: 'FAC-0006',
  nit_proveedor: '900782207',
  fecha_factura: '2026-03-07',
  concepto: 'Consultoría profesional',
  base_gravable: 3800000,
  tarifa_iva: 0.05,
  iva_reportado: 215000,
  iva_calculado: 190000,
  tarifa_retencion: 0,
  retencion_reportada: 0,
  retencion_calculada: 0,
  total_reportado: 3990000,
  total_calculado: 3990000,
  valor_contabilizado: 3990000,
  lineas_contables: 2,
  estado_contable: 'Contabilizada',
  estado: 'Con inconsistencia',
  inconsistencias: [
    { codigo: 'IVA_DIFERENTE', descripcion: 'IVA reportado $215.000 difiere del calculado $190.000' },
    { codigo: 'REGISTRO_CONTABLE_DUPLICADO', descripcion: 'La factura tiene 2 registros contables' },
  ],
};

describe('buildResultsCsv', () => {
  it('starts with a UTF-8 BOM and a ;-separated header', () => {
    const csv = buildResultsCsv([]);
    expect(csv.startsWith(CSV_BOM)).toBe(true);
    const header = csv.slice(1).split('\r\n')[0];
    expect(header).toBe(
      'fila;id_factura;nit_proveedor;fecha_factura;concepto;base_gravable;iva_reportado;iva_calculado;' +
        'retencion_reportada;retencion_calculada;total_reportado;total_calculado;valor_contabilizado;' +
        'estado_contable;estado;causas',
    );
  });

  it('writes one line per row with causes joined by " | "', () => {
    const lines = buildResultsCsv([ROW]).slice(1).trimEnd().split('\r\n');
    expect(lines).toHaveLength(2);
    const cells = lines[1].split(';');
    expect(cells[0]).toBe('7');
    expect(cells[1]).toBe('FAC-0006');
    expect(cells[6]).toBe('215000');
    expect(cells[7]).toBe('190000');
    expect(cells[14]).toBe('Con inconsistencia');
    expect(cells[15]).toBe(
      'IVA reportado $215.000 difiere del calculado $190.000 | La factura tiene 2 registros contables',
    );
  });

  it('leaves null values empty and uses decimal comma', () => {
    const csv = buildResultsCsv([{ ...ROW, nit_proveedor: null, tarifa_iva: 0.19, base_gravable: 10.5 }]);
    const cells = csv.slice(1).split('\r\n')[1].split(';');
    expect(cells[2]).toBe('');
    expect(cells[5]).toBe('10,5');
  });
});

describe('formatCsvCell', () => {
  it('quotes values with the separator, quotes or line breaks and doubles inner quotes', () => {
    expect(formatCsvCell('Servicio; mensual')).toBe('"Servicio; mensual"');
    expect(formatCsvCell('Licencia "Pro"')).toBe('"Licencia ""Pro"""');
    expect(formatCsvCell('línea 1\nlínea 2')).toBe('"línea 1\nlínea 2"');
    expect(formatCsvCell('Soporte técnico')).toBe('Soporte técnico');
  });

  it('neutralises spreadsheet formulas in text but not negative numbers', () => {
    expect(formatCsvCell('=SUMA(A1)')).toBe("'=SUMA(A1)");
    expect(formatCsvCell(-1500)).toBe('-1500');
  });
});
