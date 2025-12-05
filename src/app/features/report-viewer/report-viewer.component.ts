import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faArrowLeft, faFilter, faDownload, faEdit, faLayerGroup, faSort, faChartBar, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { ReportDefinition, FilterCondition, SelectedField } from "../../core/models/report.models";
import { ReportBuilderService } from "../report-builder/services/report-builder.service";
import { PreviewPanelComponent } from "../report-builder/components/preview-panel/preview-panel.component";
import { FilterBuilderComponent } from "../report-builder/components/filter-builder/filter-builder.component";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { MatChipsModule } from "@angular/material/chips";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";

@Component({
  selector: 'app-report-viewer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    PreviewPanelComponent,
    FilterBuilderComponent,
    MatSnackBarModule,
    MatChipsModule,
    MatIconModule,
    MatCardModule
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
          <button class="btn btn-secondary" 
                  *ngIf="report && (hasGrouping() || hasAggregations() || hasSorting())"
                  (click)="toggleMetadata()">
            <fa-icon [icon]="faInfoCircle"></fa-icon>
            {{ showMetadata ? 'Hide' : 'Show' }} Details
          </button>
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

      <!-- Report Configuration Summary -->
      <div class="report-metadata" *ngIf="showMetadata && report && (hasGrouping() || hasAggregations() || hasSorting())">
        <mat-card class="metadata-card">
          <mat-card-content>
            <div class="metadata-sections">
              <!-- Grouping Section -->
              <div class="metadata-section" *ngIf="hasGrouping()">
                <div class="section-header">
                  <mat-icon class="section-icon">layers</mat-icon>
                  <h4>Grouping</h4>
                </div>
                <div class="hierarchy-display">
                  <div class="hierarchy-path">
                    <span *ngFor="let group of report.groupBy; let i = index" class="group-level">
                      <span class="level-badge">Level {{ i + 1 }}</span>
                      <span class="group-name">{{ group.displayName }}</span>
                      <mat-icon class="arrow-icon" *ngIf="i < report.groupBy.length - 1">arrow_forward</mat-icon>
                    </span>
                  </div>
                </div>
              </div>

              <!-- Aggregations Section -->
              <div class="metadata-section" *ngIf="hasAggregations()">
                <div class="section-header">
                  <mat-icon class="section-icon">functions</mat-icon>
                  <h4>Aggregations</h4>
                </div>
                <div class="aggregation-chips">
                  <mat-chip-set>
                    <mat-chip *ngFor="let agg of getAggregatedFields()" class="aggregation-chip">
                      <mat-icon class="chip-icon">{{ getAggregationIcon(agg.aggregation) }}</mat-icon>
                      {{ agg.displayName }} ({{ getAggregationLabel(agg.aggregation) }})
                    </mat-chip>
                  </mat-chip-set>
                </div>
              </div>

              <!-- Sorting Section -->
              <div class="metadata-section" *ngIf="hasSorting()">
                <div class="section-header">
                  <mat-icon class="section-icon">sort</mat-icon>
                  <h4>Sorting</h4>
                </div>
                <div class="sort-display">
                  <div class="sort-list">
                    <span *ngFor="let sort of report.sorting; let i = index" class="sort-item">
                      <span class="sort-priority">{{ i + 1 }}.</span>
                      <span class="sort-name">{{ sort.displayName }}</span>
                      <mat-icon class="sort-direction-icon">
                        {{ sort.direction === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                      </mat-icon>
                      <span class="sort-direction-text">
                        {{ sort.direction === 'asc' ? 'Ascending' : 'Descending' }}
                      </span>
                      <span *ngIf="i < report.sorting.length - 1" class="sort-separator">→</span>
                    </span>
                  </div>
                </div>
              </div>

              <!-- Summary Explanation -->
              <div class="metadata-section explanation-section" *ngIf="hasGrouping() || hasAggregations() || hasSorting()">
                <div class="explanation-content">
                  <mat-icon class="info-icon">info</mat-icon>
                  <p>{{ getOrganizationExplanation() }}</p>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
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
  faLayerGroup = faLayerGroup;
  faSort = faSort;
  faChartBar = faChartBar;
  faInfoCircle = faInfoCircle;

  report: ReportDefinition | null = null;
  currentFilters: FilterCondition[] = [];
  showFilters = false;
  showMetadata = false; // Hide metadata by default
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

  toggleMetadata(): void {
    this.showMetadata = !this.showMetadata;
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

  // Helper methods for metadata display
  hasGrouping(): boolean {
    return this.report?.groupBy && this.report.groupBy.length > 0 || false;
  }

  hasAggregations(): boolean {
    return this.report?.selectedFields?.some(f => f.aggregation) ?? false;
  }

  hasSorting(): boolean {
    return this.report?.sorting && this.report.sorting.length > 0 || false;
  }

  getGroupingHierarchy(): string {
    if (!this.report?.groupBy) return '';
    return this.report.groupBy
      .map((g, i) => `Level ${i + 1}: ${g.displayName}`)
      .join(' → ');
  }

  getAggregatedFields(): SelectedField[] {
    return this.report?.selectedFields?.filter(f => f.aggregation) ?? [];
  }

  getAggregationLabel(aggregation?: string): string {
    if (!aggregation) return '';
    const labels: { [key: string]: string } = {
      'sum': 'SUM',
      'avg': 'AVERAGE',
      'count': 'COUNT',
      'min': 'MINIMUM',
      'max': 'MAXIMUM'
    };
    return labels[aggregation.toLowerCase()] || aggregation.toUpperCase();
  }

  getAggregationIcon(aggregation?: string): string {
    if (!aggregation) return 'functions';
    const icons: { [key: string]: string } = {
      'sum': 'add_circle',
      'avg': 'trending_flat',
      'count': 'numbers',
      'min': 'arrow_downward',
      'max': 'arrow_upward'
    };
    return icons[aggregation.toLowerCase()] || 'functions';
  }

  getOrganizationExplanation(): string {
    const parts: string[] = [];

    if (this.hasGrouping()) {
      const groupNames = this.report!.groupBy.map(g => g.displayName).join(', then by ');
      parts.push(`Data is grouped by ${groupNames}`);
    }

    if (this.hasAggregations()) {
      const aggCount = this.getAggregatedFields().length;
      const aggText = aggCount === 1 ? 'aggregation' : 'aggregations';
      if (parts.length > 0) {
        parts.push(`with ${aggCount} ${aggText} applied`);
      } else {
        parts.push(`${aggCount} ${aggText} applied to the data`);
      }
    }

    if (this.hasSorting()) {
      const sortDescriptions = this.report!.sorting.map((sort, i) => {
        const direction = sort.direction === 'asc' ? 'ascending' : 'descending';
        const priority = i === 0 ? 'sorted' : 'then sorted';
        return `${priority} by ${sort.displayName} (${direction})`;
      });
      
      if (parts.length > 0) {
        if (this.hasGrouping()) {
          parts.push('Within each group, data is ' + sortDescriptions.join(', '));
        } else {
          parts.push('Data is ' + sortDescriptions.join(', '));
        }
      } else {
        parts.push('Data is ' + sortDescriptions.join(', '));
      }
    }

    if (parts.length === 0) {
      return 'No organization applied. Records appear in default order.';
    }

    return parts.join(', ') + '.';
  }
}

