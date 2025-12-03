import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject, Subject, takeUntil } from "rxjs";
import { ReportDefinition, SelectedField, FilterCondition, SortField, LayoutConfiguration, GroupByField } from "../../core/models/report.models";
import { ReportBuilderService } from "./services/report-builder.service";
import { DataSourceInfo } from "../../core/models/data-source-info.model";
import { SchemaInfo } from "../../core/models/schema-info.model";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { CommonModule } from "@angular/common";
import { FilterBuilderComponent } from "./components/filter-builder/filter-builder.component";
import { FieldSelectorComponent } from "./components/field-selector/field-selector.component";
import { LayoutPreviewComponent } from "../../layout/layout-preview/layout-preview.component";
import { GroupSortingComponent } from "./components/group-sorting/group-sorting.component";
import { DataSourceSelectorComponent } from "./components/datasource-selector/datasource-selector.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

// features/report-builder/report-builder.component.ts
@Component({
  selector: 'app-report-builder',
  imports: [
    CommonModule,
    FormsModule,
    MatSnackBarModule,
    GroupSortingComponent,
    LayoutPreviewComponent,
    FilterBuilderComponent,
    FieldSelectorComponent, DataSourceSelectorComponent,
    FontAwesomeModule
  ],
  template: `
    <div class="report-builder-container">
      <!-- Progress Indicator -->
      <div class="progress-steps">
        <div class="step" [class.active]="currentStep === 1" [class.completed]="currentStep > 1">
          <div class="step-circle">1</div>
          <span>Choose Data</span>
        </div>
        <div class="step" [class.active]="currentStep === 2" [class.completed]="currentStep > 2">
          <div class="step-circle">2</div>
          <span>Select Fields</span>
        </div>
        <div class="step" [class.active]="currentStep === 3" [class.completed]="currentStep > 3">
          <div class="step-circle">3</div>
          <span>Add Filters</span>
        </div>
        <div class="step" [class.active]="currentStep === 4" [class.completed]="currentStep > 4">
          <div class="step-circle">4</div>
          <span>Group & Sort</span>
        </div>
        <div class="step" [class.active]="currentStep === 5">
          <div class="step-circle">5</div>
          <span>Format & Preview</span>
        </div>
      </div>

      <!-- Step Content -->
      <div class="step-content">
        <!-- Step 1: Data Source Selection -->
                <app-datasource-selector 
          *ngIf="currentStep === 1"
          [dataSources]="dataSources$ | async"
          [selected]="report.dataSource && report.dataSource.id ? report.dataSource : null"
          (dataSourceSelected)="onDataSourceSelected($event)"
          (dataSourceCreated)="onDataSourceCreated($event)"
          (nextClicked)="nextStep()">
        </app-datasource-selector>

        <!-- Step 2: Field Selection -->
        <app-field-selector 
          *ngIf="currentStep === 2"
          [schema]="schema$ | async"
          [selectedFields]="report.selectedFields"
          (fieldsChanged)="onFieldsChanged($event)">
        </app-field-selector>

        <!-- Step 3: Filter Builder -->
        <app-filter-builder 
          *ngIf="currentStep === 3"
          [availableFields]="report.selectedFields"
          [filters]="report.filters"
          (filtersChanged)="onFiltersChanged($event)">
        </app-filter-builder>

        <!-- Step 4: Grouping & Sorting -->
        <app-group-sorting 
          *ngIf="currentStep === 4"
          [availableFields]="report.selectedFields"
          [groupBy]="report.groupBy"
          [sorting]="report.sorting"
          (groupingChanged)="onGroupingChanged($event)"
          (sortingChanged)="onSortingChanged($event)">
        </app-group-sorting>

        <!-- Step 5: Layout & Preview -->
        <div *ngIf="currentStep === 5" class="report-metadata">
          <div class="form-field">
            <label for="reportName">Report Name <span style="color: var(--danger, #dc2626)">*</span></label>
            <input id="reportName" type="text" [(ngModel)]="report.name" placeholder="Enter report name" />
          </div>
          <div class="form-field">
            <label for="reportDescription">Description</label>
            <textarea id="reportDescription" rows="2" [(ngModel)]="report.description" placeholder="Optional description"></textarea>
          </div>
        </div>
        <app-layout-preview 
          *ngIf="currentStep === 5"
          [report]="report"
          (layoutChanged)="onLayoutChanged($event)">
        </app-layout-preview>
      </div>

      <!-- Navigation -->
      <div class="step-navigation">
        <button 
          class="btn btn-secondary" 
          [disabled]="currentStep === 1"
          (click)="previousStep()">
          Previous
        </button>
        
        <button 
          class="btn btn-primary" 
          [disabled]="!canProceed()"
          (click)="nextStep()"
          *ngIf="currentStep < 5">
          Next
        </button>
        
        <button 
          class="btn btn-success" 
          [disabled]="!report.selectedFields.length || !report.name || !report.name.trim()"
          (click)="saveReport()"
          *ngIf="currentStep === 5">
          Save Report
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./report-builder.component.scss']
})
export class ReportBuilderComponent implements OnInit, OnDestroy {
  currentStep = 1;
  report: ReportDefinition = this.initializeReport();
  dataSources$!: ReturnType<ReportBuilderService['getDataSources']>;
  schema$ = new BehaviorSubject<SchemaInfo | null>(null);
  private destroy$ = new Subject<void>();
  selectedFormat = 'table';

  constructor(
    private reportBuilderService: ReportBuilderService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Load by route param if present
    const routeId = this.route.snapshot.paramMap.get('id');

    console.log('Route ID:' + routeId);
    if (routeId) {
      this.loadExistingReport(routeId);

    } else {
      // Seed from template or report id if navigated from list page
      const nav = this.router.getCurrentNavigation();
      const state = nav?.extras?.state as { template?: string; reportId?: string } | undefined;
      if (state?.reportId) {
        this.loadExistingReport(state.reportId);
      } else if (state?.template) {
        this.applyTemplate(state.template);
      }
    }

    this.dataSources$ = this.reportBuilderService.getDataSources();
    this.reportBuilderService.updateCurrentReport(this.report);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveReport() {
    this.reportBuilderService.saveReport(this.report).subscribe({
      next: () => {
        this.snackBar.open('Report saved', 'Close', { duration: 3000 });
        this.router.navigateByUrl('/');
      },
      error: () => {
        this.snackBar.open('Failed to save report', 'Close', { duration: 3000 });
      }
    });
  }

  onDataSourceCreated(ds: DataSourceInfo) {
    this.snackBar.open('Data source created', 'Close', { duration: 3000 });
    this.dataSources$ = this.reportBuilderService.getDataSources();
    this.onDataSourceSelected(ds);
  }

  onGroupingChanged($event: any) {
    this.report.groupBy = $event as GroupByField[];
    this.reportBuilderService.updateCurrentReport(this.report);
    this.snackBar.open('Grouping updated', 'Close', { duration: 3000 });
  }

  onSortingChanged($event: any): void {
    this.report.sorting = $event as SortField[];
    this.reportBuilderService.updateCurrentReport(this.report);
    this.snackBar.open('Sorting updated', 'Close', { duration: 3000 });
  }

  onLayoutChanged($event: LayoutConfiguration) {
    this.report.layout = $event;
    this.reportBuilderService.updateCurrentReport(this.report);
    this.snackBar.open('Layout updated', 'Close', { duration: 3000 });
  }

  onDataSourceSelected(dataSource: DataSourceInfo): void {
    this.report.dataSource = dataSource;
    if(dataSource && dataSource.id) {
      this.loadSchema(dataSource.id);
    }
  }

  onFieldsChanged(fields: SelectedField[]): void {
    this.report.selectedFields = fields;
    this.reportBuilderService.updateCurrentReport(this.report);
  }

  onFiltersChanged(filters: FilterCondition[]): void {
    this.report.filters = filters;
    this.reportBuilderService.updateCurrentReport(this.report);
  }

  canProceed(): boolean {
    switch (this.currentStep) {
      case 1: return !!this.report.dataSource;
      case 2: return this.report.selectedFields.length > 0;
      case 3: return true; // Filters are optional
      case 4: return true; // Grouping is optional
      case 5: return this.report.selectedFields.length > 0;
      default: return false;
    }
  }

  nextStep(): void {
    if (this.canProceed() && this.currentStep < 5) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  private loadSchema(dataSourceId: string): void {
    this.reportBuilderService.getSchema(dataSourceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(schema => this.schema$.next(schema));
  }

  private initializeReport(): ReportDefinition {
    return {
      name: '',
      description: '',
      dataSource: {} as DataSourceInfo,
      selectedFields: [],
      filters: [],
      groupBy: [],
      sorting: [],
      layout: {},
      parameters: []
    } as ReportDefinition;
  }

  private applyTemplate(template: string) {
    // Minimal layout presets; data source/fields to be chosen in builder
    switch (template) {
      case 'table':
        this.report.layout = { showHeader: true, showFooter: false, showGridLines: true } as LayoutConfiguration;
        break;
      case 'chart':
        this.report.layout = { showHeader: true, showFooter: false } as LayoutConfiguration;
        // could set a flag in metadata if supported; for now layout preset only
        break;
      case 'chart-table':
        this.report.layout = { showHeader: true, showFooter: true, repeatHeaderOnEachPage: true } as LayoutConfiguration;
        break;
      case 'widgets-table':
        this.report.layout = { showHeader: true, showFooter: true } as LayoutConfiguration;
        break;
      case 'dashboard':
        this.report.layout = { orientation: 'landscape', showHeader: true } as LayoutConfiguration;
        break;
    }
  }

  private loadExistingReport(id: string) {
    this.reportBuilderService.getReport(id).subscribe({
      next: (r) => {
        console.log('Raw report from API:', r);
        console.log('Selected fields from API:', r.selectedFields);

        // Map API report to builder model
        this.report = {
          id: r.id,
          name: r.name,
          description: r.description,
          dataSource: r.dataSource,
          // The API returns queryConfig/layoutConfig; map to builder structures as available
          selectedFields: r.selectedFields ?? [],
          filters: r.filters ?? [],
          groupBy: r.groupBy ?? [],
          sorting: r.sorting ?? [],
          layout: r.layout ?? (r as any).layoutConfig ?? {},
          parameters: r.parameters ?? []
        } as ReportDefinition;

        console.log('Mapped report:', this.report);
        console.log('Mapped selected fields:', this.report.selectedFields);

        // Load schema for the data source to populate field selector
        if (this.report.dataSource?.id) {
          this.loadSchema(this.report.dataSource.id);
        }

        this.reportBuilderService.updateCurrentReport(this.report);
      },
      error: (error) => {
        console.error('Error loading report:', error);
        this.snackBar.open('Failed to load report', 'Close', { duration: 3000 });
      }
    });
  }
}