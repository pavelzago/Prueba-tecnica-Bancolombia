import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ReconciliationResponse } from '../models/reconciliation.model';

@Injectable({ providedIn: 'root' })
export class ReconciliationApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /** POST multipart/form-data with fields `facturas` and `contabilidad`. */
  reconcile(invoices: File, ledger: File): Observable<ReconciliationResponse> {
    const formData = new FormData();
    formData.append('facturas', invoices, invoices.name);
    formData.append('contabilidad', ledger, ledger.name);
    return this.http.post<ReconciliationResponse>(`${this.baseUrl}/reconciliations`, formData);
  }
}
