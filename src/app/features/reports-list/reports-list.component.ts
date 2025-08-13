import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faPlus, faTable, faChartBar, faThLarge, faChartPie, faLayerGroup, faFileAlt, faTrash, faPen, faEye, faSortAlphaDown, faSortAlphaUp, faClock } from '@fortawesome/free-solid-svg-icons';
import { ReportDefinition, FieldDataType } from "../../core/models/report.models";
import { ReportBuilderService } from "../report-builder/services/report-builder.service";

@Component({
  selector: 'app-reports-list',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  template: `
    <div class="reports-page">
      <div class="page-header">
        <h1>Reports</h1>
        <button class="btn btn-primary" (click)="createBlankReport()">
          <fa-icon [icon]="faPlus"></fa-icon>
          New Report
        </button>
      </div>

      <div class="controls">
        <div class="search">
          <input type="text" [(ngModel)]="searchTerm" (input)="applyFilters()" placeholder="Search templates and reports..." />
        </div>
        <div class="sort">
          <label for="sortBy">Sort</label>
          <select id="sortBy" [(ngModel)]="sortOption" (change)="applyFilters()">
            <option value="name-asc">Name (A–Z)</option>
            <option value="name-desc">Name (Z–A)</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      <div class="templates">
        <h2>Start from a template</h2>
        <div class="tiles-grid">
          <div class="tile-card" *ngFor="let t of filteredTemplates" (click)="startFromTemplate(t.key)" tabindex="0" role="button">
            <div class="card-icon"><fa-icon [icon]="t.icon"></fa-icon></div>
            <div class="card-title">{{ t.title }}</div>
            <div class="card-desc">{{ t.desc }}</div>
          </div>
        </div>
      </div>

      <div class="reports-list">
        <h2>Saved reports</h2>
        <div class="tiles-grid" *ngIf="reports?.length; else empty">
          <div class="tile-card report-card" *ngFor="let r of reports" tabindex="0" role="button">
            <div class="card-actions" (click)="$event.stopPropagation()">
              <button class="icon-btn" title="View" (click)="viewReport(r, $event)"><fa-icon [icon]="faEye"></fa-icon></button>
              <button class="icon-btn" title="Edit" (click)="editReport(r, $event)"><fa-icon [icon]="faPen"></fa-icon></button>
              <button class="icon-btn danger" title="Delete" (click)="deleteReport(r, $event)"><fa-icon [icon]="faTrash"></fa-icon></button>
            </div>
            <div class="card-icon"><fa-icon [icon]="faFileAlt"></fa-icon></div>
            <div class="card-title">{{ r.name }}</div>
            <div class="card-desc">{{ r.description || 'No description' }}</div>
          </div>
        </div>
        <ng-template #empty>
          <div class="empty">No reports yet.</div>
        </ng-template>
      </div>
    </div>
  `,
  styleUrls: ['./reports-list.component.scss']
})
export class ReportsListComponent implements OnInit {
  faPlus = faPlus;
  faTable = faTable;
  faChartBar = faChartBar;
  faThLarge = faThLarge;
  faChartPie = faChartPie;
  faLayerGroup = faLayerGroup;
  faFileAlt = faFileAlt;
  faTrash = faTrash;
  faPen = faPen;
  faEye = faEye;
  faSortAlphaDown = faSortAlphaDown;
  faSortAlphaUp = faSortAlphaUp;
  faClock = faClock;

  searchTerm = '';
  sortOption: 'name-asc' | 'name-desc' | 'newest' | 'oldest' = 'name-asc';

  allReports: ReportDefinition[] = [];
  reports: ReportDefinition[] = [];
  templates = [
    { key: 'table' as const, title: 'Tabular Report', desc: 'Only table data', icon: this.faTable },
    { key: 'chart' as const, title: 'Chart Report', desc: 'Single chart', icon: this.faChartBar },
    { key: 'chart-table' as const, title: 'Chart + Data', desc: 'Chart with table', icon: this.faLayerGroup },
    { key: 'widgets-table' as const, title: 'Widgets + Data', desc: 'Aggregates with table', icon: this.faFileAlt },
    { key: 'dashboard' as const, title: 'Dashboard', desc: 'Multi-widget layout', icon: this.faThLarge },
  ];
  filteredTemplates = this.templates.slice();

  constructor(
    private readonly router: Router,
    private readonly reportService: ReportBuilderService
  ) {}

  ngOnInit(): void {
    this.reportService.getReports().subscribe(r => {
      this.allReports = r;
      this.applyFilters();
    });
  }

  createBlankReport() {
    this.router.navigate(['/builder']);
  }

  startFromTemplate(template: 'table' | 'chart' | 'chart-table' | 'widgets-table' | 'dashboard') {
    this.router.navigate(['/builder'], { state: { template } });
  }

  openReport(report: ReportDefinition) {
    // Navigate to builder and load by id (builder can be extended to fetch and populate)
    this.router.navigate(['/builder'], { state: { reportId: report.id } });
  }

  viewReport(report: ReportDefinition, event: MouseEvent) {
    event.stopPropagation();
    // For now, route to builder in a preview-oriented mode if desired.
    this.router.navigate(['/builder',report.id], { state: { reportId: report.id, view: true } });
  }

  editReport(report: ReportDefinition, event: MouseEvent) {
    event.stopPropagation();
    this.router.navigate(['/builder', report.id], { state: { reportId: report.id } });
  }

  deleteReport(report: ReportDefinition, event: MouseEvent) {
    event.stopPropagation();
    if (!report.id) return;
    const confirmed = confirm(`Delete report "${report.name}"?`);
    if (!confirmed) return;
    this.reportService.deleteReport(report.id).subscribe(() => {
      this.allReports = this.allReports.filter(x => x.id !== report.id);
      this.applyFilters();
    });
  }

  applyFilters() {
    const term = this.searchTerm.trim().toLowerCase();
    // Filter and sort templates
    const tmpl = this.templates
      .filter(t => !term || t.title.toLowerCase().includes(term) || t.desc.toLowerCase().includes(term))
      .sort((a, b) => a.title.localeCompare(b.title));
    this.filteredTemplates = tmpl;

    // Filter reports
    let result = this.allReports.filter(r => {
      const name = (r.name || '').toLowerCase();
      const desc = (r.description || '').toLowerCase();
      return !term || name.includes(term) || desc.includes(term);
    });

    // Sort reports
    result = result.sort((a, b) => {
      switch (this.sortOption) {
        case 'name-desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'newest': {
          const da = a && (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
          const db = b && (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
          return db - da;
        }
        case 'oldest': {
          const da = a && (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
          const db = b && (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
          return da - db;
        }
        case 'name-asc':
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });

    this.reports = result;
  }
}


