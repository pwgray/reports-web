import { Routes } from '@angular/router';
import { ReportBuilderComponent } from './features/report-builder/report-builder.component';
import { ReportsListComponent } from './features/reports-list/reports-list.component';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'reports' },
    { path: 'reports', component: ReportsListComponent },
    { path: 'builder', component: ReportBuilderComponent },
    { path: 'builder/:id', component: ReportBuilderComponent }
];
