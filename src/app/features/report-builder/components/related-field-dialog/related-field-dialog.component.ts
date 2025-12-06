import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faProjectDiagram,
  faTable,
  faChartBar,
  faList,
  faTimes,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { RelatedTableConfig, AggregationType, FieldDataType } from '../../../../core/models/report.models';
import { SchemaInfo } from '../../../../core/models/schema-info.model';

/**
 * Data structure passed to the RelatedFieldDialogComponent.
 * Contains the schema and source table name for relationship discovery.
 */
export interface RelatedFieldDialogData {
  /** Database schema information */
  schema: SchemaInfo;
  
  /** Name of the source table to find relationships from */
  sourceTableName: string;
}

/**
 * Result structure returned by RelatedFieldDialogComponent.
 * Contains the configuration for adding a related field to the report.
 */
export interface RelatedFieldDialogResult {
  /** Configuration for the related table field */
  config: RelatedTableConfig;
  
  /** Display name for the field */
  displayName: string;
  
  /** Data type of the resulting field */
  dataType: FieldDataType;
}

/**
 * Dialog component for adding fields from related tables.
 * Allows users to select relationships and configure how related data 
 * should be displayed (as aggregated values or sub-reports).
 */
@Component({
  selector: 'app-related-field-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    FontAwesomeModule
  ],
  template: `
    <div class="related-field-dialog">
      <div class="dialog-header">
        <h2>
          <fa-icon [icon]="faProjectDiagram"></fa-icon>
          Add Related Table Field
        </h2>
        <button class="close-btn" (click)="cancel()">
          <fa-icon [icon]="faTimes"></fa-icon>
        </button>
      </div>

      <div class="dialog-content">
        <!-- Step 1: Select Relationship -->
        <div class="form-section">
          <label class="section-label">
            <fa-icon [icon]="faProjectDiagram"></fa-icon>
            Select Relationship
          </label>
          <select 
            [(ngModel)]="selectedRelationship"
            (change)="onRelationshipSelected()"
            class="form-select">
            <option [ngValue]="null">Choose a relationship...</option>
            <option 
              *ngFor="let rel of availableRelationships" 
              [ngValue]="rel">
              {{ rel.displayName || rel.name }}
              ({{ getRelationshipDescription(rel) }})
            </option>
          </select>
        </div>

        <div *ngIf="selectedRelationship">
          <!-- Step 2: Display Mode -->
          <div class="form-section">
            <label class="section-label">Display Mode</label>
            <div class="mode-selector">
              <button 
                type="button"
                class="mode-btn"
                [class.active]="config.displayMode === 'aggregate'"
                (click)="setDisplayMode('aggregate')">
                <fa-icon [icon]="faChartBar"></fa-icon>
                <div class="mode-info">
                  <strong>Aggregate</strong>
                  <span>Show a single calculated value</span>
                </div>
              </button>
              <button 
                type="button"
                class="mode-btn"
                [class.active]="config.displayMode === 'subreport'"
                (click)="setDisplayMode('subreport')">
                <fa-icon [icon]="faList"></fa-icon>
                <div class="mode-info">
                  <strong>Sub-Report</strong>
                  <span>Show nested table with related records</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Aggregate Mode Configuration -->
          <div *ngIf="config.displayMode === 'aggregate'" class="form-section">
            <label class="section-label">Field to Aggregate</label>
            <select 
              [(ngModel)]="config.relatedFieldName"
              (change)="onFieldSelected()"
              class="form-select">
              <option value="">Select a field...</option>
              <option value="*">Count of records</option>
              <option 
                *ngFor="let field of relatedTableFields" 
                [value]="field.name">
                {{ field.displayName || field.name }} ({{ field.dataType }})
              </option>
            </select>

            <label class="section-label" style="margin-top: 1rem;">Aggregation Function</label>
            <select 
              [(ngModel)]="config.aggregation"
              class="form-select"
              [disabled]="!config.relatedFieldName">
              <option [value]="'count'">Count</option>
              <option [value]="'sum'" [disabled]="!isNumericField()">Sum</option>
              <option [value]="'avg'" [disabled]="!isNumericField()">Average</option>
              <option [value]="'min'">Minimum</option>
              <option [value]="'max'">Maximum</option>
            </select>

            <label class="section-label" style="margin-top: 1rem;">Display Name</label>
            <input 
              type="text"
              [(ngModel)]="displayName"
              class="form-input"
              placeholder="e.g., Total Orders">
          </div>

          <!-- Sub-Report Mode Configuration -->
          <div *ngIf="config.displayMode === 'subreport'" class="form-section">
            <label class="section-label">Fields to Include</label>
            <div class="field-checklist">
              <label 
                *ngFor="let field of relatedTableFields"
                class="checkbox-label">
                <input 
                  type="checkbox"
                  [checked]="isFieldSelected(field.name)"
                  (change)="toggleField(field.name)">
                <span>{{ field.displayName || field.name }}</span>
                <span class="field-type-badge">{{ field.dataType }}</span>
              </label>
            </div>

            <label class="section-label" style="margin-top: 1rem;">
              Maximum Records to Show
            </label>
            <input 
              type="number"
              [(ngModel)]="config.subReportLimit"
              class="form-input"
              min="1"
              max="100"
              placeholder="10">

            <label class="section-label" style="margin-top: 1rem;">Display Name</label>
            <input 
              type="text"
              [(ngModel)]="displayName"
              class="form-input"
              placeholder="e.g., Related Orders">
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="btn btn-secondary" (click)="cancel()">
          Cancel
        </button>
        <button 
          class="btn btn-primary" 
          (click)="confirm()"
          [disabled]="!isValid()">
          <fa-icon [icon]="faCheck"></fa-icon>
          Add Field
        </button>
      </div>
    </div>
  `,
  styles: [`
    .related-field-dialog {
      display: flex;
      flex-direction: column;
      min-height: 500px;
      max-height: 80vh;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white;

      h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .close-btn {
        background: transparent;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 1.25rem;
        padding: 0.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background-color 0.2s;

        &:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      }
    }

    .dialog-content {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }

    .form-section {
      margin-bottom: 1.5rem;
    }

    .section-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .form-select,
    .form-input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      transition: all 0.2s;

      &:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }

      &:disabled {
        background: #f1f5f9;
        cursor: not-allowed;
      }
    }

    .mode-selector {
      display: flex;
      gap: 1rem;
    }

    .mode-btn {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 0.5rem;
      background: white;
      cursor: pointer;
      transition: all 0.2s;

      fa-icon {
        font-size: 2rem;
        color: #64748b;
      }

      .mode-info {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        text-align: left;

        strong {
          color: #1e293b;
          font-size: 0.875rem;
        }

        span {
          color: #64748b;
          font-size: 0.75rem;
        }
      }

      &:hover {
        border-color: #cbd5e1;
        background: #f8fafc;
      }

      &.active {
        border-color: #2563eb;
        background: #eff6ff;

        fa-icon {
          color: #2563eb;
        }

        .mode-info strong {
          color: #2563eb;
        }
      }
    }

    .field-checklist {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      padding: 0.5rem;
      background: #f8fafc;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      cursor: pointer;
      border-radius: 0.25rem;
      transition: background-color 0.2s;

      &:hover {
        background: #e2e8f0;
      }

      input[type="checkbox"] {
        cursor: pointer;
      }

      span {
        font-size: 0.875rem;
        color: #1e293b;
      }

      .field-type-badge {
        margin-left: auto;
        font-size: 0.75rem;
        color: #64748b;
        background: white;
        padding: 0.125rem 0.5rem;
        border-radius: 0.25rem;
      }
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
    }

    .btn {
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: none;

      &.btn-secondary {
        background: white;
        color: #64748b;
        border: 1px solid #e2e8f0;

        &:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
      }

      &.btn-primary {
        background: #2563eb;
        color: white;

        &:hover:not(:disabled) {
          background: #1d4ed8;
        }

        &:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
        }
      }
    }
  `]
})
export class RelatedFieldDialogComponent {
  /** FontAwesome icons */
  faProjectDiagram = faProjectDiagram;
  faTable = faTable;
  faChartBar = faChartBar;
  faList = faList;
  faTimes = faTimes;
  faCheck = faCheck;

