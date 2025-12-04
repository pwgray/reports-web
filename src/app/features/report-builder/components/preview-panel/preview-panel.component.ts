import { Component, OnInit, OnDestroy, Input, ChangeDetectorRef } from "@angular/core";
import { Subject, takeUntil, filter, debounceTime, finalize } from "rxjs";
import { ReportDefinition, SelectedField, FieldDataType } from "../../../../core/models/report.models";
import { ReportBuilderService } from "../../services/report-builder.service";
import { PreviewResult } from "../../../../core/models/preview-result.model";
import { CommonModule } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ChartPreviewComponent } from "../chart-preview/chart-preview.component";
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import * as XLSX from 'xlsx';

// features/report-builder/components/preview-panel/preview-panel.component.ts
@Component({
  selector: 'app-preview-panel',
  imports: [
    CommonModule,
    FontAwesomeModule,
    ChartPreviewComponent,
    MatButtonToggleModule,
    MatIconModule
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
          
          <mat-button-toggle-group 
            class="format-toggle"
            [(value)]="selectedFormat"
            (change)="refreshPreview()">
            <mat-button-toggle 
              *ngFor="let format of formats" 
              [value]="format.value">
              <mat-icon>{{ format.icon }}</mat-icon>
              {{ format.label }}
            </mat-button-toggle>
          </mat-button-toggle-group>
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
    { value: 'table', label: 'Table', icon: 'table_chart' },
    { value: 'chart', label: 'Chart', icon: 'bar_chart' }
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

  /**
   * Export report data to Excel
   * Public method that can be called from parent components
   */
  public exportToExcel(fileName?: string): void {
    if (!this.previewData || !this.previewData.data || this.previewData.data.length === 0) {
      console.warn('No data available to export');
      return;
    }

    try {
      // Prepare data for Excel
      const exportData = this.previewData.data.map(row => {
        const formattedRow: any = {};
        this.report.selectedFields.forEach(field => {
          const columnName = field.displayName || field.fieldName;
          const value = row[field.fieldName];
          
          // Format the value appropriately for Excel
          formattedRow[columnName] = this.formatValueForExcel(value, field);
        });
        return formattedRow;
      });

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Auto-size columns
      const columnWidths = this.report.selectedFields.map(field => {
        const headerLength = (field.displayName || field.fieldName).length;
        const maxDataLength = Math.max(
          ...this.previewData!.data.slice(0, 100).map(row => {
            const value = this.formatValueForExcel(row[field.fieldName], field);
            return String(value).length;
          })
        );
        return { wch: Math.min(Math.max(headerLength, maxDataLength) + 2, 50) };
      });
      worksheet['!cols'] = columnWidths;

      // Create workbook and add worksheet
      const workbook = XLSX.utils.book_new();
      const sheetName = this.report.name ? 
        this.report.name.substring(0, 31) : // Excel sheet name max length is 31
        'Report Data';
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Generate file name
      const defaultFileName = `${this.report.name || 'Report'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      const finalFileName = fileName || defaultFileName;

      // Download file
      XLSX.writeFile(workbook, finalFileName);

      console.log(`Exported ${this.previewData.data.length} rows to ${finalFileName}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  }

  /**
   * Format value appropriately for Excel export
   */
  private formatValueForExcel(value: any, field: SelectedField): any {
    if (value === null || value === undefined) return '';

    switch (field.dataType) {
      case 'currency':
      case 'number':
        // Return as number for Excel to recognize it
        return typeof value === 'number' ? value : parseFloat(value) || 0;
      
      case 'date':
        // Return as Date object for Excel
        return value instanceof Date ? value : new Date(value);
      
      case 'boolean':
        return value ? 'Yes' : 'No';
      
      default:
        return String(value);
    }
  }
}