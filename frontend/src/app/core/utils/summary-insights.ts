import { CodigoInconsistencia, ResultadoFactura } from '../models/reconciliation.model';

/**
 * Order used to pick the *principal* finding of an invoice with several causes, from the
 * most to the least severe for accounting: first what is missing in the ledger, then wrong
 * amounts, then status and data quality. The composition chart counts each invoice once.
 */
export const PRINCIPAL_PRIORITY: readonly CodigoInconsistencia[] = [
  'SIN_REGISTRO_CONTABLE',
  'FACTURA_DUPLICADA',
  'VALOR_CONTABLE_DIFERENTE',
  'TOTAL_DIFERENTE',
  'IVA_DIFERENTE',
  'RETENCION_DIFERENTE',
  'CONTABILIZACION_PENDIENTE',
  'VALOR_INVALIDO',
  'CAMPO_VACIO',
  'REGISTRO_CONTABLE_DUPLICADO',
];

export type CompositionKey = 'CORRECTA' | CodigoInconsistencia;

export interface CompositionSlice {
  key: CompositionKey;
  count: number;
}

export interface AmountTotal {
  /** Invoices that contribute to the amount. */
  count: number;
  /** Sum in COP (signed for differences). */
  amount: number;
}

export interface ConceptDifference extends AmountTotal {
  concept: 'IVA' | 'Retención' | 'Total' | 'Valor contable';
}

export interface SummaryInsights {
  /** Invoices with no ledger entry and the sum of their reported totals. */
  unposted: AmountTotal;
  /** Matched invoices whose ledger value differs: sum of (ledger − invoice total). */
  ledgerDifference: AmountTotal;
  /** One slice per principal finding (plus correct invoices), largest first. Sums to the invoice count. */
  composition: CompositionSlice[];
  /** Net difference per concept, only over invoices flagged for that concept. */
  conceptDifferences: ConceptDifference[];
}

export function principalFinding(row: ResultadoFactura): CompositionKey {
  if (!row.inconsistencias.length) return 'CORRECTA';
  const codes = new Set(row.inconsistencias.map((i) => i.codigo));
  return PRINCIPAL_PRIORITY.find((code) => codes.has(code)) ?? row.inconsistencias[0].codigo;
}

function has(row: ResultadoFactura, code: CodigoInconsistencia): boolean {
  return row.inconsistencias.some((i) => i.codigo === code);
}

/** Sums `a − b` over the rows flagged with `code` (rows with a missing value are skipped). */
function netDifference(
  rows: ResultadoFactura[],
  code: CodigoInconsistencia,
  a: (row: ResultadoFactura) => number | null,
  b: (row: ResultadoFactura) => number | null,
): AmountTotal {
  let count = 0;
  let amount = 0;
  for (const row of rows) {
    const left = a(row);
    const right = b(row);
    if (has(row, code) && left !== null && right !== null) {
      count++;
      amount += left - right;
    }
  }
  return { count, amount: Math.round(amount * 100) / 100 };
}

export function buildSummaryInsights(rows: ResultadoFactura[]): SummaryInsights {
  const unpostedRows = rows.filter((r) => has(r, 'SIN_REGISTRO_CONTABLE'));
  const unposted = {
    count: unpostedRows.length,
    amount: unpostedRows.reduce((sum, r) => sum + (r.total_reportado ?? 0), 0),
  };

  const ledgerDifference = netDifference(
    rows,
    'VALOR_CONTABLE_DIFERENTE',
    (r) => r.valor_contabilizado,
    (r) => r.total_reportado,
  );

  const counts = new Map<CompositionKey, number>();
  for (const row of rows) {
    const key = principalFinding(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const composition = [...counts]
    .map(([key, count]) => ({ key, count }))
    .sort((x, y) => {
      if (x.key === 'CORRECTA') return -1; // correct invoices always lead
      if (y.key === 'CORRECTA') return 1;
      return y.count - x.count || PRINCIPAL_PRIORITY.indexOf(x.key) - PRINCIPAL_PRIORITY.indexOf(y.key);
    });

  const conceptDifferences: ConceptDifference[] = [
    { concept: 'IVA', ...netDifference(rows, 'IVA_DIFERENTE', (r) => r.iva_reportado, (r) => r.iva_calculado) },
    {
      concept: 'Retención',
      ...netDifference(rows, 'RETENCION_DIFERENTE', (r) => r.retencion_reportada, (r) => r.retencion_calculada),
    },
    { concept: 'Total', ...netDifference(rows, 'TOTAL_DIFERENTE', (r) => r.total_reportado, (r) => r.total_calculado) },
    { concept: 'Valor contable', ...ledgerDifference },
  ];

  return { unposted, ledgerDifference, composition, conceptDifferences };
}
