import { Component, Input, Output, EventEmitter } from "@angular/core";
import { SelectedField, FilterCondition, FilterOperator } from "../../../../core/models/report.models";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatOptionModule } from "@angular/material/core";
import { trigger, transition, style, animate } from '@angular/animations';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

// features/report-builder/components/filter-builder/filter-builder.component.ts
@Component({
    selector: 'app-filter-builder',
    imports: [
      CommonModule,
        FormsModule, 
        MatOptionModule, 
        FontAwesomeModule
      ],
    template: `
    <div class="filter-builder">
      <div class="filter-header">
        <h3>Filter your data</h3>
        <p class="help-text">Only show records that meet certain conditions</p>
      </div>

      <div class="filter-list">
        <div 
          *ngFor="let filter of filters; let i = index"
          class="filter-row"
          [@slideIn]>
          
          <div class="filter-content">
            <!-- Field Selection -->
            <div class="filter-field">
              <label>Show records where</label>
              <select 
                [(ngModel)]="filter.field"
                (change)="onFilterFieldChanged(filter, i)">
                <option value="">Select field...</option>
                <option 
                  *ngFor="let field of availableFields"
                  [ngValue]="field">
                  {{ field.displayName }}
                </option>
              </select>
            </div>

            <!-- Operator Selection -->
            <div class="filter-operator" *ngIf="filter.field">
              <select 
                [(ngModel)]="filter.operator"
                (change)="onFilterChanged()">
                <option 
                  *ngFor="let op of getAvailableOperators(filter.field)"
                  [value]="op.value">
                  {{ op.label }}
                </option>
              </select>
            </div>

            <!-- Value Input -->
            <div class="filter-value" *ngIf="filter.field && filter.operator">
              <!-- Text input -->
              <input 
                *ngIf="getValueInputType(filter) === 'text'"
                type="text"
                [(ngModel)]="filter.value"
                (change)="onFilterChanged()"
                [placeholder]="getValuePlaceholder(filter)">

              <!-- Number input -->
              <input 
                *ngIf="getValueInputType(filter) === 'number'"
                type="number"
                [(ngModel)]="filter.value"
                (change)="onFilterChanged()">

              <!-- Date input -->
              <input 
                *ngIf="getValueInputType(filter) === 'date'"
                type="date"
                [(ngModel)]="filter.value"
                (change)="onFilterChanged()">

              <!-- Date range -->
              <div *ngIf="getValueInputType(filter) === 'daterange'" class="date-range">
                <input 
                  type="date"
                  [(ngModel)]="filter.value.start"
                  (change)="onFilterChanged()"
                  placeholder="Start date">
                <span>to</span>
                <input 
                  type="date"
                  [(ngModel)]="filter.value.end"
                  (change)="onFilterChanged()"
                  placeholder="End date">
              </div>

              <!-- Multi-select -->
              <div *ngIf="getValueInputType(filter) === 'multiselect'" class="multi-select">
                <mat-select 
                  [(ngModel)]="filter.value"
                  (selectionChange)="onFilterChanged()"
                  multiple>
                  <mat-option 
                    *ngFor="let option of getFieldOptions(filter.field)"
                    [value]="option.value">
                    {{ option.label }}
                  </mat-option>
                </mat-select>
              </div>
            </div>

            <!-- Remove Button -->
            <button 
              class="remove-filter-btn"
              (click)="removeFilter(i)"
              title="Remove this filter">
              <i class="icon-close">X</i>
            </button>
          </div>

          <!-- Filter Preview -->
          <div class="filter-preview" *ngIf="filter.displayText">
            <small>{{ filter.displayText }}</small>
          </div>
        </div>

        <!-- Add Filter Button -->
        <button 
          class="add-filter-btn"
          (click)="addFilter()"
          [disabled]="!availableFields.length">
          <i class="icon-plus">+</i>
          Add Filter
        </button>

        <!-- No filters message -->
        <div *ngIf="filters.length === 0" class="no-filters">
          <i class="icon-info">Info</i>
          <p>No filters applied. All records will be included in your report.</p>
        </div>
      </div>
    </div>
  `,
    styleUrls: ['./filter-builder.component.scss'],
    animations: [
        trigger('slideIn', [
            transition(':enter', [
                style({ transform: 'translateX(-100%)', opacity: 0 }),
                animate('300ms ease-in', style({ transform: 'translateX(0%)', opacity: 1 }))
            ])
        ])
    ]
})
export class FilterBuilderComponent {
    getFieldOptions(arg0: SelectedField): any {
        return [];
    }
    getValuePlaceholder(_t8: FilterCondition) {
        return '';
    }
    @Input() availableFields: SelectedField[] = [];
    @Input() filters: FilterCondition[] = [];
    @Output() filtersChanged = new EventEmitter<FilterCondition[]>();

