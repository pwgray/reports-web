import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, OnInit } from "@angular/core";
import { DataSourceInfo } from "../../../../core/models/data-source-info.model";
import { Observable } from "rxjs";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { SchemaInfo } from "../../../../core/models/schema-info.model";
import { ReportBuilderService } from "../../services/report-builder.service";

@Component({
  selector: 'app-datasource-selector',
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  template: `
    <div class="datasource-selector">
      <div class="selector-header">
        <h3 class="selector-title">
          <i class="fas fa-database"></i>
          Select Data Source
        </h3>
        <p class="selector-description">
          Choose a data source to connect to your report. After selection, click the "Next" button to continue.
        </p>
      </div>

      <div class="create-datasource">
        <button class="btn btn-secondary" (click)="toggleCreatePanel()">
          {{ showCreatePanel ? 'Cancel' : 'Add New Data Source' }}
        </button>

        <div class="create-panel" *ngIf="showCreatePanel" style="margin-top: 12px;">
          <div class="form-row">
            <label>Name</label>
            <input type="text" [(ngModel)]="newDs.name" placeholder="e.g. Production SQL Server" />
          </div>
          <div class="form-row">
            <label>Type</label>
            <select [(ngModel)]="newDs.type">
              <option value="sqlserver">SQL Server</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="oracle">Oracle</option>
            </select>
          </div>
          <div class="form-row">
            <label>Connection String</label>
            <input type="text" [(ngModel)]="newDs.connectionString" placeholder="Server=...;Port=...;User ID=...;Password=...;Database=...;" />
          </div>

          <div class="actions">
            <button class="btn btn-outline" (click)="fetchSchema()" [disabled]="isFetching || !canFetchSchema()">
              {{ isFetching ? 'Fetching schema...' : 'Fetch Schema' }}
            </button>

            <button class="btn btn-primary" (click)="saveDataSource()"
              [disabled]="saving || !canSave()">
              {{ saving ? 'Saving...' : 'Save Data Source' }}
            </button>
          </div>

          <div class="schema-feedback" *ngIf="fetchedSchema">
            <small>
              Schema fetched: {{ fetchedSchema?.tables?.length || 0 }} tables
            </small>
          </div>
        </div>
      </div>

      <div class="datasource-grid" *ngIf="dataSources && dataSources.length > 0">
        <div 
          class="datasource-card" 
          *ngFor="let datasource of dataSources"
          [class.selected]="selectedDataSource?.id === datasource.id"
          (click)="selectDataSource(datasource)"
        >
          <div class="card-header">
            <div class="datasource-icon">
              <i class="fas fa-database"></i>
            </div>
            <div class="datasource-info">
              <h4 class="datasource-name">{{ datasource.name }}</h4>
              <span class="datasource-type">{{ datasource.type }}</span>
            </div>
            <div class="selection-indicator" *ngIf="selectedDataSource?.id === datasource.id">
              <i class="fas fa-check-circle"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="no-datasources" *ngIf="!dataSources || dataSources.length === 0">
        <i class="fas fa-exclamation-triangle"></i>
        <p>No data sources available</p>
      </div>

      <div class="selection-feedback" *ngIf="selectedDataSource">
        <div class="feedback-card">
          <i class="fas fa-check"></i>
          <span>Selected: <strong>{{ selectedDataSource.name }}</strong></span>          
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./datasource-selector.component.scss']
})
export class DataSourceSelectorComponent implements OnChanges, OnInit {
    @Input() dataSources!: DataSourceInfo[] | null;
    @Input() selected: DataSourceInfo | null = null;
    @Output() dataSourceSelected = new EventEmitter<DataSourceInfo>();
    @Output() nextClicked = new EventEmitter<void>();
    @Output() dataSourceCreated = new EventEmitter<DataSourceInfo>();
    
    selectedDataSource: DataSourceInfo | null = null;

    showCreatePanel = false;
    newDs: { name: string; type: string; connectionString: string } = { name: '', type: 'sqlserver', connectionString: '' };
    fetchedSchema: SchemaInfo | null = null;
    isFetching = false;
    saving = false;

    constructor(private reportBuilderService: ReportBuilderService, private snackBar: MatSnackBar) {}

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
          this.resetCreateForm();
        }
    }

    canFetchSchema(): boolean {
      return !!this.newDs.connectionString && !!this.newDs.type && !!this.newDs.name;
    }

    fetchSchema(): void {
      if (!this.canFetchSchema()) return;
      this.isFetching = true;
      this.fetchedSchema = null;
      console.log('connection string: ', this.newDs.connectionString);
      this.reportBuilderService.introspectSchema(this.newDs.connectionString, this.newDs.type).subscribe({
        next: (schema) => {
          this.fetchedSchema = schema;
          this.isFetching = false;
          this.snackBar.open('Schema fetched', 'Close', { duration: 2500 });
        },
        error: (err) => {
          console.error(err);
          this.isFetching = false;
          this.snackBar.open('Failed to fetch schema', 'Close', { duration: 3000 });
        }
      });
    }

    canSave(): boolean {
      return !!this.newDs.name && !!this.newDs.type && !!this.newDs.connectionString && !!this.fetchedSchema;
    }

    saveDataSource(): void {
      if (!this.canSave()) return;
      this.saving = true;
      this.reportBuilderService.createDataSource({
        name: this.newDs.name,
        type: this.newDs.type,
        connectionString: this.newDs.connectionString,
        schema: this.fetchedSchema!
      }).subscribe({
        next: (created) => {
          this.saving = false;
          this.snackBar.open('Data source created', 'Close', { duration: 3000 });
          this.dataSourceCreated.emit(created);
          this.resetCreateForm();
          this.showCreatePanel = false;
        },
        error: (err) => {
          console.error(err);
          this.saving = false;
          this.snackBar.open('Failed to save data source', 'Close', { duration: 3000 });
        }
      });
    }

    private resetCreateForm(): void {
      this.newDs = { name: '', type: 'sqlserver', connectionString: '' };
      this.fetchedSchema = null;
      this.isFetching = false;
      this.saving = false;
    }
}