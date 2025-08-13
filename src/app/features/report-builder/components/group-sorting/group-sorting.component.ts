import { CdkDragDrop, DragDropModule, moveItemInArray } from "@angular/cdk/drag-drop";
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faGripVertical, faLayerGroup, faPlus, faSort, faTimes } from "@fortawesome/free-solid-svg-icons";
import { GroupByField, SelectedField, SortField, FieldDataType } from "../../../../core/models/report.models";

@Component({
  selector: 'app-group-sorting',
  imports: [
    CommonModule, 
    FormsModule, 
    FontAwesomeModule,
    DragDropModule
  ],
  template: `
  <div class="group-sorting">
    <div class="group-sorting-header">
      <h3>Group and Sort Your Data</h3>
      <p class="help-text">Organize your report data by grouping and sorting fields</p>
    </div>

    <div class="group-sorting-content">
      <!-- Grouping Section -->
      <div class="grouping-section">
        <div class="section-header">
          <h4>Group By</h4>
          <p class="section-description">Group your data by specific fields to create summaries</p>
        </div>

        <div class="grouping-controls">
          <div class="field-selector">
            <label for="groupField">Select field to group by:</label>
            <select 
              id="groupField"
              [(ngModel)]="selectedGroupField"
              (change)="onGroupFieldSelected()">
              <option value="">Choose a field...</option>
              <option 
                *ngFor="let field of availableFields"
                [value]="field.id"
                [disabled]="isFieldGrouped(field)">
                {{ field.displayName }} ({{ getFieldTypeDisplay(field.dataType) }})
              </option>
            </select>
          </div>

          <button 
            class="btn btn-primary add-group-btn"
            [disabled]="!selectedGroupField"
            (click)="addGroupBy()">
            <fa-icon [icon]="faPlus"></fa-icon>
            Add Group
          </button>
        </div>

        <!-- Current Groups -->
        <div class="current-groups" *ngIf="groupBy.length > 0">
          <h5>Current Groups ({{ groupBy.length }})</h5>
          <div class="group-list">
            <div 
              *ngFor="let group of groupBy; let i = index"
              class="group-item"
              cdkDrag
              [cdkDragData]="group">
              
              <div class="group-content">
                <div class="drag-handle" cdkDragHandle>
                  <fa-icon [icon]="faGripVertical"></fa-icon>
                </div>
                
                <div class="group-info">
                  <div class="group-name">{{ group.displayName }}</div>
                  <div class="group-order">Group {{ i + 1 }}</div>
                </div>
                
                <button 
                  class="remove-btn"
                  (click)="removeGroupBy(i)"
                  title="Remove this group">
                  <fa-icon [icon]="faTimes"></fa-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- No Groups Message -->
        <div class="no-groups" *ngIf="groupBy.length === 0">
          <fa-icon [icon]="faLayerGroup"></fa-icon>
          <p>No groups defined. Your report will show individual records.</p>
        </div>
      </div>

      <!-- Sorting Section -->
      <div class="sorting-section">
        <div class="section-header">
          <h4>Sort Order</h4>
          <p class="section-description">Define the order in which your data will be displayed</p>
        </div>

        <div class="sorting-controls">
          <div class="field-selector">
            <label for="sortField">Select field to sort by:</label>
            <select 
              id="sortField"
              [(ngModel)]="selectedSortField"
              (change)="onSortFieldSelected()">
              <option value="">Choose a field...</option>
              <option 
                *ngFor="let field of availableFields"
                [value]="field.id">
                {{ field.displayName }} ({{ getFieldTypeDisplay(field.dataType) }})
              </option>
            </select>
          </div>

          <div class="sort-direction">
            <label for="sortDirection">Direction:</label>
            <select 
              id="sortDirection"
              [(ngModel)]="selectedSortDirection">
              <option value="asc">Ascending (A-Z, 1-9)</option>
              <option value="desc">Descending (Z-A, 9-1)</option>
            </select>
          </div>

          <button 
            class="btn btn-primary add-sort-btn"
            [disabled]="!selectedSortField"
            (click)="addSort()">
            <fa-icon [icon]="faPlus"></fa-icon>
            Add Sort
          </button>
        </div>

        <!-- Current Sorts -->
        <div class="current-sorts" *ngIf="sorting.length > 0">
          <h5>Current Sort Order ({{ sorting.length }})</h5>
          <div class="sort-list"
               cdkDropList
               [cdkDropListData]="sorting"
               (cdkDropListDropped)="onSortDropped($event)">
            <div 
              *ngFor="let sort of sorting; let i = index"
              class="sort-item"
              cdkDrag>
              
              <div class="sort-content">
                <div class="drag-handle" cdkDragHandle>
                  <fa-icon [icon]="faGripVertical"></fa-icon>
                </div>
                
                <div class="sort-info">
                  <div class="sort-name">{{ sort.displayName }}</div>
                  <div class="sort-details">
                    <span class="sort-order">Sort {{ i + 1 }}</span>
                    <span class="sort-direction-badge" [class]="sort.direction">
                      {{ sort.direction === 'asc' ? 'A→Z' : 'Z→A' }}
                    </span>
                  </div>
                </div>
                
                <button 
                  class="remove-btn"
                  (click)="removeSort(i)"
                  title="Remove this sort">
                  <fa-icon [icon]="faTimes"></fa-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- No Sorts Message -->
        <div class="no-sorts" *ngIf="sorting.length === 0">
          <fa-icon [icon]="faSort"></fa-icon>
          <p>No sort order defined. Data will be displayed in default order.</p>
        </div>
      </div>

      <!-- Preview Section -->
      <div class="preview-section">
        <div class="section-header">
          <h4>Preview</h4>
          <p class="section-description">How your data will be organized</p>
        </div>

        <div class="preview-content">
          <div class="preview-item" *ngIf="groupBy.length > 0">
            <strong>Grouped by:</strong>
            <span>{{ getGroupByPreview() }}</span>
          </div>
          
          <div class="preview-item" *ngIf="sorting.length > 0">
            <strong>Sorted by:</strong>
            <span>{{ getSortPreview() }}</span>
          </div>
          
          <div class="preview-item" *ngIf="groupBy.length === 0 && sorting.length === 0">
            <em>No grouping or sorting applied. Data will be displayed as individual records.</em>
          </div>
        </div>
      </div>
    </div>
  </div>
`
  ,
  styleUrls: ['./group-sorting.component.scss']
})
export class GroupSortingComponent {
    @Input() availableFields: SelectedField[] = [];
    @Input() groupBy: GroupByField[] = [];
    @Input() sorting: SortField[] = [];
    @Input() selectedFields: SelectedField[] = [];

