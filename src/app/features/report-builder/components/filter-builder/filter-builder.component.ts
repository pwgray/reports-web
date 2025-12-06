import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from "@angular/core";
import { SelectedField, FilterCondition, FilterOperator, FieldDataType } from "../../../../core/models/report.models";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatChipsModule } from "@angular/material/chips";
import { MatTooltipModule } from "@angular/material/tooltip";
import { trigger, transition, style, animate } from '@angular/animations';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

/**
 * Component for building and managing filter conditions for reports.
 * Supports multiple filter conditions with AND/OR logic, various operators
 * (equals, contains, greater than, between, in list, etc.), and type-aware
 * value inputs with validation. Provides real-time filter preview and summary.
 */
// features/report-builder/components/filter-builder/filter-builder.component.ts
@Component({
    selector: 'app-filter-builder',
    standalone: true,
    imports: [
      CommonModule,
      FormsModule, 
      MatSelectModule,
      MatOptionModule,
      MatButtonModule,
      MatIconModule,
      MatChipsModule,
      MatTooltipModule,
      FontAwesomeModule
    ],
    template: `
    <div class="filter-builder">
      <div class="filter-header">
        <div class="header-content">
          <h3>Filter Your Data</h3>
          <p class="help-text">Define conditions to show only the records you need</p>
        </div>
        <div class="filter-stats" *ngIf="filters.length > 0">
          <span class="filter-count">{{ filters.length }} filter{{ filters.length > 1 ? 's' : '' }} active</span>
        </div>
      </div>

      <div class="filter-list">
        <!-- Filter Group with AND/OR Logic -->
        <div class="filter-group" *ngIf="filters.length > 0">
          <div class="logic-selector" *ngIf="filters.length > 1">
            <label>Match:</label>
            <div class="logic-buttons">
              <button 
                class="logic-btn"
                [class.active]="filterLogic === 'AND'"
                (click)="filterLogic = 'AND'; onFilterChanged()"
                matTooltip="All conditions must be true">
                ALL conditions
              </button>
              <button 
                class="logic-btn"
                [class.active]="filterLogic === 'OR'"
                (click)="filterLogic = 'OR'; onFilterChanged()"
                matTooltip="At least one condition must be true">
                ANY condition
              </button>
            </div>
          </div>

          <!-- Filter Rows -->
          <div 
            *ngFor="let filter of filters; let i = index; let isLast = last"
            class="filter-row-container"
            [@slideIn]>
            
            <!-- Logic Connector -->
            <div class="logic-connector" *ngIf="!isLast && filters.length > 1">
              <span class="logic-label">{{ filterLogic }}</span>
            </div>

            <div class="filter-row" [class.valid]="isFilterValid(filter)" [class.invalid]="!isFilterValid(filter) && filter.field">
              <div class="filter-content">
                <!-- Field Selection -->
                <div class="filter-field">
                  <label class="field-label">Field</label>
                  <select 
                    [(ngModel)]="filter.field"
                    (change)="onFilterFieldChanged(filter, i)"
                    class="filter-select">
                    <option [ngValue]="null">Select field...</option>
                    <option 
                      *ngFor="let field of availableFields"
                      [ngValue]="field">
                      {{ field.displayName }} ({{ getFieldTypeDisplay(field.dataType) }})
                    </option>
                  </select>
                </div>

                <!-- Operator Selection -->
                <div class="filter-operator" *ngIf="filter.field">
                  <label class="field-label">Condition</label>
                  <select 
                    [(ngModel)]="filter.operator"
                    (change)="onFilterOperatorChanged(filter)"
                    class="filter-select">
                    <option 
                      *ngFor="let op of getAvailableOperators(filter.field)"
                      [value]="op.value">
                      {{ op.label }}
                    </option>
                  </select>
                </div>

                <!-- Value Input -->
                <div class="filter-value" *ngIf="filter.field && filter.operator && needsValueInput(filter.operator)">
                  <label class="field-label">Value</label>
                  
                  <!-- Text input -->
                  <div *ngIf="getValueInputType(filter) === 'text'" class="input-wrapper">
                    <input 
                      type="text"
                      [(ngModel)]="filter.value"
                      (ngModelChange)="onFilterChanged()"
                      [placeholder]="getValuePlaceholder(filter)"
                      [class.invalid-value]="!isValueValidForType(filter)"
                      class="filter-input">
                    <div class="input-hint" *ngIf="getInputHint(filter)">
                      <mat-icon class="hint-icon">info</mat-icon>
                      <span>{{ getInputHint(filter) }}</span>
                    </div>
                  </div>

                  <!-- Number input -->
                  <div *ngIf="getValueInputType(filter) === 'number'" class="input-wrapper">
                    <input 
                      type="number"
                      [(ngModel)]="filter.value"
                      (ngModelChange)="onFilterChanged()"
                      [placeholder]="getValuePlaceholder(filter)"
                      [class.invalid-value]="!isValueValidForType(filter)"
                      class="filter-input"
                      step="any">
                    <div class="input-hint" *ngIf="getInputHint(filter)">
                      <mat-icon class="hint-icon">info</mat-icon>
                      <span>{{ getInputHint(filter) }}</span>
                    </div>
                    <div class="type-error" *ngIf="filter.value && !isValueValidForType(filter)">
                      <mat-icon class="error-icon">error</mat-icon>
                      <span>Please enter a valid number</span>
                    </div>
                  </div>

                  <!-- Date input -->
                  <input 
                    *ngIf="getValueInputType(filter) === 'date'"
                    type="date"
                    [(ngModel)]="filter.value"
                    (ngModelChange)="onFilterChanged()"
                    class="filter-input">

                  <!-- Date range -->
                  <div *ngIf="getValueInputType(filter) === 'daterange'" class="range-inputs">
                    <input 
                      type="date"
                      [(ngModel)]="filter.value.start"
                      (ngModelChange)="onFilterChanged()"
                      placeholder="Start date"
                      class="filter-input range-start">
                    <span class="range-separator">to</span>
                    <input 
                      type="date"
                      [(ngModel)]="filter.value.end"
                      (ngModelChange)="onFilterChanged()"
                      placeholder="End date"
                      class="filter-input range-end">
                  </div>

                  <!-- Number range -->
                  <div *ngIf="getValueInputType(filter) === 'numberrange'" class="range-inputs">
                    <input 
                      type="number"
                      [(ngModel)]="filter.value.start"
                      (ngModelChange)="onFilterChanged()"
                      placeholder="Min"
                      class="filter-input range-start">
                    <span class="range-separator">to</span>
                    <input 
                      type="number"
                      [(ngModel)]="filter.value.end"
                      (ngModelChange)="onFilterChanged()"
                      placeholder="Max"
                      class="filter-input range-end">
                  </div>

                  <!-- Multi-select for IN_LIST -->
                  <div *ngIf="getValueInputType(filter) === 'multiselect'" class="multi-select-container">
                    <mat-select 
                      [(ngModel)]="filter.value"
                      (selectionChange)="onFilterChanged()"
                      multiple
                      placeholder="Select values..."
                      class="filter-select">
                      <mat-option 
                        *ngFor="let option of getFieldOptions(filter.field)"
                        [value]="option.value">
                        {{ option.label }}
                      </mat-option>
                    </mat-select>
                    <div class="multi-select-note" *ngIf="!getFieldOptions(filter.field).length">
                      <small>Enter comma-separated values or load from data</small>
                    </div>
                  </div>

                  <!-- CSV Input for IN_LIST when no options available -->
                  <input 
                    *ngIf="getValueInputType(filter) === 'csv'"
                    type="text"
                    [(ngModel)]="filter.value"
                    (ngModelChange)="onFilterChanged()"
                    [placeholder]="getValuePlaceholder(filter)"
                    class="filter-input"
                    matTooltip="Enter multiple values separated by commas">
                </div>

                <!-- Remove Button -->
                <button 
                  class="remove-filter-btn"
                  (click)="removeFilter(i)"
                  matTooltip="Remove this filter"
                  type="button">
                  <mat-icon>close</mat-icon>
                </button>
              </div>

              <!-- Filter Preview/Summary -->
              <div class="filter-preview" *ngIf="isFilterValid(filter) && filter.displayText">
                <mat-icon class="preview-icon">check_circle</mat-icon>
                <div class="preview-content">
                  <span class="preview-label">Filter:</span>
                  <span class="preview-text">{{ filter.displayText }}</span>
                </div>
              </div>

              <!-- Validation Message -->
              <div class="filter-validation" *ngIf="!isFilterValid(filter) && filter.field">
                <mat-icon class="warning-icon">warning</mat-icon>
                <span>{{ getValidationMessage(filter) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Add Filter Button -->
        <div class="add-filter-section">
          <button 
            class="add-filter-btn"
            (click)="addFilter()"
            [disabled]="!availableFields.length"
            type="button">
            <mat-icon>add_circle</mat-icon>
            <span>Add Filter Condition</span>
          </button>
        </div>

        <!-- No filters message -->
        <div *ngIf="filters.length === 0" class="no-filters-state">
          <div class="empty-state-icon">
            <mat-icon>filter_alt</mat-icon>
          </div>
          <h4>No Filters Applied</h4>
          <p>All records from your data source will be included in the report.</p>
          <p class="hint-text">Click "Add Filter Condition" to start filtering your data.</p>
        </div>

        <!-- Filter Summary -->
        <div class="filter-summary" *ngIf="filters.length > 0">
          <div class="summary-header">
            <mat-icon>summarize</mat-icon>
            <strong>Filter Summary:</strong>
          </div>
          <div class="summary-content">
            <p>{{ getFilterSummary() }}</p>
          </div>
          <button 
            class="clear-all-btn"
            (click)="clearAllFilters()"
            type="button"
            matTooltip="Remove all filters">
            <mat-icon>clear_all</mat-icon>
            Clear All Filters
          </button>
        </div>
      </div>
    </div>
  `,
    styleUrls: ['./filter-builder.component.scss'],
    animations: [
        trigger('slideIn', [
            transition(':enter', [
                style({ transform: 'translateY(-20px)', opacity: 0 }),
                animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ transform: 'translateY(-20px)', opacity: 0 }))
            ])
        ])
    ]
})
export class FilterBuilderComponent implements OnInit, OnChanges {
    /** Available fields that can be used in filter conditions */
    @Input() availableFields: SelectedField[] = [];
    
