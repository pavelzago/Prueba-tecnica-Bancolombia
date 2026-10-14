import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

import { ReconciliationResponse, ResultadoFactura } from '../models/reconciliation.model';
import { ReconciliationApiService } from './reconciliation-api.service';
import { ReconciliationStore } from './reconciliation.store';

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
  const invoices = new File(['a'], 'facturas.csv');
  const ledger = new File(['b'], 'contabilidad.csv');

  beforeEach(() => {
    api.reconcile.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: ReconciliationApiService, useValue: api }],
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
});
