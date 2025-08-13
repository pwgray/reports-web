import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges, HostListener } from "@angular/core";
import { AggregationType, FieldDataType, SelectedField } from "../../../../core/models/report.models";
import { CdkDragDrop, DragDropModule } from "@angular/cdk/drag-drop";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { SchemaInfo } from "../../../../core/models/schema-info.model";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { 
  faPlus, 
  faGripVertical, 
  faPen, 
  faTimes, 
  faTable, 
  faChevronDown, 
  faChevronRight,
  faSearch,
  faDatabase,
  faColumns,
  faLayerGroup,
  faSort,
  faChartBar,
  faCog
} from '@fortawesome/free-solid-svg-icons';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FieldFormatDialogComponent } from '../field-format-dialog/field-format-dialog.component';

// features/report-builder/components/field-selector/field-selector.component.ts
@Component({
  selector: 'app-field-selector',
  imports: [
    CommonModule, 
    FormsModule, 
    DragDropModule, 
    FontAwesomeModule, 
    MatDialogModule
  ],
  template: `
    <div class="field-selector-container">
      <!-- Header -->
      <div class="field-selector-header">
        <div class="header-content">
          <h2 class="header-title">
            <fa-icon [icon]="faColumns" class="header-icon"></fa-icon>
            Report Field Selection
          </h2>
          <p class="header-subtitle">Drag fields from the sidebar to build your report columns</p>
        </div>
      </div>

           <!-- Main Layout -->
      <div class="field-selector-layout">
        <!-- Sidebar: Available Fields -->
        <div class="field-selector-sidebar" [style.width.px]="sidebarWidth">
          <div class="sidebar-header">
            <h3 class="sidebar-title">
              <fa-icon [icon]="faDatabase" class="sidebar-icon"></fa-icon>
              Data Source Fields
            </h3>
            <div class="search-container">
              <div class="search-input-wrapper">
                <fa-icon [icon]="faSearch" class="search-icon"></fa-icon>
                <input 
                  type="text" 
                  placeholder="Search fields..."
                  [(ngModel)]="searchTerm"
                  (input)="filterFields()"
                  class="search-input">
              </div>
            </div>
          </div>

          <div class="sidebar-content">
            <div class="field-categories">
              <div 
                *ngFor="let category of filteredCategories" 
                class="field-category"
                [class.expanded]="category.expanded">
                
                <div class="category-header" (click)="toggleCategory(category)">
                  <div class="category-info">
                    <fa-icon 
                      [icon]="category.expanded ? faChevronDown : faChevronRight" 
                      class="category-toggle-icon">
                    </fa-icon>
                    <fa-icon [icon]="faTable" class="category-icon"></fa-icon>
                    <span class="category-name">{{ category.displayName }}</span>
                  </div>
                  <span class="field-count">{{ category.fields.length }}</span>
                </div>

                <div class="category-fields" *ngIf="category.expanded">
                  <div 
                    *ngFor="let field of category.fields"
                    class="field-item"
                    [class.selected]="isFieldSelected(field)"
                    cdkDrag
                    [cdkDragData]="field"
                    [cdkDragDisabled]="isFieldSelected(field)">
                    
                    <div class="field-item-content">
                      <div class="field-info">
                        <div class="field-name">{{ field.displayName }}</div>
                        <div class="field-type">
                          <fa-icon [icon]="getFieldTypeIcon(field.dataType)" class="field-type-icon"></fa-icon>
                          {{ getFieldTypeDisplay(field.dataType) }}
                        </div>
                      </div>
                      
                      <div class="field-actions">
                        <button 
                          class="add-field-btn"
                          [disabled]="isFieldSelected(field)"
                          (click)="addField(field)"
                          title="Add to report">
                          <fa-icon [icon]="faPlus"></fa-icon>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="resize-handle" (mousedown)="onResizeStart($event)"></div>
        </div>

        <!-- Main Content: Selected Fields -->
        <div class="field-selector-main">
          <div class="main-content">
            <div class="selected-fields-container" 
                 cdkDropList
                 id="selected-fields-drop-list"
                 [cdkDropListData]="selectedFields"
                 (cdkDropListDropped)="onFieldDropped($event)">
              
              <div 
                *ngFor="let field of selectedFields; trackBy: trackByFieldId"
                class="selected-field-card"
                cdkDrag>
                
                <div class="selected-field-content">
                  <div class="drag-handle" cdkDragHandle>
                    <fa-icon [icon]="faGripVertical"></fa-icon>
                  </div>
                  
                  <div class="field-details">
                    <div class="field-header">
                      <div class="field-title">{{ field.displayName }}</div>
                      <div class="field-meta">
                        <span class="field-source">{{ field.tableName }}</span>
                        <span class="field-source">{{ field.fieldName }}</span>
                        <span class="field-type-badge">
                          <fa-icon [icon]="getFieldTypeIcon(field.dataType)" class="field-type-icon"></fa-icon>
                          {{ getFieldTypeDisplay(field.dataType) }}
                        </span>
                      </div>
                    </div>
                    
                    <div class="field-options">
                      <!-- Aggregation for numeric fields -->
                      <div class="option-group" *ngIf="isNumericField(field)">
                        <label class="option-label">
                          <fa-icon [icon]="faSort" class="option-icon"></fa-icon>
                          Aggregation
                        </label>
                        <select 
                          [(ngModel)]="field.aggregation"
                          (change)="onFieldChanged(field)"
                          class="aggregation-select">
                          <option value="">Show individual values</option>
                          <option value="sum">Sum</option>
                          <option value="avg">Average</option>
                          <option value="count">Count</option>
                          <option value="min">Minimum</option>
                          <option value="max">Maximum</option>
                        </select>
                      </div>
                      
                      <!-- Formatting options -->
                      <button 
                        class="format-btn"
                        (click)="openFormatDialog(field)"
                        title="Format this field">
                        <fa-icon [icon]="faCog"></fa-icon>
                        Format
                      </button>
                    </div>
                  </div>
                  
                  <button 
                    class="remove-field-btn"
                    (click)="removeField(field)"
                    title="Remove from report">
                    <fa-icon [icon]="faTimes"></fa-icon>
                  </button>
                </div>
              </div>

              <!-- Empty state -->
              <div *ngIf="selectedFields.length === 0" class="empty-state">
                <div class="empty-state-content">
                  <fa-icon [icon]="faTable" class="empty-state-icon"></fa-icon>
                  <h4 class="empty-state-title">No fields selected</h4>
                  <p class="empty-state-description">
                    Drag fields from the sidebar or click the + button to add them to your report
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./field-selector.component.scss']
})
export class FieldSelectorComponent implements OnInit {
  @Input() schema: SchemaInfo | null = null;
  @Input() selectedFields: SelectedField[] = [];
  @Output() fieldsChanged = new EventEmitter<SelectedField[]>();

// FontAwesome icons
  faPlus = faPlus;
  faGripVertical = faGripVertical;
  faPen = faPen;
  faTimes = faTimes;
  faTable = faTable;
  faChevronDown = faChevronDown;
  faChevronRight = faChevronRight;
  faSearch = faSearch;
  faDatabase = faDatabase;
  faColumns = faColumns;
  faLayerGroup = faLayerGroup;
  faSort = faSort;
  faChartBar = faChartBar;
  faCog = faCog;

  searchTerm = '';
  filteredCategories: any[] = [];
  allCategories: any[] = [];

  // Sidebar resizing
  sidebarWidth = 320;
  private resizing = false;
  private resizeStartX = 0;
  private resizeStartWidth = this.sidebarWidth;
  minSidebarWidth = 240;
  maxSidebarWidth = 600;

  constructor(private readonly dialog: MatDialog) {}

  ngOnInit(): void {
    this.buildFieldCategories();
    console.log('FieldSelectorComponent ngOnInit', this.selectedFields);
  }

  onResizeStart(event: MouseEvent) {
    this.resizing = true;
    this.resizeStartX = event.clientX;
    this.resizeStartWidth = this.sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    event.preventDefault();
  }

  @HostListener('window:mousemove', ['$event'])
  onResizeMove(event: MouseEvent) {
    if (!this.resizing) return;
    const dx = event.clientX - this.resizeStartX;
    const next = Math.min(this.maxSidebarWidth, Math.max(this.minSidebarWidth, this.resizeStartWidth + dx));
    this.sidebarWidth = next;
  }

  @HostListener('window:mouseup')
  onResizeEnd() {
    if (!this.resizing) return;
    this.resizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['schema'] && this.schema) {
      this.buildFieldCategories();
    }
    
    // Handle case where selectedFields are loaded before schema
    if (changes['selectedFields'] && this.selectedFields && this.schema) {
      // Ensure selected fields are properly marked as selected in the UI
      this.updateFieldSelectionState();
    }
  }

  private updateFieldSelectionState(): void {
    // This method ensures that when fields are loaded from an existing report,
    // they are properly marked as selected in the UI
    if (!this.allCategories.length) return;
    
    // Force a rebuild of the filtered categories to update selection state
    this.filterFields();
  }
  
  onFieldDropped($event: CdkDragDrop<any[], any, any>) {
    console.log($event);
    
    if ($event.previousContainer === $event.container) {
      // Reordering within the same container (selected fields)
      const fields = [...this.selectedFields];
      const movedField = fields[$event.previousIndex];
      fields.splice($event.previousIndex, 1);
      fields.splice($event.currentIndex, 0, movedField);
      this.selectedFields = fields;
      this.fieldsChanged.emit(this.selectedFields);
    } else {
      // Moving from available fields to selected fields
      const draggedField = $event.item.data;
      if (draggedField && !this.isFieldSelected(draggedField)) {
        this.addField(draggedField);
      }
    }
  }
  
  isNumericField(_t42: SelectedField): any {
    return _t42.dataType === 'number' || _t42.dataType === 'currency';

  }

  onFieldChanged(_t42: SelectedField) {
    console.log(_t42);
    this.selectedFields = this.selectedFields.map(field => field.id === _t42.id ? _t42 : field);
    this.fieldsChanged.emit(this.selectedFields);
  }

  openFormatDialog(field: SelectedField) {
    const dialogRef = this.dialog.open(FieldFormatDialogComponent, {
      width: '520px',
      autoFocus: true,
      restoreFocus: false,
      data: { field }
    });

    dialogRef.afterClosed().subscribe((result?: SelectedField) => {
      if (!result) return;
      this.selectedFields = this.selectedFields.map(f => f.id === field.id ? result : f);
      this.fieldsChanged.emit(this.selectedFields);
    });
  }

  private buildFieldCategories(): void {
    if (!this.schema) return;

    this.allCategories = this.schema.tables.map(table => ({
      name: table.name,
      displayName: table.name || this.humanizeTableName(table.name),
      fields: table.columns.map(field => ({
        ...field,
        tableName: table.name,
        displayName: field.name || this.humanizeFieldName(field.name)
      })),
      expanded: false
    }));

    this.filterFields();
  }

  filterFields(): void {
    if (!this.searchTerm) {
      this.filteredCategories = [...this.allCategories];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredCategories = this.allCategories
      .map(category => ({
        ...category,
        fields: category.fields.filter((field: { displayName: string; name: string; }) =>
          field.displayName.toLowerCase().includes(term) ||
          field.name.toLowerCase().includes(term)
        )
      }))
      .filter(category => category.fields.length > 0);
  }

  addField(field: any): void {
    if (this.isFieldSelected(field)) return;

    const selectedField: SelectedField = {
      id: `${field.tableName}.${field.name}`,
      tableName: field.tableName,
      fieldName: field.name,
      displayName: field.displayName,
      dataType: field.dataType,
      aggregation: this.getDefaultAggregation(field.dataType) as AggregationType | undefined
    };

    this.selectedFields = [...this.selectedFields, selectedField];
    this.fieldsChanged.emit(this.selectedFields);
  }

  removeField(field: SelectedField): void {
    this.selectedFields = this.selectedFields.filter(f => f.id !== field.id);
    this.fieldsChanged.emit(this.selectedFields);
  }

  isFieldSelected(field: any): boolean {
    return this.selectedFields.some(f =>
      f.tableName === field.tableName && f.fieldName === field.name
    );
  }

  private humanizeTableName(name: string): string {
    return name.replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ');
  }

  private humanizeFieldName(name: string): string {
    return name.replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ');
  }

  getFieldTypeDisplay(dataType: FieldDataType): string {
    const typeMap = {
      'string': 'Text',
      'number': 'Number',
      'smallint': 'Number',
      'bigint': 'Number',
      'float': 'Number',
      'double': 'Number',
      'decimal': 'Number',
      'numeric': 'Number',
      'money': 'Money',
      'date': 'Date',
      'datetime': 'Date',
      'boolean': 'Yes/No',
      'currency': 'Money'
    };
    return typeMap[dataType] || 'Text';
  }

  getFieldTypeIcon(dataType: FieldDataType): any {
    const iconMap = {
      'string': faTable,
      'number': faSort,
      'date': faLayerGroup,
      'boolean': faTable,
      'currency': faSort,
      'smallint': faSort,
      'bigint': faSort,
      'float': faSort,
      'double': faSort,
      'decimal': faSort,
      'numeric': faSort,
      'money': faSort
    };
    return iconMap[dataType] || faTable;
  }

  trackByFieldId(index: number, field: SelectedField): string {
    return field.id;
  }

  toggleCategory(category: any): void {
    category.expanded = !category.expanded;
  }

  private getDefaultAggregation(dataType: FieldDataType): string | undefined {
    // Return default aggregation for numeric fields, otherwise undefined
    if (dataType === 'number' || dataType === 'currency') {
      return '';
    }
    return undefined;
  }
}