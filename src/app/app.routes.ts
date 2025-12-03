import { Routes } from '@angular/router';
import { ReportBuilderComponent } from './features/report-builder/report-builder.component';
import { ReportsListComponent } from './features/reports-list/reports-list.component';
import { ReportViewerComponent } from './features/report-viewer/report-viewer.component';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'reports' },
    { path: 'reports', component: ReportsListComponent },
    { path: 'report/:id', component: ReportViewerComponent },
    { path: 'builder', component: ReportBuilderComponent },
    { path: 'builder/:id', component: ReportBuilderComponent }
];
