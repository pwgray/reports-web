import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, OnInit } from "@angular/core";
import { DataSourceInfo } from "../../../../core/models/data-source-info.model";
import { Observable } from "rxjs";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-datasource-selector',
  imports: [CommonModule],
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
    // When editing an existing report, seed the selection from the report's saved data source
    @Input() selected: DataSourceInfo | null = null;
    @Output() dataSourceSelected = new EventEmitter<DataSourceInfo>();
    @Output() nextClicked = new EventEmitter<void>();
    
    selectedDataSource: DataSourceInfo | null = null;

    ngOnInit(): void {
        console.log('DataSourceSelectorComponent ngOnInit', this.selected);
        if(this.selected) {
            this.selectedDataSource = this.selected;
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        // Prefer explicit selected input when provided
        if (changes['selected']) {
            this.selectedDataSource = this.selected || null;
        }
        // If selection not yet set and dataSources list arrives later, try to match by id
        if (!this.selectedDataSource && changes['dataSources'] && this.selected && Array.isArray(this.dataSources)) {
            const match = this.dataSources?.find(ds => ds.id === this.selected!.id);
            if (match) {
                this.selectedDataSource = match;
            } else {
                this.selectedDataSource = this.selected; // fallback to provided object
            }
        }
        // Emit selection so parent can react (e.g., load schema)
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
}