    /** Current filter conditions */
    @Input() filters: FilterCondition[] = [];
    
    /** Event emitted when filters change */
    @Output() filtersChanged = new EventEmitter<FilterCondition[]>();

    /** Logic operator for combining multiple filters: 'AND' or 'OR' */
    filterLogic: 'AND' | 'OR' = 'AND';

    ngOnInit(): void {
        this.syncFieldReferences();
        // Initialize any filters that don't have display text
        this.filters.forEach(filter => {
            if (!filter.displayText) {
                this.updateFilterDisplayText(filter);
            }
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        // When availableFields changes, sync the field references in existing filters
        if (changes['availableFields'] && this.availableFields.length > 0) {
            this.syncFieldReferences();
        }
    }

    /**
     * Sync filter field references with availableFields to ensure dropdown selection works
     */
    private syncFieldReferences(): void {
        if (!this.availableFields.length || !this.filters.length) return;

        this.filters.forEach(filter => {
            if (filter.field) {
                // Find the matching field in availableFields by id, tableName, and fieldName
                const matchingField = this.availableFields.find(f => 
                    f.id === filter.field.id || 
                    (f.tableName === filter.field.tableName && f.fieldName === filter.field.fieldName)
                );

                // Replace with the reference from availableFields if found
                if (matchingField) {
                    filter.field = matchingField;
                }
            }
        });
    }

    addFilter(): void {
        const newFilter: FilterCondition = {
            id: this.generateId(),
            field: null as any,
            operator: FilterOperator.EQUALS,
            value: null,
            displayText: ''
        };

        this.filters = [...this.filters, newFilter];
        this.emitChanges();
    }

    removeFilter(index: number): void {
        this.filters = this.filters.filter((_, i) => i !== index);
        this.emitChanges();
    }

    clearAllFilters(): void {
        if (confirm('Are you sure you want to remove all filters?')) {
            this.filters = [];
            this.emitChanges();
        }
    }

    onFilterFieldChanged(filter: FilterCondition, index: number): void {
        // Reset operator and value when field changes
        filter.operator = this.getDefaultOperator(filter.field);
        filter.value = this.initializeValueForOperator(filter.operator);
        this.updateFilterDisplayText(filter);
        this.emitChanges();
    }

    onFilterOperatorChanged(filter: FilterCondition): void {
        // Initialize appropriate value structure for operator
        filter.value = this.initializeValueForOperator(filter.operator);
        this.updateFilterDisplayText(filter);
        this.emitChanges();
    }

    onFilterChanged(): void {
        this.filters.forEach(filter => this.updateFilterDisplayText(filter));
        this.emitChanges();
    }

    private emitChanges(): void {
        this.filtersChanged.emit(this.filters);
    }

    getDefaultOperator(field: SelectedField): FilterOperator {
        if (!field) return FilterOperator.EQUALS;
        
        switch (field.dataType) {
            case FieldDataType.STRING:
                return FilterOperator.CONTAINS;
            case FieldDataType.DATE:
                return FilterOperator.EQUALS;
            case FieldDataType.NUMBER:
            case FieldDataType.CURRENCY:
            case FieldDataType.FLOAT:
            case FieldDataType.DOUBLE:
            case FieldDataType.DECIMAL:
                return FilterOperator.EQUALS;
            default:
                return FilterOperator.EQUALS;
        }
    }

    initializeValueForOperator(operator: FilterOperator): any {
        if (operator === FilterOperator.BETWEEN) {
            return { start: null, end: null };
        }
        if (operator === FilterOperator.IN_LIST) {
            return [];
        }
        return null;
    }

    getAvailableOperators(field: SelectedField): Array<{ value: FilterOperator, label: string }> {
        const baseOperators = [
            { value: FilterOperator.EQUALS, label: 'equals' },
            { value: FilterOperator.NOT_EQUALS, label: 'does not equal' }
        ];

        const dataType = field.dataType.toString().toLowerCase();

        if (dataType === 'string' || dataType === FieldDataType.STRING.toLowerCase()) {
            return [
                ...baseOperators,
                { value: FilterOperator.CONTAINS, label: 'contains' },
                { value: FilterOperator.STARTS_WITH, label: 'starts with' },
                { value: FilterOperator.IN_LIST, label: 'is one of' }
            ];
        }
        
        if (dataType === 'number' || dataType === 'currency' || 
            dataType === 'float' || dataType === 'double' || 
            dataType === 'decimal' || dataType === 'numeric' ||
            dataType === 'smallint' || dataType === 'bigint' || dataType === 'money') {
            return [
                ...baseOperators,
                { value: FilterOperator.GREATER_THAN, label: 'is greater than' },
                { value: FilterOperator.LESS_THAN, label: 'is less than' },
                { value: FilterOperator.BETWEEN, label: 'is between' },
                { value: FilterOperator.IN_LIST, label: 'is one of' }
            ];
        }
        
        if (dataType === 'date') {
            return [
                ...baseOperators,
                { value: FilterOperator.GREATER_THAN, label: 'is after' },
                { value: FilterOperator.LESS_THAN, label: 'is before' },
                { value: FilterOperator.BETWEEN, label: 'is between' }
            ];
        }
        
        return baseOperators;
    }

    getValueInputType(filter: FilterCondition): string {
        if (!filter.field) return 'text';

        if (filter.operator === FilterOperator.BETWEEN) {
            const dataType = filter.field.dataType.toString().toLowerCase();
            return dataType === 'date' ? 'daterange' : 'numberrange';
        }

        if (filter.operator === FilterOperator.IN_LIST) {
            // Check if we have predefined options
            const options = this.getFieldOptions(filter.field);
            return options.length > 0 ? 'multiselect' : 'csv';
        }

        const dataType = filter.field.dataType.toString().toLowerCase();
        if (dataType === 'date') return 'date';
        if (dataType === 'number' || dataType === 'currency' || 
            dataType === 'float' || dataType === 'double' || 
            dataType === 'decimal' || dataType === 'numeric' ||
            dataType === 'smallint' || dataType === 'bigint' || dataType === 'money') {
            return 'number';
        }
        return 'text';
    }

    getValuePlaceholder(filter: FilterCondition): string {
        if (!filter.field || !filter.operator) return '';

        const dataType = filter.field.dataType.toString().toLowerCase();
        
        if (filter.operator === FilterOperator.IN_LIST) {
            return 'Enter values separated by commas (e.g., value1, value2, value3)';
        }

        switch (dataType) {
            case 'string':
                if (filter.operator === FilterOperator.CONTAINS) return 'Enter text to search for...';
                if (filter.operator === FilterOperator.STARTS_WITH) return 'Enter beginning text...';
                return 'Enter value...';
            case 'number':
            case 'currency':
            case 'float':
            case 'double':
            case 'decimal':
            case 'numeric':
            case 'smallint':
            case 'bigint':
            case 'money':
                return 'Enter number...';
            case 'date':
                return 'Select date...';
            default:
                return 'Enter value...';
        }
    }

    getFieldOptions(field: SelectedField): Array<{ value: any, label: string }> {
        // This could be enhanced to fetch actual distinct values from the backend
        // For now, return empty array - the component will show CSV input instead
        // TODO: Implement API call to fetch distinct values for the field
        return [];
    }

    needsValueInput(operator: FilterOperator): boolean {
        // Some operators like IS_NULL, IS_NOT_NULL don't need value input
        // For now, all our operators need values
        return true;
    }

    isFilterValid(filter: FilterCondition): boolean {
        if (!filter.field || !filter.operator) return false;
        
        if (!this.needsValueInput(filter.operator)) return true;

        if (filter.operator === FilterOperator.BETWEEN) {
            return filter.value?.start != null && filter.value?.end != null;
        }

        if (filter.operator === FilterOperator.IN_LIST) {
            if (Array.isArray(filter.value)) {
                return filter.value.length > 0;
            }
            if (typeof filter.value === 'string') {
                return filter.value.trim().length > 0;
            }
            return false;
        }

        const hasValue = filter.value != null && filter.value !== '';
        const isValidType = this.isValueValidForType(filter);
        
        return hasValue && isValidType;
    }

    /**
     * Validate that the entered value matches the field's data type
     */
    isValueValidForType(filter: FilterCondition): boolean {
        if (!filter.field || !filter.value) return true; // Don't validate empty values

        const dataType = filter.field.dataType.toString().toLowerCase();
        const value = filter.value;

        // For number types, ensure the value is actually a number
        if (dataType === 'number' || dataType === 'currency' || 
            dataType === 'float' || dataType === 'double' || 
            dataType === 'decimal' || dataType === 'numeric' ||
            dataType === 'smallint' || dataType === 'bigint' || 
            dataType === 'money' || dataType === 'integer') {
            
            if (filter.operator === FilterOperator.BETWEEN) {
                const startValid = !isNaN(Number(value.start));
                const endValid = !isNaN(Number(value.end));
                return startValid && endValid;
            }
            
            if (filter.operator === FilterOperator.IN_LIST) {
                if (Array.isArray(value)) {
                    return value.every(v => !isNaN(Number(v)));
                }
                if (typeof value === 'string') {
                    const values = value.split(',').map(v => v.trim());
                    return values.every(v => !isNaN(Number(v)));
                }
            }
            
            // Check if value is a valid number
            return !isNaN(Number(value));
        }

        // For date types, ensure it's a valid date
        if (dataType === 'date' || dataType === 'datetime') {
            if (filter.operator === FilterOperator.BETWEEN) {
                const startValid = !isNaN(new Date(value.start).getTime());
                const endValid = !isNaN(new Date(value.end).getTime());
                return startValid && endValid;
            }
            return !isNaN(new Date(value).getTime());
        }

        return true; // String and other types are always valid
    }

    /**
     * Get helpful hint text for the input based on field type
     */
    getInputHint(filter: FilterCondition): string {
        if (!filter.field) return '';

        const dataType = filter.field.dataType.toString().toLowerCase();
        
        if (dataType === 'number' || dataType === 'currency' || 
            dataType === 'float' || dataType === 'double' || 
            dataType === 'decimal' || dataType === 'numeric' ||
            dataType === 'smallint' || dataType === 'bigint' || 
            dataType === 'money' || dataType === 'integer') {
            
            if (filter.operator === FilterOperator.IN_LIST) {
                return 'Enter numbers separated by commas (e.g., 10, 20, 30)';
            }
            return 'Enter numeric values only';
        }

        if (dataType === 'date' || dataType === 'datetime') {
            return 'Select or enter a valid date';
        }

        return '';
    }

    private updateFilterDisplayText(filter: FilterCondition): void {
        if (!filter.field || !filter.operator) {
            filter.displayText = '';
            return;
        }

        const fieldName = filter.field.displayName;
        const operatorText = this.getOperatorDisplayText(filter.operator);
        const valueText = this.getValueDisplayText(filter);

        if (!this.needsValueInput(filter.operator)) {
            filter.displayText = `${fieldName} ${operatorText}`;
        } else if (valueText) {
            filter.displayText = `${fieldName} ${operatorText} ${valueText}`;
        } else {
            filter.displayText = `${fieldName} ${operatorText} (incomplete)`;
        }
    }

    getValueDisplayText(filter: FilterCondition): string {
        if (!this.isFilterValid(filter)) return '';

        if (filter.operator === FilterOperator.BETWEEN) {
            const dataType = filter.field.dataType.toString().toLowerCase();
            if (dataType === 'date') {
                return `${this.formatDate(filter.value.start)} and ${this.formatDate(filter.value.end)}`;
            }
            return `${filter.value.start} and ${filter.value.end}`;
        }

        if (filter.operator === FilterOperator.IN_LIST) {
            if (Array.isArray(filter.value)) {
                return filter.value.length > 3 
                    ? `${filter.value.slice(0, 3).join(', ')}... (${filter.value.length} values)`
                    : filter.value.join(', ');
            }
            if (typeof filter.value === 'string') {
                const values = filter.value.split(',').map(v => v.trim()).filter(v => v);
                return values.length > 3
                    ? `${values.slice(0, 3).join(', ')}... (${values.length} values)`
                    : values.join(', ');
            }
        }

        const dataType = filter.field.dataType.toString().toLowerCase();
        if (dataType === 'date') {
            return this.formatDate(filter.value);
        }

        return String(filter.value);
    }

    getOperatorDisplayText(operator: FilterOperator): string {
        const operatorMap: { [key: string]: string } = {
            [FilterOperator.EQUALS]: 'equals',
            [FilterOperator.NOT_EQUALS]: 'does not equal',
            [FilterOperator.CONTAINS]: 'contains',
            [FilterOperator.STARTS_WITH]: 'starts with',
            [FilterOperator.GREATER_THAN]: 'is greater than',
            [FilterOperator.LESS_THAN]: 'is less than',
            [FilterOperator.BETWEEN]: 'is between',
            [FilterOperator.IN_LIST]: 'is one of'
        };
        return operatorMap[operator] || operator;
    }

    getFieldTypeDisplay(dataType: FieldDataType | string): string {
        const typeMap: { [key: string]: string } = {
            'string': 'Text',
            'number': 'Number',
            'date': 'Date',
            'boolean': 'Yes/No',
            'currency': 'Currency',
            'float': 'Decimal',
            'double': 'Decimal',
            'decimal': 'Decimal',
            'numeric': 'Number',
            'smallint': 'Number',
            'bigint': 'Number',
            'money': 'Currency'
        };
        return typeMap[dataType.toString().toLowerCase()] || 'Text';
    }

    getFilterSummary(): string {
        const validFilters = this.filters.filter(f => this.isFilterValid(f));
        if (validFilters.length === 0) return 'No complete filters defined yet.';
        if (validFilters.length === 1) return validFilters[0].displayText;
        
        const logic = this.filterLogic.toLowerCase();
        return `Show records where ${validFilters.map(f => f.displayText).join(` ${logic} `)}`;
    }

    private formatDate(dateValue: any): string {
        if (!dateValue) return '';
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return String(dateValue);
        return date.toLocaleDateString();
    }

    /**
     * Get specific validation message based on what's wrong with the filter
     */
    getValidationMessage(filter: FilterCondition): string {
        if (!filter.field) return 'Select a field';
        if (!filter.operator) return 'Select a condition';
        
        if (!filter.value && this.needsValueInput(filter.operator)) {
            return 'Enter a value';
        }

        if (filter.value && !this.isValueValidForType(filter)) {
            const dataType = filter.field.dataType.toString().toLowerCase();
            if (dataType.includes('number') || dataType.includes('int') || 
                dataType === 'currency' || dataType === 'decimal' || 
                dataType === 'float' || dataType === 'double' || dataType === 'money') {
                return 'Please enter a valid number (letters are not allowed)';
            }
            if (dataType === 'date' || dataType === 'datetime') {
                return 'Please enter a valid date';
            }
        }

        if (filter.operator === FilterOperator.BETWEEN) {
            if (!filter.value?.start) return 'Enter start value';
            if (!filter.value?.end) return 'Enter end value';
        }

        if (filter.operator === FilterOperator.IN_LIST) {
            if (Array.isArray(filter.value) && filter.value.length === 0) {
                return 'Select at least one value';
            }
            if (typeof filter.value === 'string' && filter.value.trim().length === 0) {
                return 'Enter at least one value';
            }
        }

        return 'Please complete all required fields';
    }

    private generateId(): string {
        return `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}