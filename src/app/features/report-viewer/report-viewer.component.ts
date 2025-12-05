import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faArrowLeft, faFilter, faDownload, faEdit } from "@fortawesome/free-solid-svg-icons";
import { ReportDefinition, FilterCondition } from "../../core/models/report.models";
import { ReportBuilderService } from "../report-builder/services/report-builder.service";
import { PreviewPanelComponent } from "../report-builder/components/preview-panel/preview-panel.component";
import { FilterBuilderComponent } from "../report-builder/components/filter-builder/filter-builder.component";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";

@Component({
  selector: 'app-report-viewer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    PreviewPanelComponent,
    FilterBuilderComponent,
    MatSnackBarModule
  ],
  template: `
    <div class="report-viewer-container">
      <!-- Header -->
      <div class="viewer-header">
        <div class="header-left">
          <button class="btn btn-secondary" (click)="goBack()">
            <fa-icon [icon]="faArrowLeft"></fa-icon>
            Back to Reports
          </button>
          <div class="report-title">
            <h1>{{ report?.name }}</h1>
            <p *ngIf="report?.description" class="report-description">{{ report?.description }}</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="toggleFilters()">
            <fa-icon [icon]="faFilter"></fa-icon>
            {{ showFilters ? 'Hide' : 'Show' }} Filters
          </button>
          <button class="btn btn-secondary" (click)="editReport()">
            <fa-icon [icon]="faEdit"></fa-icon>
            Edit Report
          </button>         
        </div>
      </div>

      <!-- Filter Panel (Collapsible) -->
      <div class="filter-panel" *ngIf="showFilters && report">
        <div class="filter-panel-header">
          <h3>Report Filters</h3>
          <button class="btn btn-sm btn-primary" (click)="applyFilters()">
            Apply Filters
          </button>
        </div>
        <app-filter-builder
          [availableFields]="report.selectedFields"
          [filters]="currentFilters"
          (filtersChanged)="onFiltersChanged($event)">
        </app-filter-builder>
      </div>

      <!-- Report Content -->
      <div class="report-content" *ngIf="report && !isLoading && !error">
        <app-preview-panel
          [report]="report"
          [selectedFormat]="'table'">
        </app-preview-panel>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Loading report...</p>
      </div>

      <!-- Error State -->
      <div class="error-state" *ngIf="error && !isLoading">
        <i class="icon-error"></i>
        <h3>Error Loading Report</h3>
        <p>{{ error }}</p>
        <button class="btn btn-primary" (click)="goBack()">Go Back</button>
      </div>
    </div>
  `,
  styleUrls: ['./report-viewer.component.scss']
})
export class ReportViewerComponent implements OnInit, OnDestroy {
  @ViewChild(PreviewPanelComponent) previewPanel?: PreviewPanelComponent;

  faArrowLeft = faArrowLeft;
  faFilter = faFilter;
  faDownload = faDownload;
  faEdit = faEdit;

  report: ReportDefinition | null = null;
  currentFilters: FilterCondition[] = [];
  showFilters = false;
  isLoading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reportService: ReportBuilderService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Listen to route parameter changes to reload when navigating to different reports
    // or when the same report is reloaded
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const reportId = params.get('id');
        if (reportId) {
          this.loadReport(reportId);
        } else {
          this.error = 'No report ID provided';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadReport(id: string): void {
    this.isLoading = true;
    this.error = null;

    this.reportService.getReport(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (report) => {
          console.log('🎯 REPORT VIEWER - Raw report loaded from API:', report);
          console.log('🎯 REPORT VIEWER - Selected fields from API:', report.selectedFields);
          
          this.report = {
            id: report.id,
            name: report.name,
            description: report.description,
            dataSource: report.dataSource,
            selectedFields: report.selectedFields ?? [],
            filters: report.filters ?? [],
            groupBy: report.groupBy ?? [],
            sorting: report.sorting ?? [],
            layout: report.layout ?? {},
            parameters: report.parameters ?? []
          } as ReportDefinition;
          
          console.log('🎯 REPORT VIEWER - Mapped report for viewer:', this.report);
          console.log('🎯 REPORT VIEWER - Mapped selected fields:', this.report.selectedFields);
          
          // Initialize current filters from report
          this.currentFilters = [...(this.report.filters || [])];
          
          // Update the service with the report
          this.reportService.updateCurrentReport(this.report);
          
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading report:', err);
          this.error = 'Failed to load report';
          this.isLoading = false;
        }
      });
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  onFiltersChanged(filters: FilterCondition[]): void {
    this.currentFilters = filters;
  }

  applyFilters(): void {
    if (this.report) {
      // Update the report with new filters
      this.report = {
        ...this.report,
        filters: this.currentFilters
      };
      
      // Update the service to trigger preview refresh
      this.reportService.updateCurrentReport(this.report);
      
      this.snackBar.open('Filters applied', 'Close', { duration: 2000 });
    }
  }

  editReport(): void {
    if (this.report?.id) {
      this.router.navigate(['/builder', this.report.id]);
    }
  }

  exportReport(): void {
    if (!this.previewPanel) {
      this.snackBar.open('Preview panel not available', 'Close', { duration: 2000 });
      return;
    }

    try {
      const fileName = `${this.report?.name || 'Report'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      this.previewPanel.exportToExcel(fileName);
      this.snackBar.open('Report exported successfully', 'Close', { duration: 2000 });
    } catch (error) {
      console.error('Export failed:', error);
      this.snackBar.open('Failed to export report', 'Close', { duration: 3000 });
    }
  }

  goBack(): void {
    this.router.navigate(['/reports']);
  }
}

