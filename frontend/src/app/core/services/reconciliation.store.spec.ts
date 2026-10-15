import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

import { ReconciliationResponse, ResultadoFactura } from '../models/reconciliation.model';
import { ReconciliationApiService } from './reconciliation-api.service';
import { ReconciliationStore } from './reconciliation.store';
import { SampleFilesService } from './sample-files.service';

function row(fila: number, estado: ResultadoFactura['estado']): ResultadoFactura {
  return {
    fila,
    id_factura: `FAC-${String(fila).padStart(4, '0')}`,
    nit_proveedor: '900000000',
    fecha_factura: '2026-03-01',
    concepto: 'Servicio',
    base_gravable: 100,
    tarifa_iva: 0.19,
    iva_reportado: 19,
    iva_calculado: 19,
    tarifa_retencion: 0,
    retencion_reportada: 0,
    retencion_calculada: 0,
    total_reportado: 119,
    total_calculado: 119,
    valor_contabilizado: 119,
    lineas_contables: 1,
    estado_contable: 'Contabilizada',
    estado,
    inconsistencias:
      estado === 'Correcta'
        ? []
        : [{ codigo: 'IVA_DIFERENTE', descripcion: 'IVA reportado difiere del calculado' }],
  };
}

function withRow(
  base: ResultadoFactura,
  patch: Partial<ResultadoFactura>,
): ResultadoFactura {
  return { ...base, ...patch };
}

/** Richer dataset for filter combinations. */
const FILTER_RESPONSE: ReconciliationResponse = {
  summary: {
    total_facturas: 4,
    correctas: 1,
    con_inconsistencia: 3,
    total_registros_contables: 4,
    por_causa: [],
  },
  results: [
    withRow(row(2, 'Correcta'), { id_factura: 'FAC-0001', concepto: 'Consultoría profesional' }),
    withRow(row(3, 'Con inconsistencia'), { id_factura: 'FAC-0002', concepto: 'Soporte técnico' }),
    withRow(row(4, 'Con inconsistencia'), {
      id_factura: 'FAC-0003',
      nit_proveedor: '800111222',
      concepto: 'Consultoría profesional',
      inconsistencias: [
        { codigo: 'SIN_REGISTRO_CONTABLE', descripcion: 'Factura sin registro contable' },
      ],
    }),
    withRow(row(5, 'Con inconsistencia'), {
      id_factura: 'FAC-0004',
      concepto: null,
      inconsistencias: [
        { codigo: 'IVA_DIFERENTE', descripcion: 'IVA reportado difiere del calculado' },
        { codigo: 'SIN_REGISTRO_CONTABLE', descripcion: 'Factura sin registro contable' },
      ],
    }),
  ],
};

const RESPONSE: ReconciliationResponse = {
  summary: {
    total_facturas: 3,
    correctas: 2,
    con_inconsistencia: 1,
    total_registros_contables: 3,
    por_causa: [{ codigo: 'IVA_DIFERENTE', descripcion: 'IVA diferente', cantidad: 1 }],
  },
  results: [row(2, 'Correcta'), row(3, 'Con inconsistencia'), row(4, 'Correcta')],
};

