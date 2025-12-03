import { Component, OnInit, OnDestroy, Input, ChangeDetectorRef } from "@angular/core";
import { Subject, takeUntil, filter, debounceTime, finalize } from "rxjs";
import { ReportDefinition, SelectedField, FieldDataType } from "../../../../core/models/report.models";
import { ReportBuilderService } from "../../services/report-builder.service";
import { PreviewResult } from "../../../../core/models/preview-result.model";
import { CommonModule } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ChartPreviewComponent } from "../chart-preview/chart-preview.component";

// features/report-builder/components/preview-panel/preview-panel.component.ts
@Component({
  selector: 'app-preview-panel',
  imports: [
    CommonModule,
    FontAwesomeModule,
    ChartPreviewComponent
  ],
  template: `
    <div class="preview-panel">
      <div class="preview-header">
        <h4>Live Preview</h4>
        <div class="preview-controls">
          <button 
            class="refresh-btn"
            (click)="refreshPreview()"
            [disabled]="isLoading">
            <i class="icon-refresh" [class.spinning]="isLoading"></i>
            Refresh
          </button>
          
          <div class="format-toggle">
            <button 
              *ngFor="let format of formats"
              class="format-btn"
              [class.active]="selectedFormat === format.value"
              (click)="selectedFormat = format.value; refreshPreview()">
              {{ format.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="preview-content">
        <!-- Loading State -->
        <div *ngIf="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Generating preview...</p>
        </div>

        <!-- Error State -->
        <div *ngIf="error && !isLoading" class="error-state">
          <i class="icon-error"></i>
          <h5>Preview Error</h5>
          <p>{{ error }}</p>
          <button class="retry-btn" (click)="refreshPreview()">Try Again</button>
        </div>

        <!-- Empty State -->
        <div *ngIf="!previewData && !isLoading && !error" class="empty-state">
          <i class="icon-preview"></i>
          <h5>No Preview Available</h5>
          <p>Add some fields to see a preview of your report</p>
        </div>

        <!-- Preview Data -->
        <div *ngIf="previewData && !isLoading && !error" class="preview-data">
          <!-- Table View -->
          <div *ngIf="selectedFormat === 'table'" class="table-preview">
            <div class="table-info">
              <span class="record-count">{{ previewData['totalRows'] | number }} total records</span>
              <span class="execution-time">Generated in {{ previewData['executionTime'] }}ms</span>
            </div>
            
            <div class="table-container">
              <table class="preview-table">
                <thead>
                  <tr>
                    <th *ngFor="let field of report.selectedFields">
                      {{ field.displayName }}
                      <span class="field-type">({{ getFieldTypeDisplay(field.dataType) }})</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of previewData.data; let i = index">
                    <td *ngFor="let field of report.selectedFields">
                      {{ formatCellValue(row[field.fieldName], field) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="preview-footer" *ngIf="previewData['totalRows'] > previewData['data'].length">
              <p>Showing first {{ previewData['data'].length }} of {{ previewData['totalRows'] }} records</p>
            </div>
          </div>

          <!-- Chart View -->
          <div *ngIf="selectedFormat === 'chart'" class="chart-preview">
            <app-chart-preview 
              [data]="previewData.data"
              [fields]="report.selectedFields"
              [chartType]="getRecommendedChartType()">
            </app-chart-preview>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./preview-panel.component.scss']
})
export class PreviewPanelComponent implements OnInit, OnDestroy {
  @Input() report: ReportDefinition = {} as ReportDefinition;
  @Input() selectedFormat : string = 'table';

  previewData: PreviewResult | null = null;
  isLoading = false;
  error: string | null = null;
  

  formats = [
    { value: 'table', label: 'Table' },
    { value: 'chart', label: 'Chart' }
  ];

  private destroy$ = new Subject<void>();
  private refreshDebounce$ = new Subject<void>();

  constructor(
    private reportBuilderService: ReportBuilderService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Auto-refresh preview when report changes
    this.reportBuilderService.getCurrentReport()
      .pipe(
        takeUntil(this.destroy$),
        filter(report => !!report && report.selectedFields.length > 0),
        debounceTime(500) // Debounce to avoid too many requests
      )
      .subscribe(report => {
        if (report) {
          this.report = report;
          this.refreshPreview();
        }
      });

    // Debounced refresh trigger
    this.refreshDebounce$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300)
      )
      .subscribe(() => this.executePreview());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshPreview(): void {
    this.refreshDebounce$.next();
  }

  private executePreview(): void {
    if (!this.report.selectedFields?.length) {
      this.previewData = null;
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.reportBuilderService.previewReport(this.report, 50) // Limit for preview
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.previewData = data;
          this.error = null;
        },
        error: (error) => {
          this.error = error.message || 'Failed to generate preview';
          this.previewData = null;
        }
      });
  }

  formatCellValue(value: any, field: SelectedField): string {
    if (value === null || value === undefined) return '';

    switch (field.dataType) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'number':
        return new Intl.NumberFormat().format(value);
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return String(value);
    }
  }

  getFieldTypeDisplay(dataType: FieldDataType): string {
    switch (dataType) {
      case FieldDataType.STRING:
        return 'Text';
      case FieldDataType.NUMBER:
        return 'Number';
      case FieldDataType.DATE:
        return 'Date';
      case FieldDataType.BOOLEAN:
        return 'Yes/No';
      case FieldDataType.CURRENCY:
        return 'Currency';
      default:
        return 'Text';
    }
  }

  getRecommendedChartType(): "table" | "bar" | "line" {
    const numericFields = this.report.selectedFields.filter(f => 
      f.dataType === 'number' || f.dataType === 'currency'
    );
    const dateFields = this.report.selectedFields.filter(f => f.dataType === 'date');

    if (dateFields.length > 0 && numericFields.length > 0) {
      return 'line'; // Time series
    } else if (numericFields.length > 0) {
      return 'bar'; // Categorical comparison
    }
    return 'table'; // Fallback to table
  }
}