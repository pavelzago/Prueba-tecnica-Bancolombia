import { describe, expect, it } from 'vitest';

import { CodigoInconsistencia, ResultadoFactura } from '../models/reconciliation.model';
import { buildSummaryInsights, principalFinding } from './summary-insights';

function row(codes: CodigoInconsistencia[], patch: Partial<ResultadoFactura> = {}): ResultadoFactura {
  return {
    fila: 2,
    id_factura: 'FAC-0001',
    nit_proveedor: '900000000',
    fecha_factura: '2026-03-01',
    concepto: 'Servicio',
    base_gravable: 1000,
    tarifa_iva: 0.19,
    iva_reportado: 190,
    iva_calculado: 190,
    tarifa_retencion: 0,
    retencion_reportada: 0,
    retencion_calculada: 0,
    total_reportado: 1190,
    total_calculado: 1190,
    valor_contabilizado: 1190,
    lineas_contables: 1,
    estado_contable: 'Contabilizada',
    estado: codes.length ? 'Con inconsistencia' : 'Correcta',
    inconsistencias: codes.map((codigo) => ({ codigo, descripcion: codigo })),
    ...patch,
  };
}

describe('summary insights', () => {
  it('picks the most severe cause as the principal finding, whatever the backend order', () => {
    expect(principalFinding(row([]))).toBe('CORRECTA');
    expect(principalFinding(row(['CAMPO_VACIO', 'SIN_REGISTRO_CONTABLE']))).toBe('SIN_REGISTRO_CONTABLE');
    expect(principalFinding(row(['IVA_DIFERENTE', 'REGISTRO_CONTABLE_DUPLICADO']))).toBe('IVA_DIFERENTE');
  });

  it('composition counts each invoice once, correct first, then largest slice', () => {
    const { composition } = buildSummaryInsights([
      row(['REGISTRO_CONTABLE_DUPLICADO']),
      row(['IVA_DIFERENTE', 'REGISTRO_CONTABLE_DUPLICADO']),
      row(['TOTAL_DIFERENTE']),
      row(['TOTAL_DIFERENTE']),
      row([]),
    ]);
    expect(composition).toEqual([
      { key: 'CORRECTA', count: 1 },
      { key: 'TOTAL_DIFERENTE', count: 2 },
      { key: 'IVA_DIFERENTE', count: 1 },
      { key: 'REGISTRO_CONTABLE_DUPLICADO', count: 1 },
    ]);
    expect(composition.reduce((sum, slice) => sum + slice.count, 0)).toBe(5);
  });

  it('adds up what is not in the ledger and the net ledger difference', () => {
    const insights = buildSummaryInsights([
      row(['SIN_REGISTRO_CONTABLE'], { total_reportado: 1_609_250, valor_contabilizado: null }),
      row(['SIN_REGISTRO_CONTABLE'], { total_reportado: null, valor_contabilizado: null }),
      row(['VALOR_CONTABLE_DIFERENTE'], { total_reportado: 2_213_500, valor_contabilizado: 3_659_250 }),
      row(['VALOR_CONTABLE_DIFERENTE'], { total_reportado: 3_425_100, valor_contabilizado: 3_603_250 }),
      row([], { total_reportado: 999, valor_contabilizado: 1 }), // not flagged: ignored
    ]);
    expect(insights.unposted).toEqual({ count: 2, amount: 1_609_250 });
    expect(insights.ledgerDifference).toEqual({ count: 2, amount: 1_623_900 });
  });

  it('nets differences per concept as reported − calculated, keeping the sign', () => {
    const { conceptDifferences } = buildSummaryInsights([
      row(['IVA_DIFERENTE'], { iva_reportado: 215_000, iva_calculado: 190_000 }),
      row(['IVA_DIFERENTE'], { iva_reportado: 645_500, iva_calculado: 655_500 }),
      row(['TOTAL_DIFERENTE'], { total_reportado: 5_051_500, total_calculado: 5_071_500 }),
      row(['TOTAL_DIFERENTE'], { total_reportado: 100, total_calculado: null }), // missing: skipped
    ]);
    expect(conceptDifferences).toEqual([
      { concept: 'IVA', count: 2, amount: 15_000 },
      { concept: 'Retención', count: 0, amount: 0 },
      { concept: 'Total', count: 1, amount: -20_000 },
      { concept: 'Valor contable', count: 0, amount: 0 },
    ]);
  });
});
