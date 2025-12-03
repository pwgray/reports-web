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

            <div class="form-field full-width">
              <label for="ds-connection">Connection String *</label>
              <input 
                id="ds-connection"
                type="text" 
                [(ngModel)]="formData.connectionString" 
                placeholder="Server=...;Database=...;User ID=...;Password=...;"
                class="mat-input" />
              <small class="field-hint">
                <mat-icon class="hint-icon">info</mat-icon>
                Ensure the connection string is valid and secure
              </small>
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
                      {{ datasource.schema.tables?.length || 0 }} tables
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
export class DataSourceSelectorComponent implements OnChanges, OnInit {
    @Input() dataSources!: DataSourceInfo[] | null;
    @Input() selected: DataSourceInfo | null = null;
    @Output() dataSourceSelected = new EventEmitter<DataSourceInfo>();
    @Output() nextClicked = new EventEmitter<void>();
    @Output() dataSourceCreated = new EventEmitter<DataSourceInfo>();
    
    selectedDataSource: DataSourceInfo | null = null;

    showCreatePanel = false;
    editMode = false;
    editingId: string | null = null;
    formData: { name: string; type: string; connectionString: string } = { name: '', type: 'sqlserver', connectionString: '' };
    fetchedSchema: SchemaInfo | null = null;
    isFetching = false;
    saving = false;

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
            connectionString: datasource.connectionString || ''
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

    canFetchSchema(): boolean {
      return !!this.formData.connectionString && !!this.formData.type && !!this.formData.name;
    }

    fetchSchema(): void {
      if (!this.canFetchSchema()) return;
      this.isFetching = true;
      this.fetchedSchema = null;
      console.log('connection string: ', this.formData.connectionString);
      this.reportBuilderService.introspectSchema(this.formData.connectionString, this.formData.type).subscribe({
        next: (schema) => {
          this.fetchedSchema = schema;
          this.isFetching = false;
          this.snackBar.open('Schema fetched successfully', 'Close', { duration: 2500 });
        },
        error: (err) => {
          console.error(err);
          this.isFetching = false;
          this.snackBar.open('Failed to fetch schema. Check your connection string.', 'Close', { duration: 3000 });
        }
      });
    }

    canSave(): boolean {
      return !!this.formData.name && !!this.formData.type && !!this.formData.connectionString && !!this.fetchedSchema;
    }

    saveDataSource(): void {
      if (!this.canSave()) return;
      this.saving = true;

      const payload = {
        name: this.formData.name,
        type: this.formData.type,
        connectionString: this.formData.connectionString,
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
      this.formData = { name: '', type: 'sqlserver', connectionString: '' };
      this.fetchedSchema = null;
      this.isFetching = false;
      this.saving = false;
      this.editMode = false;
      this.editingId = null;
    }
}