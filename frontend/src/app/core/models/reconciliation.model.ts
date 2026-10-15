/**
 * Types mirroring docs/api-contract.md field by field.
 * Field names stay in snake_case (Spanish business language) as returned by the API.
 */

export type EstadoFactura = 'Correcta' | 'Con inconsistencia';

export type CodigoInconsistencia =
  | 'CAMPO_VACIO'
  | 'VALOR_INVALIDO'
  | 'IVA_DIFERENTE'
  | 'RETENCION_DIFERENTE'
  | 'TOTAL_DIFERENTE'
  | 'FACTURA_DUPLICADA'
  | 'SIN_REGISTRO_CONTABLE'
  | 'REGISTRO_CONTABLE_DUPLICADO'
  | 'CONTABILIZACION_PENDIENTE'
  | 'VALOR_CONTABLE_DIFERENTE';

export interface Inconsistencia {
  codigo: CodigoInconsistencia;
  descripcion: string;
}

export interface ResumenCausa {
  codigo: CodigoInconsistencia;
  descripcion: string;
  cantidad: number;
}

export interface Summary {
  total_facturas: number;
  correctas: number;
  con_inconsistencia: number;
  total_registros_contables: number;
  por_causa: ResumenCausa[];
}

export interface ResultadoFactura {
  fila: number;
  id_factura: string;
  nit_proveedor: string | null;
  fecha_factura: string | null;
  concepto: string | null;
  base_gravable: number | null;
  tarifa_iva: number | null;
  iva_reportado: number | null;
  iva_calculado: number | null;
  tarifa_retencion: number | null;
  retencion_reportada: number | null;
  retencion_calculada: number | null;
  total_reportado: number | null;
  total_calculado: number | null;
  valor_contabilizado: number | null;
  lineas_contables: number;
  estado_contable: string | null;
  estado: EstadoFactura;
  inconsistencias: Inconsistencia[];
}

export interface ReconciliationResponse {
  summary: Summary;
  results: ResultadoFactura[];
}

export interface ErrorResponse {
  code: string;
  message: string;
  details: string[];
}

/** UI-only: status filter applied client side. */
export type StatusFilter = 'all' | EstadoFactura;

/** UI-only: which of the two input files is being set. */
export type FileKind = 'invoices' | 'ledger';

/** UI-only: invoices per status after cause + search filters. */
export interface StatusCounts {
  all: number;
  correct: number;
  inconsistent: number;
}

/** UI-only: cause filter (null = any cause). */
export type CauseFilter = CodigoInconsistencia | null;

/** UI-only: short, human label per inconsistency code (chips, toolbar). */
export const CAUSE_LABELS: Record<CodigoInconsistencia, string> = {
  CAMPO_VACIO: 'Campo vacío',
  VALOR_INVALIDO: 'Valor inválido',
  IVA_DIFERENTE: 'IVA diferente',
  RETENCION_DIFERENTE: 'Retención diferente',
  TOTAL_DIFERENTE: 'Total diferente',
  FACTURA_DUPLICADA: 'Factura duplicada',
  SIN_REGISTRO_CONTABLE: 'Sin registro contable',
  REGISTRO_CONTABLE_DUPLICADO: 'Registro contable duplicado',
  CONTABILIZACION_PENDIENTE: 'Contabilización pendiente',
  VALOR_CONTABLE_DIFERENTE: 'Valor contable diferente',
};
