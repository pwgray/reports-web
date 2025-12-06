import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, OnInit } from "@angular/core";
import { DataSourceInfo } from "../../../../core/models/data-source-info.model";
import { Observable } from "rxjs";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatDialogModule, MatDialog } from "@angular/material/dialog";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { trigger, transition, style, animate } from '@angular/animations';
import { SchemaInfo } from "../../../../core/models/schema-info.model";
import { ReportBuilderService } from "../../services/report-builder.service";

@Component({
  selector: 'app-datasource-selector',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatSnackBarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatSelectModule,
    MatOptionModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="datasource-selector">
      <!-- Header -->
      <div class="selector-header">
        <div class="header-content">
          <h3 class="selector-title">
            <mat-icon class="title-icon">storage</mat-icon>
            Select Data Source
          </h3>
          <p class="selector-description">
            Choose a data source to connect to your report, or create a new one
          </p>
        </div>
        <div class="header-actions">
          <button 
            mat-raised-button
            color="primary"
            (click)="toggleCreatePanel()"
            [class.active]="showCreatePanel">
            <mat-icon>{{ showCreatePanel ? 'close' : 'add' }}</mat-icon>
            {{ showCreatePanel ? 'Cancel' : 'New Data Source' }}
          </button>
        </div>
      </div>

      <!-- Create/Edit Panel -->
      <mat-card class="form-panel" *ngIf="showCreatePanel" [@slideDown]>
        <mat-card-header>
          <div class="panel-header">
            <mat-icon class="panel-icon">{{ editMode ? 'edit' : 'add_circle' }}</mat-icon>
            <h4>{{ editMode ? 'Edit Data Source' : 'Create New Data Source' }}</h4>
          </div>
        </mat-card-header>

        <mat-card-content>
          <div class="form-grid">
            <div class="form-field">
              <label for="ds-name">Name *</label>
              <input 
                id="ds-name"
                type="text" 
                [(ngModel)]="formData.name" 
                placeholder="e.g. Production SQL Server"
                class="mat-input" />
            </div>

            <div class="form-field">
              <label for="ds-type">Database Type *</label>
              <mat-select 
                id="ds-type"
                [(ngModel)]="formData.type"
                placeholder="Select database type">
                <mat-option value="sqlserver">
                  <mat-icon>dns</mat-icon>
                  SQL Server
                </mat-option>
                <mat-option value="postgresql">
                  <mat-icon>dns</mat-icon>
                  PostgreSQL
                </mat-option>
                <mat-option value="mysql">
                  <mat-icon>dns</mat-icon>
                  MySQL
                </mat-option>
                <mat-option value="oracle">
                  <mat-icon>dns</mat-icon>
                  Oracle
                </mat-option>
              </mat-select>
            </div>

            <div class="form-field">
              <label for="ds-server">Server *</label>
              <input 
                id="ds-server"
                type="text" 
                [(ngModel)]="formData.server" 
                placeholder="e.g. localhost or 192.168.1.100"
                class="mat-input" />
            </div>

            <div class="form-field">
              <label for="ds-port">Port</label>
              <input 
                id="ds-port"
                type="number" 
                [(ngModel)]="formData.port" 
                placeholder="e.g. 1433 for SQL Server"
                class="mat-input" />
              <small class="field-hint">
                <mat-icon class="hint-icon">info</mat-icon>
                Leave empty for default port
              </small>
            </div>

            <div class="form-field">
              <label for="ds-database">Database *</label>
              <input 
                id="ds-database"
                type="text" 
                [(ngModel)]="formData.database" 
                placeholder="e.g. Northwind"
                class="mat-input" />
            </div>

            <div class="form-field">
              <label for="ds-username">Username *</label>
              <input 
                id="ds-username"
                type="text" 
                [(ngModel)]="formData.username" 
                placeholder="e.g. sa"
                class="mat-input" />
            </div>

            <div class="form-field">
              <label for="ds-password">Password *</label>
              <input 
                id="ds-password"
                type="password" 
                [(ngModel)]="formData.password" 
                placeholder="Enter password"
                class="mat-input" />
              <small class="field-hint">
                <mat-icon class="hint-icon">info</mat-icon>
                Password is stored securely
              </small>
            </div>
          </div>

          <!-- Schema Filtering Section -->
          <div class="filter-section">
            <h5 class="filter-title">
              <mat-icon>filter_list</mat-icon>
              Schema Filtering (Optional)
            </h5>
            <small class="filter-description">Filter which database objects to include</small>

            <div class="form-grid">
              <div class="form-field">
                <label for="ds-schemas">Include Schemas</label>
                <mat-select 
                  id="ds-schemas"
                  [(ngModel)]="formData.includedSchemas"
                  multiple
                  placeholder="All schemas (leave empty for all)">
                  <mat-option *ngFor="let schema of commonSchemas" [value]="schema">
                    {{ schema }}
                  </mat-option>
                </mat-select>
                <small class="field-hint">
                  <mat-icon class="hint-icon">info</mat-icon>
                  Select specific schemas (e.g., dbo, custom)
                </small>
              </div>

              <div class="form-field">
                <label for="ds-object-types">Include Object Types</label>
                <mat-select 
                  id="ds-object-types"
                  [(ngModel)]="formData.includedObjectTypes"
                  multiple
                  placeholder="All types (leave empty for all)">
                  <mat-option value="table">
                    <mat-icon>table_chart</mat-icon>
                    Tables
                  </mat-option>
                  <mat-option value="view">
                    <mat-icon>visibility</mat-icon>
                    Views
                  </mat-option>
                  <mat-option value="stored_procedure">
                    <mat-icon>code</mat-icon>
                    Stored Procedures
                  </mat-option>
                </mat-select>
                <small class="field-hint">
                  <mat-icon class="hint-icon">info</mat-icon>
                  Choose which object types to include
                </small>
              </div>

              <div class="form-field">
                <label for="ds-name-pattern">Object Name Pattern</label>
                <input 
                  id="ds-name-pattern"
                  type="text" 
                  [(ngModel)]="formData.objectNamePattern" 
                  placeholder="e.g., Customer% or %Order%"
                  class="mat-input" />
                <small class="field-hint">
                  <mat-icon class="hint-icon">info</mat-icon>
                  SQL LIKE pattern (% for wildcard)
                </small>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button 
              mat-raised-button
              (click)="fetchSchema()" 
              [disabled]="isFetching || !canFetchSchema()">
              <mat-icon>{{ isFetching ? 'refresh' : 'cloud_download' }}</mat-icon>
              {{ isFetching ? 'Fetching Schema...' : 'Fetch Schema' }}
            </button>

            <div class="schema-status" *ngIf="fetchedSchema">
              <mat-icon class="success-icon">check_circle</mat-icon>
              <span>Schema loaded: <strong>{{ fetchedSchema.tables.length || 0 }} tables</strong></span>
            </div>
          </div>
        </mat-card-content>

        <mat-card-actions>
          <button 
            mat-button
            (click)="cancelForm()">
            Cancel
          </button>
          <button 
            mat-raised-button
            color="primary"
            (click)="saveDataSource()"
            [disabled]="saving || !canSave()">
            <mat-icon>{{ saving ? 'hourglass_empty' : 'save' }}</mat-icon>
            {{ saving ? 'Saving...' : (editMode ? 'Update' : 'Create') }}
          </button>
        </mat-card-actions>
      </mat-card>

      <!-- Data Sources Grid -->
      <div class="datasources-section" *ngIf="dataSources && dataSources.length > 0">
        <div class="section-header">
          <h4>
            <mat-icon>folder</mat-icon>
            Available Data Sources ({{ dataSources.length }})
          </h4>
        </div>

        <div class="datasource-grid">
          <mat-card 
            class="datasource-card" 
            *ngFor="let datasource of dataSources"
            [class.selected]="selectedDataSource?.id === datasource.id"
            (click)="selectDataSource(datasource)"
            [@cardAnimation]>
            
            <mat-card-content>
              <div class="card-main" (click)="selectDataSource(datasource)">
                <div class="card-icon">
                  <mat-icon [class.selected-icon]="selectedDataSource?.id === datasource.id">
                    storage
                  </mat-icon>
                </div>

                <div class="card-info">
                  <h4 class="datasource-name">{{ datasource.name }}</h4>
                  <div class="datasource-meta">
                    <span class="datasource-type">
                      <mat-icon class="type-icon">dns</mat-icon>
                      {{ getDatabaseTypeDisplay(datasource.type) }}
                    </span>
                    <span class="table-count" *ngIf="datasource.schema">
                      <mat-icon class="count-icon">table_chart</mat-icon>
                      {{ datasource.schema.tables.length || 0 }} tables
                    </span>
                  </div>
                </div>

                <div class="selection-indicator" *ngIf="selectedDataSource?.id === datasource.id">
                  <mat-icon class="check-icon">check_circle</mat-icon>
                </div>
              </div>

              <div class="card-actions" (click)="$event.stopPropagation()">
                <button 
                  mat-icon-button
                  (click)="editDataSource(datasource)"
                  matTooltip="Edit data source"
                  color="primary">
                  <mat-icon>edit</mat-icon>
                </button>
                <button 
                  mat-icon-button
                  (click)="confirmDelete(datasource)"
                  matTooltip="Delete data source"
                  color="warn">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!dataSources || dataSources.length === 0">
        <mat-icon class="empty-icon">cloud_off</mat-icon>
        <h4>No Data Sources Available</h4>
        <p>Get started by creating your first data source</p>
        <button 
          mat-raised-button
          color="primary"
          (click)="toggleCreatePanel()">
          <mat-icon>add</mat-icon>
          Create Data Source
        </button>
      </div>

      <!-- Selection Feedback -->
      <div class="selection-feedback" *ngIf="selectedDataSource && dataSources && dataSources.length > 0">
        <mat-card class="feedback-card">
          <mat-icon class="feedback-icon">check_circle</mat-icon>
          <div class="feedback-content">
            <span class="feedback-label">Selected Data Source:</span>
            <strong class="feedback-value">{{ selectedDataSource.name }}</strong>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styleUrls: ['./datasource-selector.component.scss'],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ height: 0, opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ height: '*', opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ height: 0, opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ]),
    trigger('cardAnimation', [
      transition(':enter', [
        style({ transform: 'scale(0.95)', opacity: 0 }),
        animate('200ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ])
  ]
})
/**
 * Component for selecting, creating, and managing data sources.
 * Provides UI for browsing available data sources, creating new ones,
 * editing existing ones, and configuring schema filtering options.
 */
export class DataSourceSelectorComponent implements OnChanges, OnInit {
    /** Array of available data sources */
    @Input() dataSources!: DataSourceInfo[] | null;
    
    /** Currently selected data source (from parent component) */
    @Input() selected: DataSourceInfo | null = null;
    
    /** Event emitted when a data source is selected */
    @Output() dataSourceSelected = new EventEmitter<DataSourceInfo>();
    
    /** Event emitted when the next button is clicked */
    @Output() nextClicked = new EventEmitter<void>();
    
    /** Event emitted when a data source is created or updated (triggers refresh) */
    @Output() dataSourceCreated = new EventEmitter<DataSourceInfo>();
    
    /** Currently selected data source (internal state) */
    selectedDataSource: DataSourceInfo | null = null;

    /** Whether the create/edit panel is visible */
    showCreatePanel = false;
    
    /** Whether the form is in edit mode (vs create mode) */
    editMode = false;
    
    /** ID of the data source being edited (if in edit mode) */
    editingId: string | null = null;
    /** Form data for creating/editing data sources */
    formData: { 
      name: string; 
      type: string; 
      server: string; 
      port?: number; 
      database: string; 
      username: string; 
      password: string;
      includedSchemas?: string[];
      includedObjectTypes?: string[];
      objectNamePattern?: string;
    } = { 
      name: '', 
      type: 'sqlserver', 
      server: 'localhost', 
      port: undefined, 
      database: '', 
      username: '', 
      password: '',
      includedSchemas: [],
      includedObjectTypes: [],
      objectNamePattern: ''
    };
    
    /** Schema information fetched from the database */
    fetchedSchema: SchemaInfo | null = null;
    
    /** Whether schema is currently being fetched */
    isFetching = false;
    
    /** Common SQL Server schemas for the dropdown */
    commonSchemas = ['dbo', 'sys', 'guest', 'INFORMATION_SCHEMA'];
    
    /** Whether data source is currently being saved */
    saving = false;

    /**
     * Creates an instance of DataSourceSelectorComponent.
     * @param reportBuilderService - Service for data source operations
     * @param snackBar - Material Snackbar for user notifications
     * @param dialog - Material Dialog service
     */
    constructor(
        private reportBuilderService: ReportBuilderService, 
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) {}

    ngOnInit(): void {
        console.log('DataSourceSelectorComponent ngOnInit', this.selected);
        if(this.selected) {
            this.selectedDataSource = this.selected;
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['selected']) {
            this.selectedDataSource = this.selected || null;
        }
        if (!this.selectedDataSource && changes['dataSources'] && this.selected && Array.isArray(this.dataSources)) {
            const match = this.dataSources?.find(ds => ds.id === this.selected!.id);
            if (match) {
                this.selectedDataSource = match;
            } else {
                this.selectedDataSource = this.selected;
            }
        }
        if (this.selectedDataSource) {
            this.dataSourceSelected.emit(this.selectedDataSource);
        }
    }

    /**
     * Selects a data source and emits the selection event.
     * @param datasource - The data source to select
     */
    selectDataSource(datasource: DataSourceInfo): void {
        this.selectedDataSource = datasource;
        if(this.selectedDataSource) {
          this.dataSourceSelected.emit(this.selectedDataSource);    
        }
    }

    proceedToNext(): void {
        if (this.selectedDataSource) {
            this.nextClicked.emit();
        }
    }

    toggleCreatePanel(): void {
        this.showCreatePanel = !this.showCreatePanel;
        if (!this.showCreatePanel) {
          this.resetForm();
        }
    }

    editDataSource(datasource: DataSourceInfo): void {
        this.editMode = true;
        this.editingId = datasource.id || null;
        this.formData = {
            name: datasource.name,
            type: datasource.type,
            server: datasource.server,
            port: datasource.port,
            database: datasource.database,
            username: datasource.username,
            password: datasource.password,
            includedSchemas: datasource.includedSchemas || [],
            includedObjectTypes: datasource.includedObjectTypes || [],
            objectNamePattern: datasource.objectNamePattern || ''
        };
        this.fetchedSchema = datasource.schema || null;
        this.showCreatePanel = true;
    }

    cancelForm(): void {
        this.showCreatePanel = false;
        this.resetForm();
    }

    confirmDelete(datasource: DataSourceInfo): void {
        if (confirm(`Are you sure you want to delete "${datasource.name}"?\n\nThis action cannot be undone.`)) {
            this.deleteDataSource(datasource);
        }
    }

    deleteDataSource(datasource: DataSourceInfo): void {
        if (!datasource.id) return;

        this.reportBuilderService.deleteDataSource(datasource.id).subscribe({
            next: () => {
                this.snackBar.open('Data source deleted successfully', 'Close', { duration: 3000 });
                // If deleted datasource was selected, clear selection
                if (this.selectedDataSource?.id === datasource.id) {
                    this.selectedDataSource = null;
                    this.dataSourceSelected.emit(null as any);
                }
                // Notify parent to refresh the list
                this.dataSourceCreated.emit(datasource); // Reusing this event to trigger refresh
            },
            error: (err) => {
                console.error(err);
                this.snackBar.open('Failed to delete data source', 'Close', { duration: 3000 });
            }
        });
    }

    /**
     * Validates that all required fields are filled before fetching schema.
     * @returns True if schema can be fetched, false otherwise
     */
    canFetchSchema(): boolean {
      return !!this.formData.server && !!this.formData.database && !!this.formData.username && 
             !!this.formData.password && !!this.formData.type && !!this.formData.name;
    }

    /**
     * Fetches schema information from the database using connection details.
     * Applies schema filtering options if specified.
     */
    fetchSchema(): void {
      if (!this.canFetchSchema()) return;
      this.isFetching = true;
      this.fetchedSchema = null;
      console.log('Connection details:', { 
        server: this.formData.server, 
        port: this.formData.port, 
        database: this.formData.database,
        username: this.formData.username,
        includedSchemas: this.formData.includedSchemas,
        includedObjectTypes: this.formData.includedObjectTypes,
        objectNamePattern: this.formData.objectNamePattern
      });
      this.reportBuilderService.introspectSchema(
        this.formData.server, 
        this.formData.port, 
        this.formData.database, 
        this.formData.username, 
        this.formData.password, 
        this.formData.type,
        this.formData.includedSchemas && this.formData.includedSchemas.length > 0 ? this.formData.includedSchemas : undefined,
        this.formData.includedObjectTypes && this.formData.includedObjectTypes.length > 0 ? this.formData.includedObjectTypes : undefined,
        this.formData.objectNamePattern || undefined
      ).subscribe({
        next: (schema) => {
          this.fetchedSchema = schema;
          this.isFetching = false;
          const filterInfo = [];
          if (this.formData.includedSchemas && this.formData.includedSchemas.length > 0) {
            filterInfo.push(`schemas: ${this.formData.includedSchemas.join(', ')}`);
          }
          if (this.formData.includedObjectTypes && this.formData.includedObjectTypes.length > 0) {
            filterInfo.push(`types: ${this.formData.includedObjectTypes.join(', ')}`);
          }
          const message = filterInfo.length > 0 
            ? `Schema fetched with filters (${filterInfo.join('; ')})`
            : 'Schema fetched successfully';
          this.snackBar.open(message, 'Close', { duration: 3000 });
        },
        error: (err) => {
          console.error(err);
          this.isFetching = false;
          this.snackBar.open('Failed to fetch schema. Check your connection details.', 'Close', { duration: 3000 });
        }
      });
    }

    /**
     * Validates that all required fields are filled and schema is fetched.
     * @returns True if data source can be saved, false otherwise
     */
    canSave(): boolean {
      return !!this.formData.name && !!this.formData.type && !!this.formData.server && 
             !!this.formData.database && !!this.formData.username && !!this.formData.password && !!this.fetchedSchema;
    }

    /**
     * Saves the data source (creates new or updates existing).
     * Emits dataSourceCreated event to trigger parent refresh.
     */
    saveDataSource(): void {
      if (!this.canSave()) return;
      this.saving = true;

      const payload = {
        name: this.formData.name,
        type: this.formData.type,
        server: this.formData.server,
        port: this.formData.port,
        database: this.formData.database,
        username: this.formData.username,
        password: this.formData.password,
        includedSchemas: this.formData.includedSchemas && this.formData.includedSchemas.length > 0 ? this.formData.includedSchemas : undefined,
        includedObjectTypes: this.formData.includedObjectTypes && this.formData.includedObjectTypes.length > 0 ? this.formData.includedObjectTypes : undefined,
        objectNamePattern: this.formData.objectNamePattern || undefined,
        schema: this.fetchedSchema!
      };

      const operation = this.editMode && this.editingId
        ? this.reportBuilderService.updateDataSource(this.editingId, payload)
        : this.reportBuilderService.createDataSource(payload);

      operation.subscribe({
        next: (result) => {
          this.saving = false;
          const message = this.editMode ? 'Data source updated successfully' : 'Data source created successfully';
          this.snackBar.open(message, 'Close', { duration: 3000 });
          this.dataSourceCreated.emit(result);
          this.resetForm();
          this.showCreatePanel = false;
        },
        error: (err) => {
          console.error(err);
          this.saving = false;
          const message = this.editMode ? 'Failed to update data source' : 'Failed to create data source';
          this.snackBar.open(message, 'Close', { duration: 3000 });
        }
      });
    }

    getDatabaseTypeDisplay(type: string): string {
        const typeMap: { [key: string]: string } = {
            'sqlserver': 'SQL Server',
            'postgresql': 'PostgreSQL',
            'mysql': 'MySQL',
            'oracle': 'Oracle'
        };
        return typeMap[type.toLowerCase()] || type;
    }

    private resetForm(): void {
      this.formData = { 
        name: '', 
        type: 'sqlserver', 
        server: 'localhost', 
        port: undefined, 
        database: '', 
        username: '', 
        password: '',
        includedSchemas: [],
        includedObjectTypes: [],
        objectNamePattern: ''
      };
      this.fetchedSchema = null;
      this.isFetching = false;
      this.saving = false;
      this.editMode = false;
      this.editingId = null;
    }
}