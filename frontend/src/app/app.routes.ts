import { Routes } from '@angular/router';

import { ReconciliationPageComponent } from './pages/reconciliation-page/reconciliation-page.component';

export const routes: Routes = [
  { path: '', component: ReconciliationPageComponent, title: 'Conciliador de facturas' },
  { path: '**', redirectTo: '' },
];