    addFilter(): void {
        const newFilter: FilterCondition = {
            id: this.generateId(),
            field: null as any,
            operator: FilterOperator.EQUALS,
            value: null,
            displayText: ''
        };

        this.filters = [...this.filters, newFilter];
        this.filtersChanged.emit(this.filters);
    }

    removeFilter(index: number): void {
        this.filters = this.filters.filter((_, i) => i !== index);
        this.filtersChanged.emit(this.filters);
    }

    onFilterFieldChanged(filter: FilterCondition, index: number): void {
        // Reset operator and value when field changes
        filter.operator = this.getDefaultOperator(filter.field);
        filter.value = null;
        this.updateFilterDisplayText(filter);
        this.onFilterChanged();
    }
    getDefaultOperator(field: SelectedField): FilterOperator {
        return FilterOperator.EQUALS;
    }

    onFilterChanged(): void {
        this.filters.forEach(filter => this.updateFilterDisplayText(filter));
        this.filtersChanged.emit(this.filters);
    }

    getAvailableOperators(field: SelectedField): Array<{ value: FilterOperator, label: string }> {
        const baseOperators = [
            { value: FilterOperator.EQUALS, label: 'equals' },
            { value: FilterOperator.NOT_EQUALS, label: 'does not equal' }
        ];

        switch (field.dataType) {
            case 'string':
                return [
                    ...baseOperators,
                    { value: FilterOperator.CONTAINS, label: 'contains' },
                    { value: FilterOperator.STARTS_WITH, label: 'starts with' },
                    { value: FilterOperator.IN_LIST, label: 'is one of' }
                ];
            case 'number':
            case 'currency':
                return [
                    ...baseOperators,
                    { value: FilterOperator.GREATER_THAN, label: 'is greater than' },
                    { value: FilterOperator.LESS_THAN, label: 'is less than' },
                    { value: FilterOperator.BETWEEN, label: 'is between' }
                ];
            case 'date':
                return [
                    ...baseOperators,
                    { value: FilterOperator.GREATER_THAN, label: 'is after' },
                    { value: FilterOperator.LESS_THAN, label: 'is before' },
                    { value: FilterOperator.BETWEEN, label: 'is between' }
                ];
            default:
                return baseOperators;
        }
    }

    getValueInputType(filter: FilterCondition): string {
        if (!filter.field) return 'text';

        if (filter.operator === FilterOperator.BETWEEN) {
            return filter.field.dataType === 'date' ? 'daterange' : 'numberrange';
        }

        if (filter.operator === FilterOperator.IN_LIST) {
            return 'multiselect';
        }

        return filter.field.dataType === 'date' ? 'date' :
            filter.field.dataType === 'number' ? 'number' : 'text';
    }

    private updateFilterDisplayText(filter: FilterCondition): void {
        if (!filter.field || !filter.operator || filter.value === null) {
            filter.displayText = '';
            return;
        }

        const fieldName = filter.field.displayName;
        const operatorText = this.getOperatorDisplayText(filter.operator);
        const valueText = this.getValueDisplayText(filter);

        filter.displayText = `${fieldName} ${operatorText} ${valueText}`;
    }
    getValueDisplayText(filter: FilterCondition) {
        return '';
    }
    getOperatorDisplayText(operator: FilterOperator) {
        return '';
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}