describe('ReconciliationStore', () => {
  let store: ReconciliationStore;
  const api = { reconcile: vi.fn() };
  const samples = { load: vi.fn() };
  const invoices = new File(['a'], 'facturas.csv');
  const ledger = new File(['b'], 'contabilidad.csv');

  beforeEach(() => {
    api.reconcile.mockReset();
    samples.load.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: ReconciliationApiService, useValue: api },
        { provide: SampleFilesService, useValue: samples },
      ],
    });
    store = TestBed.inject(ReconciliationStore);
  });

  it('only allows processing when both files are selected and not loading', () => {
    expect(store.canProcess()).toBe(false);
    store.setFile('invoices', invoices);
    expect(store.canProcess()).toBe(false);
    store.setFile('ledger', ledger);
    expect(store.canProcess()).toBe(true);

    const pending = new Subject<ReconciliationResponse>();
    api.reconcile.mockReturnValue(pending);
    store.process();
    expect(store.loading()).toBe(true);
    expect(store.canProcess()).toBe(false);

    pending.next(RESPONSE);
    pending.complete();
    expect(store.loading()).toBe(false);
    expect(api.reconcile).toHaveBeenCalledWith(invoices, ledger);
  });

  it('filters results by status', () => {
    api.reconcile.mockReturnValue(of(RESPONSE));
    store.setFile('invoices', invoices);
    store.setFile('ledger', ledger);
    store.process();

    expect(store.filteredResults().map((r) => r.fila)).toEqual([2, 3, 4]);

    store.setFilter('Correcta');
    expect(store.filteredResults().map((r) => r.fila)).toEqual([2, 4]);

    store.setFilter('Con inconsistencia');
    expect(store.filteredResults().map((r) => r.fila)).toEqual([3]);

    store.setFilter('all');
    expect(store.filteredResults()).toHaveLength(3);
  });

  it('exposes the backend message on error and clears loading', () => {
    api.reconcile.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: {
              code: 'MISSING_COLUMNS',
              message: 'El archivo de facturas no tiene las columnas obligatorias.',
              details: ['valor_iva', 'total_factura'],
            },
          }),
      ),
    );
    store.setFile('invoices', invoices);
    store.setFile('ledger', ledger);
    store.process();

    expect(store.loading()).toBe(false);
    expect(store.result()).toBeNull();
    expect(store.error()).toEqual({
      message: 'El archivo de facturas no tiene las columnas obligatorias.',
      details: ['valor_iva', 'total_factura'],
    });
  });

  it('shows a connection message when the backend is unreachable (status 0)', () => {
    api.reconcile.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') })),
    );
    store.setFile('invoices', invoices);
    store.setFile('ledger', ledger);
    store.process();

    expect(store.error()?.message).toContain('No fue posible conectar con el servidor');
  });

  it('resets the filter and previous error on a new run', () => {
    api.reconcile.mockReturnValue(of(RESPONSE));
    store.setFile('invoices', invoices);
    store.setFile('ledger', ledger);
    store.process();
    store.setFilter('Correcta');

    store.process();
    expect(store.filter()).toBe('all');
    expect(store.error()).toBeNull();
  });

  describe('combined filters', () => {
    beforeEach(() => {
      api.reconcile.mockReturnValue(of(FILTER_RESPONSE));
      store.setFile('invoices', invoices);
      store.setFile('ledger', ledger);
      store.process();
    });

    const filas = () => store.filteredResults().map((r) => r.fila);

    it('searches by invoice id, NIT or concept, case- and accent-insensitive', () => {
      store.setSearch('fac-0002');
      expect(filas()).toEqual([3]);

      store.setSearch('800111');
      expect(filas()).toEqual([4]);

      store.setSearch('  CONSULTORIA ');
      expect(filas()).toEqual([2, 4]);

      store.setSearch('no-existe');
      expect(filas()).toEqual([]);

      store.setSearch('');
      expect(filas()).toEqual([2, 3, 4, 5]);
    });

    it('filters by cause and toggles it off when selected again', () => {
      store.toggleCause('SIN_REGISTRO_CONTABLE');
      expect(store.causeFilter()).toBe('SIN_REGISTRO_CONTABLE');
      expect(filas()).toEqual([4, 5]);

      store.toggleCause('IVA_DIFERENTE');
      expect(filas()).toEqual([3, 5]);

      store.toggleCause('IVA_DIFERENTE');
      expect(store.causeFilter()).toBeNull();
      expect(filas()).toEqual([2, 3, 4, 5]);
    });

    it('combines status + cause + search and counts per status ignoring the status filter', () => {
      store.setSearch('consultoría');
      expect(store.statusCounts()).toEqual({ all: 2, correct: 1, inconsistent: 1 });

      store.setFilter('Con inconsistencia');
      expect(filas()).toEqual([4]);

      store.toggleCause('IVA_DIFERENTE');
      expect(filas()).toEqual([]);
      expect(store.statusCounts()).toEqual({ all: 0, correct: 0, inconsistent: 0 });
      expect(store.hasActiveFilters()).toBe(true);

      store.clearFilters();
      expect(filas()).toEqual([2, 3, 4, 5]);
      expect(store.hasActiveFilters()).toBe(false);
    });

    it('selecting a cause while showing only correct invoices switches the status to all', () => {
      store.setFilter('Correcta');
      store.toggleCause('SIN_REGISTRO_CONTABLE');
      expect(store.filter()).toBe('all');
      expect(filas()).toEqual([4, 5]);
    });

    it('a new run clears search and cause and records the processing time', () => {
      store.setSearch('fac');
      store.toggleCause('IVA_DIFERENTE');
      store.process();
      expect(store.search()).toBe('');
      expect(store.causeFilter()).toBeNull();
      expect(store.processedAt()).toBeInstanceOf(Date);
    });
  });

  it('loadSample sets the sample files and processes them with the same flow', () => {
    const sampleInvoices = new File(['x'], 'facturas.csv');
    const sampleLedger = new File(['y'], 'contabilidad.csv');
    samples.load.mockReturnValue(of({ invoices: sampleInvoices, ledger: sampleLedger }));
    api.reconcile.mockReturnValue(of(RESPONSE));

    store.loadSample();

    expect(store.invoicesFile()).toBe(sampleInvoices);
    expect(store.ledgerFile()).toBe(sampleLedger);
    expect(api.reconcile).toHaveBeenCalledWith(sampleInvoices, sampleLedger);
    expect(store.result()).toEqual(RESPONSE);
  });

  it('loadSample shows an actionable error when the samples cannot be fetched', () => {
    samples.load.mockReturnValue(throwError(() => new Error('404')));
    store.loadSample();
    expect(store.loading()).toBe(false);
    expect(store.error()?.message).toContain('archivos de ejemplo');
    expect(api.reconcile).not.toHaveBeenCalled();
  });
});
