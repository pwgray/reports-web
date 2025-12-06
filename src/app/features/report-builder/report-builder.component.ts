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

/**
 * Main report builder component that orchestrates the multi-step report creation process.
 * Provides a wizard interface with 5 steps:
 * 1. Data Source Selection - Choose or create a data source
 * 2. Field Selection - Select fields from the schema
 * 3. Filter Builder - Add filter conditions
 * 4. Group & Sort - Configure grouping and sorting
 * 5. Format & Preview - Set report metadata, layout, and preview
 * 
 * Supports both creating new reports and editing existing ones.
 * Handles report state management and coordinates between child components.
 */
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
  /** Current step in the wizard (1-5) */
  currentStep = 1;
  
  /** Current report definition being built or edited */
  report: ReportDefinition = this.initializeReport();
  
  /** Observable of available data sources */
  dataSources$!: ReturnType<ReportBuilderService['getDataSources']>;
  
  /** BehaviorSubject containing the current schema information */
  schema$ = new BehaviorSubject<SchemaInfo | null>(null);
  
  /** Subject used to manage subscription lifecycle */
  private destroy$ = new Subject<void>();
  
  /** Selected preview format (currently unused but kept for compatibility) */
  selectedFormat = 'table';

  /**
   * Creates an instance of ReportBuilderComponent.
   * @param reportBuilderService - Service for report and data source operations
   * @param router - Angular Router for navigation
   * @param route - ActivatedRoute for accessing route parameters
   * @param snackBar - Material Snackbar for user notifications
   */
  constructor(
    private reportBuilderService: ReportBuilderService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) { }

  /**
   * Angular lifecycle hook called after component initialization.
   * Loads existing report if ID is provided via route parameter or navigation state.
   * Applies template if specified in navigation state.
   * Initializes data sources observable and updates current report in service.
   */
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

  /**
   * Angular lifecycle hook called before component destruction.
   * Unsubscribes from all observables to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Saves the current report definition to the server.
   * Enriches selected fields with schema information before saving if needed.
   * Navigates to home page on success, shows error message on failure.
   */
  saveReport() {
    // Ensure fields have schema information before saving
    const currentSchema = this.schema$.getValue();
    if (currentSchema && this.report.selectedFields.length > 0) {
      console.log('💾 Ensuring fields have schema before save...');
      this.enrichSelectedFieldsWithSchema(currentSchema);
      console.log('💾 Fields after enrichment:', this.report.selectedFields);
    }
    
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

  /**
   * Handles the data source created event.
   * Refreshes the data sources list and selects the newly created data source.
   * @param ds - The newly created data source
   */
  onDataSourceCreated(ds: DataSourceInfo) {
    this.snackBar.open('Data source created', 'Close', { duration: 3000 });
    this.dataSources$ = this.reportBuilderService.getDataSources();
    this.onDataSourceSelected(ds);
  }

  /**
   * Handles grouping configuration changes from the group-sorting component.
   * Updates the report's groupBy fields and notifies the service.
   * @param $event - New grouping configuration
   */
  onGroupingChanged($event: any) {
    this.report.groupBy = $event as GroupByField[];
    this.reportBuilderService.updateCurrentReport(this.report);
    this.snackBar.open('Grouping updated', 'Close', { duration: 3000 });
  }

  /**
   * Handles sorting configuration changes from the group-sorting component.
   * Updates the report's sorting fields and notifies the service.
   * @param $event - New sorting configuration
   */
  onSortingChanged($event: any): void {
    this.report.sorting = $event as SortField[];
    this.reportBuilderService.updateCurrentReport(this.report);
    this.snackBar.open('Sorting updated', 'Close', { duration: 3000 });
  }

  /**
   * Handles layout configuration changes from the layout-preview component.
   * Updates the report's layout and notifies the service.
   * @param $event - New layout configuration
   */
  onLayoutChanged($event: LayoutConfiguration) {
    this.report.layout = $event;
    this.reportBuilderService.updateCurrentReport(this.report);
    this.snackBar.open('Layout updated', 'Close', { duration: 3000 });
  }

  /**
   * Handles data source selection from the datasource-selector component.
   * Updates the report's data source and loads the schema for that data source.
   * @param dataSource - The selected data source
   */
  onDataSourceSelected(dataSource: DataSourceInfo): void {
    this.report.dataSource = dataSource;
    if(dataSource && dataSource.id) {
      this.loadSchema(dataSource.id);
    }
  }

  /**
   * Handles field selection changes from the field-selector component.
   * Updates the report's selected fields and notifies the service.
   * @param fields - Updated array of selected fields
   */
  onFieldsChanged(fields: SelectedField[]): void {
    this.report.selectedFields = fields;
    this.reportBuilderService.updateCurrentReport(this.report);
  }

  /**
   * Handles filter changes from the filter-builder component.
   * Updates the report's filters and notifies the service.
   * @param filters - Updated array of filter conditions
   */
  onFiltersChanged(filters: FilterCondition[]): void {
    this.report.filters = filters;
    this.reportBuilderService.updateCurrentReport(this.report);
  }

  /**
   * Determines if the user can proceed to the next step.
   * Validates required fields based on the current step:
   * - Step 1: Requires data source selection
   * - Step 2: Requires at least one field selected
   * - Steps 3-4: Always allowed (optional configurations)
   * - Step 5: Requires at least one field selected
   * @returns True if can proceed, false otherwise
   */
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

  /**
   * Advances to the next step in the wizard.
   * Only proceeds if validation passes and not on the last step.
   */
  nextStep(): void {
    if (this.canProceed() && this.currentStep < 5) {
      this.currentStep++;
    }
  }

  /**
   * Returns to the previous step in the wizard.
   * Does nothing if already on the first step.
   */
  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  /**
   * Loads schema information for a data source.
   * Enriches existing selected fields with schema information if any are present.
   * @param dataSourceId - The ID of the data source to load schema for
   * @private
   */
  private loadSchema(dataSourceId: string): void {
    this.reportBuilderService.getSchema(dataSourceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(schema => {
        this.schema$.next(schema);
        // Enrich existing selected fields with schema information
        if (this.report.selectedFields.length > 0) {
          this.enrichSelectedFieldsWithSchema(schema);
        }
      });
  }

  /**
   * Enriches selected fields with schema information from the loaded schema.
   * This is needed for reports loaded from the database that were saved without schema info.
   * Creates a lookup map to handle multiple schemas for the same table name,
   * preferring 'dbo' schema when available.
   * @param schema - The schema information to use for enrichment
   * @private
   */
  private enrichSelectedFieldsWithSchema(schema: SchemaInfo | null): void {
    if (!schema || !schema.tables) return;

    // Create a lookup map that can handle multiple schemas for the same table name
    // Store all possible schemas for each table, with preference for 'dbo'
    const tableSchemaMap = new Map<string, string[]>();
    schema.tables.forEach(table => {
      const tableName = table.name.toLowerCase();
      const tableSchema = table.schema || 'dbo';
      
      if (!tableSchemaMap.has(tableName)) {
        tableSchemaMap.set(tableName, []);
      }
      tableSchemaMap.get(tableName)!.push(tableSchema);
    });

    // Track if any fields were enriched
    let enrichedCount = 0;

    // Update selected fields with schema information if missing
    this.report.selectedFields = this.report.selectedFields.map(field => {
      // If schema is already set, don't overwrite it
      if (field.schema) return field;

      // Look up all possible schemas for this table
      const schemas = tableSchemaMap.get(field.tableName.toLowerCase());
      if (schemas && schemas.length > 0) {
        // Prefer 'dbo' schema if available (it's the default SQL Server schema)
        const preferredSchema = schemas.includes('dbo') ? 'dbo' : schemas[0];
        
        console.log(`📋 Enriching field ${field.tableName}.${field.fieldName} with schema: ${preferredSchema}` + 
                    (schemas.length > 1 ? ` (chose from: ${schemas.join(', ')})` : ''));
        
        enrichedCount++;
        return { ...field, schema: preferredSchema };
      }

      return field;
    });

    // Update the report in the service so other components get the enriched fields
    this.reportBuilderService.updateCurrentReport(this.report);

    // Notify user if fields were enriched
    if (enrichedCount > 0 && this.report.id) {
      console.log(`✅ Enriched ${enrichedCount} fields with schema information`);
      this.snackBar.open(
        `Schema information added to ${enrichedCount} fields. Click "Save Report" to persist these changes.`,
        'Dismiss',
        { duration: 8000 }
      );
    }
  }

  /**
   * Initializes a new empty report definition with default values.
   * @returns A new ReportDefinition object with empty/default properties
   * @private
   */
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

  /**
   * Applies a predefined template to the report layout.
   * Sets initial layout configuration based on the template type.
   * @param template - Template identifier: 'table', 'chart', 'chart-table', 'widgets-table', or 'dashboard'
   * @private
   */
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

  /**
   * Loads an existing report by ID from the server.
   * Maps the API response to the builder's report model structure.
   * Loads the schema for the report's data source after successful load.
   * @param id - The ID of the report to load
   * @private
   */
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