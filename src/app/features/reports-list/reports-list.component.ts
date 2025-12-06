import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faPlus, faTable, faChartBar, faThLarge, faChartPie, faLayerGroup, faFileAlt, faTrash, faPen, faEye, faSortAlphaDown, faSortAlphaUp, faClock } from '@fortawesome/free-solid-svg-icons';
import { ReportDefinition, FieldDataType } from "../../core/models/report.models";
import { ReportBuilderService } from "../report-builder/services/report-builder.service";

/**
 * Component for displaying and managing saved reports.
 * Provides functionality for:
 * - Viewing all saved reports in a grid layout
 * - Starting new reports from templates or blank
 * - Searching and sorting reports
 * - Viewing, editing, and deleting reports
 * - Quick actions for each report (view, edit, delete)
 */
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
  /** FontAwesome icons */
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

  /** Search term for filtering reports and templates */
  searchTerm = '';
  
  /** Current sort option for reports */
  sortOption: 'name-asc' | 'name-desc' | 'newest' | 'oldest' = 'name-asc';

  /** All reports loaded from the server */
  allReports: ReportDefinition[] = [];
  
  /** Filtered and sorted reports displayed to the user */
  reports: ReportDefinition[] = [];
  
  /** Available report templates that users can start from */
  templates = [
    { key: 'table' as const, title: 'Tabular Report', desc: 'Only table data', icon: this.faTable },
    { key: 'chart' as const, title: 'Chart Report', desc: 'Single chart', icon: this.faChartBar },
    { key: 'chart-table' as const, title: 'Chart + Data', desc: 'Chart with table', icon: this.faLayerGroup },
    { key: 'widgets-table' as const, title: 'Widgets + Data', desc: 'Aggregates with table', icon: this.faFileAlt },
    { key: 'dashboard' as const, title: 'Dashboard', desc: 'Multi-widget layout', icon: this.faThLarge },
  ];
  
  /** Filtered templates based on search term */
  filteredTemplates = this.templates.slice();

  /**
   * Creates an instance of ReportsListComponent.
   * @param router - Angular Router for navigation
   * @param reportService - Service for report operations
   */
  constructor(
    private readonly router: Router,
    private readonly reportService: ReportBuilderService
  ) {}

  /**
   * Angular lifecycle hook called after component initialization.
   * Loads all reports from the server and applies initial filters.
   */
  ngOnInit(): void {
    this.reportService.getReports().subscribe(r => {
      this.allReports = r;
      this.applyFilters();
    });
  }

  /**
   * Navigates to the report builder to create a new blank report.
   */
  createBlankReport() {
    this.router.navigate(['/builder']);
  }

  /**
   * Starts a new report from a predefined template.
   * Navigates to the builder with the template information in navigation state.
   * @param template - Template identifier to start from
   */
  startFromTemplate(template: 'table' | 'chart' | 'chart-table' | 'widgets-table' | 'dashboard') {
    this.router.navigate(['/builder'], { state: { template } });
  }

  /**
   * Opens a report in the builder for editing.
   * Navigates to the builder with the report ID in navigation state.
   * @param report - The report to open
   */
  openReport(report: ReportDefinition) {
    // Navigate to builder and load by id (builder can be extended to fetch and populate)
    this.router.navigate(['/builder'], { state: { reportId: report.id } });
  }

  /**
   * Navigates to the report viewer to view a report.
   * Stops event propagation to prevent card click handler from firing.
   * @param report - The report to view
   * @param event - Mouse event to stop propagation
   */
  viewReport(report: ReportDefinition, event: MouseEvent) {
    event.stopPropagation();
    // Navigate to the dedicated report viewer page
    this.router.navigate(['/report', report.id]);
  }

  /**
   * Navigates to the report builder to edit a report.
   * Stops event propagation to prevent card click handler from firing.
   * @param report - The report to edit
   * @param event - Mouse event to stop propagation
   */
  editReport(report: ReportDefinition, event: MouseEvent) {
    event.stopPropagation();
    this.router.navigate(['/builder', report.id], { state: { reportId: report.id } });
  }

  /**
   * Deletes a report after confirmation.
   * Removes the report from the local list and refreshes the display.
   * Stops event propagation to prevent card click handler from firing.
   * @param report - The report to delete
   * @param event - Mouse event to stop propagation
   */
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

  /**
   * Applies search and sort filters to reports and templates.
   * Filters both templates and reports based on the search term.
   * Sorts reports according to the selected sort option.
   * Updates both filteredTemplates and reports arrays.
   */
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