  /** Component state */
  /** List of relationships available from the source table */
  availableRelationships: any[] = [];
  
  /** Currently selected relationship */
  selectedRelationship: any = null;
  
  /** Fields available from the related table */
  relatedTableFields: any[] = [];
  
  /** Display name for the related field */
  displayName = '';

  /** Configuration for the related table field */
  config: RelatedTableConfig = {
    relationshipId: '',
    relationshipName: '',
    relatedTableName: '',
    relatedFieldName: '',
    displayMode: 'aggregate',
    aggregation: 'count' as AggregationType,
    subReportFields: [],
    subReportLimit: 10
  };

  /**
   * Creates an instance of RelatedFieldDialogComponent.
   * Loads available relationships from the schema.
   * @param dialogRef - Reference to the Material Dialog for closing
   * @param data - Dialog data containing schema and source table name
   */
  constructor(
    public dialogRef: MatDialogRef<RelatedFieldDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RelatedFieldDialogData
  ) {
    this.loadAvailableRelationships();
  }

  /**
   * Loads relationships where the source table is either parent or child.
   * Filters the schema relationships to find relevant connections.
   * @private
   */
  private loadAvailableRelationships(): void {
    if (!this.data.schema?.relationships) {
      this.availableRelationships = [];
      return;
    }

    // Find relationships where the source table is either parent or child
    this.availableRelationships = this.data.schema.relationships.filter(rel =>
      rel.parentTable === this.data.sourceTableName ||
      rel.childTable === this.data.sourceTableName
    );
  }

