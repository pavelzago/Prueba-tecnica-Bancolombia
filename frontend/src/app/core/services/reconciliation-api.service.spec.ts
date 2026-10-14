import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ReconciliationResponse } from '../models/reconciliation.model';
import { ReconciliationApiService } from './reconciliation-api.service';

describe('ReconciliationApiService', () => {
  let service: ReconciliationApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReconciliationApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('posts both files as multipart FormData to /reconciliations', () => {
    const invoices = new File(['id_factura\n'], 'facturas.csv', { type: 'text/csv' });
    const ledger = new File(['id_factura\n'], 'contabilidad.csv', { type: 'text/csv' });
    const response: ReconciliationResponse = {
      summary: {
        total_facturas: 0,
        correctas: 0,
        con_inconsistencia: 0,
        total_registros_contables: 0,
        por_causa: [],
      },
      results: [],
    };

    let received: ReconciliationResponse | undefined;
    service.reconcile(invoices, ledger).subscribe((r) => (received = r));

    const req = httpMock.expectOne(`${environment.apiUrl}/reconciliations`);
    expect(req.request.url).toBe('http://localhost:8000/api/reconciliations');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeInstanceOf(FormData);

    const body = req.request.body as FormData;
    expect((body.get('facturas') as File).name).toBe('facturas.csv');
    expect((body.get('contabilidad') as File).name).toBe('contabilidad.csv');
    expect([...body.keys()].sort()).toEqual(['contabilidad', 'facturas']);
    // Content-Type must be left to the browser so it adds the multipart boundary.
    expect(req.request.headers.has('Content-Type')).toBe(false);

    req.flush(response);
    expect(received).toEqual(response);
  });
});