    faPlus = faPlus;
    faTimes = faTimes;
    faGripVertical = faGripVertical;
    faLayerGroup = faLayerGroup;
    faSort = faSort;

    // Event emitters for changes
    groupingChanged = new EventEmitter<GroupByField[]>();
    sortingChanged = new EventEmitter<SortField[]>();

    selectedSortField?: SelectedField;
    selectedGroupField?: SelectedField;
    selectedSortDirection: 'asc'| 'desc' = 'asc';

    getSortPreview() {
      return this.sorting.map(sort => `${sort.displayName} (${sort.direction})`).join(', ');
    }

    getGroupByPreview() {
      return this.groupBy.map(group => group.displayName).join(', ');
    }

    isFieldGrouped(field: SelectedField) {
      return this.groupBy.some(group => group.id === field.id);
    }

    removeSort(index: number) {
      this.sorting.splice(index, 1);
      this.sortingChanged.emit(this.sorting);
    }

    removeGroupBy(index: number) {
      this.groupBy.splice(index, 1);
      this.groupingChanged.emit(this.groupBy);
    } 

    onSortFieldSelected() {
      // Find the selected field by ID from the select element
      const selectElement = document.getElementById('sortField') as HTMLSelectElement;
      if (selectElement && selectElement.value) {
        this.selectedSortField = this.availableFields.find(field => field.id === selectElement.value);
      }
    }

    onGroupFieldSelected() {
      // Find the selected field by ID from the select element
      const selectElement = document.getElementById('groupField') as HTMLSelectElement;
      if (selectElement && selectElement.value) {
        this.selectedGroupField = this.availableFields.find(field => field.id === selectElement.value);
      }
    }

    onSortDropped(event: CdkDragDrop<SortField[]>): void {
      const fields = [...this.sorting];
      const movedField = fields[event.previousIndex];
      fields.splice(event.previousIndex, 1);
      fields.splice(event.currentIndex, 0, movedField);
      this.sorting = fields;
      this.sortingChanged.emit(this.sorting);
    }

    addSort() {
      if (this.selectedSortField) {
        const newSort: SortField = {
          id: this.selectedSortField.id,
          tableName: this.selectedSortField.tableName,
          fieldName: this.selectedSortField.fieldName,
          displayName: this.selectedSortField.displayName,
          direction: this.selectedSortDirection
        };
        this.sorting = [...this.sorting, newSort];
        this.sortingChanged.emit(this.sorting);
      }
    }

    getFieldTypeDisplay(dataType: FieldDataType): string {
      switch (dataType) {
        case FieldDataType.NUMBER:
          return 'Number';
        case FieldDataType.CURRENCY:
          return 'Currency';
        case FieldDataType.DATE:
          return 'Date';
        case FieldDataType.BOOLEAN:
          return 'Boolean';
        case FieldDataType.STRING:
          return 'String';
        default:
          return 'Unknown';
      }
    } 
    
    addGroupBy() {
      if (this.selectedGroupField && !this.isFieldGrouped(this.selectedGroupField)) {
        const newGroup: GroupByField = {
          id: this.selectedGroupField.id,
          tableName: this.selectedGroupField.tableName,
          fieldName: this.selectedGroupField.fieldName,
          displayName: this.selectedGroupField.displayName
        };
        this.groupBy = [...this.groupBy, newGroup];
        this.groupingChanged.emit(this.groupBy);
      }
    }

}