import { CodigoInconsistencia, ResultadoFactura } from '../models/reconciliation.model';

/** Invoices by how many causes they have: what the composition donut shows. */
export interface StatusBreakdown {
  correct: number;
  /** Exactly one cause. */
  single: number;
  /** Two or more causes. */
  multiple: number;
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
  /** Correct / one cause / several causes. Sums to the invoice count. */
  breakdown: StatusBreakdown;
  /** Invoice–cause pairs: what the "by cause" list adds up to (an invoice can count in several causes). */
  causeCount: number;
  /** Net difference per concept, only over invoices flagged for that concept. */
  conceptDifferences: ConceptDifference[];
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

  const breakdown: StatusBreakdown = { correct: 0, single: 0, multiple: 0 };
  let causeCount = 0;
  for (const row of rows) {
    const causes = new Set(row.inconsistencias.map((i) => i.codigo)).size;
    causeCount += causes;
    if (causes === 0) breakdown.correct++;
    else if (causes === 1) breakdown.single++;
    else breakdown.multiple++;
  }

  const conceptDifferences: ConceptDifference[] = [
    { concept: 'IVA', ...netDifference(rows, 'IVA_DIFERENTE', (r) => r.iva_reportado, (r) => r.iva_calculado) },
    {
      concept: 'Retención',
      ...netDifference(rows, 'RETENCION_DIFERENTE', (r) => r.retencion_reportada, (r) => r.retencion_calculada),
    },
    { concept: 'Total', ...netDifference(rows, 'TOTAL_DIFERENTE', (r) => r.total_reportado, (r) => r.total_calculado) },
    { concept: 'Valor contable', ...ledgerDifference },
  ];

  return { unposted, ledgerDifference, breakdown, causeCount, conceptDifferences };
}
