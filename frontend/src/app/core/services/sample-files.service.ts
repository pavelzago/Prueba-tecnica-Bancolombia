import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';

export interface SampleFiles {
  invoices: File;
  ledger: File;
}

/**
 * Loads the fictitious sample CSVs served from `public/ejemplos/`.
 * They are a byte-for-byte copy of `test-data/` (a symlink would break on Windows
 * clones without `core.symlinks`); keep them in sync if the test data changes.
 */
@Injectable({ providedIn: 'root' })
export class SampleFilesService {
  private readonly http = inject(HttpClient);

  load(): Observable<SampleFiles> {
    return forkJoin({
      invoices: this.fetchAsFile('ejemplos/facturas.csv', 'facturas.csv'),
      ledger: this.fetchAsFile('ejemplos/contabilidad.csv', 'contabilidad.csv'),
    });
  }

  private fetchAsFile(url: string, name: string): Observable<File> {
    return this.http
      .get(url, { responseType: 'blob' })
      .pipe(map((blob) => new File([blob], name, { type: 'text/csv' })));
  }
}