  /**
   * Called when a relationship is selected from the dropdown.
   * Loads fields from the related table and initializes configuration.
   */
  onRelationshipSelected(): void {
    if (!this.selectedRelationship) return;

    const isParent = this.selectedRelationship.parentTable === this.data.sourceTableName;
    const relatedTableName = isParent
      ? this.selectedRelationship.childTable
      : this.selectedRelationship.parentTable;

    this.config.relationshipId = this.selectedRelationship.id;
    this.config.relationshipName = this.selectedRelationship.displayName || this.selectedRelationship.name;
    this.config.relatedTableName = relatedTableName;

    // Load fields from related table
    const relatedTable = this.data.schema.tables.find(t => t.name === relatedTableName);
    this.relatedTableFields = relatedTable?.columns || [];

    // Reset field selections
    this.config.relatedFieldName = '';
    this.config.subReportFields = [];
  }

  /**
   * Called when a field is selected for aggregation.
   * Auto-generates display name based on field and aggregation.
   */
  onFieldSelected(): void {
    // Auto-generate display name if empty
    if (!this.displayName && this.config.relatedFieldName) {
      const fieldName = this.config.relatedFieldName === '*' 
        ? 'Count' 
        : this.relatedTableFields.find(f => f.name === this.config.relatedFieldName)?.displayName || this.config.relatedFieldName;
      const aggName = this.config.aggregation ? this.formatAggregationName(this.config.aggregation) : '';
      this.displayName = `${aggName} ${fieldName} (${this.config.relatedTableName})`;
    }
  }

  /**
   * Sets the display mode for related data.
   * @param mode - 'aggregate' for single value or 'subreport' for nested table
   */
  setDisplayMode(mode: 'aggregate' | 'subreport'): void {
    this.config.displayMode = mode;
    
    // Set defaults based on mode
    if (mode === 'aggregate') {
      this.config.aggregation = 'count' as AggregationType;
      this.config.subReportFields = [];
    } else {
      this.config.subReportLimit = 10;
    }
  }

  /**
   * Checks if a field is selected for sub-report mode.
   * @param fieldName - Name of the field to check
   * @returns True if the field is selected, false otherwise
   */
  isFieldSelected(fieldName: string): boolean {
    return this.config.subReportFields?.includes(fieldName) || false;
  }

  /**
   * Toggles the selection of a field for sub-report mode.
   * @param fieldName - Name of the field to toggle
   */
  toggleField(fieldName: string): void {
    if (!this.config.subReportFields) {
      this.config.subReportFields = [];
    }

    const index = this.config.subReportFields.indexOf(fieldName);
    if (index > -1) {
      this.config.subReportFields.splice(index, 1);
    } else {
      this.config.subReportFields.push(fieldName);
    }
  }

  /**
   * Checks if the selected related field has a numeric data type.
   * @returns True if the field is numeric, false otherwise
   */
  isNumericField(): boolean {
    if (!this.config.relatedFieldName || this.config.relatedFieldName === '*') {
      return false;
    }

    const field = this.relatedTableFields.find(f => f.name === this.config.relatedFieldName);
    const numericTypes = ['number', 'smallint', 'bigint', 'float', 'double', 'decimal', 'numeric', 'money', 'currency'];
    return field && numericTypes.includes(field.normalizedType || field.dataType);
  }

  /**
   * Generates a description string for a relationship.
   * Shows the direction and target table.
   * @param rel - The relationship object
   * @returns Formatted description string
   */
  getRelationshipDescription(rel: any): string {
    const isParent = rel.parentTable === this.data.sourceTableName;
    const direction = isParent ? '→' : '←';
    const otherTable = isParent ? rel.childTable : rel.parentTable;
    return `${direction} ${otherTable}`;
  }

  /**
   * Formats an aggregation type name for display.
   * @param agg - Aggregation type string
   * @returns Formatted aggregation name
   */
  formatAggregationName(agg: string): string {
    const names: Record<string, string> = {
      'count': 'Count of',
      'sum': 'Total',
      'avg': 'Average',
      'min': 'Minimum',
      'max': 'Maximum'
    };
    return names[agg] || agg;
  }

  /**
   * Validates that all required fields are filled.
   * @returns True if configuration is valid, false otherwise
   */
  isValid(): boolean {
    if (!this.selectedRelationship || !this.displayName) {
      return false;
    }

    if (this.config.displayMode === 'aggregate') {
      return !!this.config.relatedFieldName && !!this.config.aggregation;
    } else {
      return (this.config.subReportFields?.length || 0) > 0;
    }
  }

  /**
   * Confirms the dialog and returns the configured related field.
   * Determines the appropriate data type and creates the result object.
   */
  confirm(): void {
    if (!this.isValid()) return;

    // Determine the data type for the result field
    let dataType: FieldDataType;
    if (this.config.displayMode === 'aggregate') {
      if (this.config.aggregation === 'count') {
        dataType = FieldDataType.NUMBER;
      } else {
        const field = this.relatedTableFields.find(f => f.name === this.config.relatedFieldName);
        dataType = this.mapDataType(field?.normalizedType || field?.dataType || 'string');
      }
    } else {
      dataType = FieldDataType.STRING; // Sub-reports will be rendered as nested tables
    }

    const result: RelatedFieldDialogResult = {
      config: this.config,
      displayName: this.displayName,
      dataType
    };

    this.dialogRef.close(result);
  }

  /**
   * Cancels the dialog without saving.
   */
  cancel(): void {
    this.dialogRef.close(null);
  }

  /**
   * Maps a database data type string to FieldDataType enum.
   * @param type - Database type string
   * @returns Corresponding FieldDataType
   * @private
   */
  private mapDataType(type: string): FieldDataType {
    const typeMap: Record<string, FieldDataType> = {
      'string': FieldDataType.STRING,
      'number': FieldDataType.NUMBER,
      'date': FieldDataType.DATE,
      'datetime': FieldDataType.DATE,
      'boolean': FieldDataType.BOOLEAN,
      'currency': FieldDataType.CURRENCY,
      'money': FieldDataType.MONEY,
      'smallint': FieldDataType.SMALLINT,
      'bigint': FieldDataType.BIGINT,
      'float': FieldDataType.FLOAT,
      'double': FieldDataType.DOUBLE,
      'decimal': FieldDataType.DECIMAL,
      'numeric': FieldDataType.NUMERIC
    };
    return typeMap[type] || FieldDataType.STRING;
  }
}

