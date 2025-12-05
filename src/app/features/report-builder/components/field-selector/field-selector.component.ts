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
  faCog,
  faProjectDiagram,
  faLink,
  faKey,
  faArrowRight,
  faCheckSquare,
  faNetworkWired
} from '@fortawesome/free-solid-svg-icons';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FieldFormatDialogComponent } from '../field-format-dialog/field-format-dialog.component';
import { RelatedFieldDialogComponent, RelatedFieldDialogResult } from '../related-field-dialog/related-field-dialog.component';

interface HierarchyNode {
  table: any;
  relationship?: any;
  level: number;
  expanded: boolean;
  children: HierarchyNode[];
  parent?: HierarchyNode;
}

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
            <!-- View Toggle -->
            <div class="view-toggle">
              <button 
                class="toggle-btn"
                [class.active]="viewMode === 'flat'"
                (click)="setViewMode('flat')"
                title="Flat view">
                <fa-icon [icon]="faTable"></fa-icon>
                Tables
              </button>
              <button 
                class="toggle-btn"
                [class.active]="viewMode === 'hierarchical'"
                (click)="setViewMode('hierarchical')"
                title="Hierarchical view">
                <fa-icon [icon]="faProjectDiagram"></fa-icon>
                Relationships
              </button>
            </div>

            <!-- Add Related Field Button -->
            <div class="related-field-section" *ngIf="schema && schema.relationships && schema.relationships.length > 0">
              <button 
                class="add-related-btn"
                (click)="openRelatedFieldDialog()"
                title="Add field from related table">
                <fa-icon [icon]="faNetworkWired"></fa-icon>
                Add Related Table Field
              </button>
            </div>

            <!-- Flat View -->
            <div class="field-categories" *ngIf="viewMode === 'flat'">
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
                    <fa-icon [icon]="getObjectTypeIcon(category.objectType)" class="category-icon"></fa-icon>
                    <div class="category-name-container">
                      <span class="category-name">
                        <span class="schema-prefix" *ngIf="category.schema">{{ category.schema }}.</span>{{ category.displayName }}
                      </span>
                      <span class="object-type-badge" *ngIf="category.objectType">
                        {{ getObjectTypeDisplay(category.objectType) }}
                      </span>
                    </div>
                  </div>
                  <div class="category-actions">
                    <button 
                      class="select-all-btn"
                      (click)="selectAllFieldsFromTable(category); $event.stopPropagation()"
                      title="Select all fields from this table">
                      <fa-icon [icon]="faCheckSquare"></fa-icon>
                    </button>
                    <span class="field-count">{{ category.fields.length }}</span>
                  </div>
                </div>

                <div class="category-fields" *ngIf="category.expanded">
                  <div 
                    *ngFor="let field of category.fields"
                    class="field-item"
                    [class.selected]="isFieldSelected(field)"
                    [class.primary-key]="field.isPrimaryKey"
                    [class.foreign-key]="field.isForeignKey"
                    cdkDrag
                    [cdkDragData]="field"
                    [cdkDragDisabled]="isFieldSelected(field)">
                    
                    <div class="field-item-content">
                      <div class="field-info">
                        <div class="field-name">
                          <fa-icon 
                            *ngIf="field.isPrimaryKey" 
                            [icon]="faKey" 
                            class="key-icon primary-key-icon"
                            title="Primary Key">
                          </fa-icon>
                          <fa-icon 
                            *ngIf="field.isForeignKey" 
                            [icon]="faLink" 
                            class="key-icon foreign-key-icon"
                            title="Foreign Key">
                          </fa-icon>
                          {{ field.displayName }}
                        </div>
                        <div class="field-type">
                          <fa-icon [icon]="getFieldTypeIcon(field.dataType)" class="field-type-icon"></fa-icon>
                          {{ getFieldTypeDisplay(field.dataType) }}
                        </div>
                        <div class="field-reference" *ngIf="field.foreignKeyReference">
                          <fa-icon [icon]="faArrowRight" class="reference-icon"></fa-icon>
                          {{ field.foreignKeyReference.referencedTable }}.{{ field.foreignKeyReference.referencedColumn }}
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

            <!-- Hierarchical View -->
            <div class="relationship-hierarchy" *ngIf="viewMode === 'hierarchical'">
              <div 
                *ngFor="let node of hierarchicalNodes" 
                class="hierarchy-node"
                [class.expanded]="node.expanded"
                [style.margin-left.px]="node.level * 20">
                
                <div class="node-header" (click)="toggleHierarchyNode(node)">
                  <div class="node-info">
                    <fa-icon 
                      *ngIf="node.children.length > 0"
                      [icon]="node.expanded ? faChevronDown : faChevronRight" 
                      class="node-toggle-icon">
                    </fa-icon>
                    <fa-icon 
                      [icon]="getObjectTypeIcon(node.table.type || 'base_table')" 
                      class="node-icon"
                      [class.master-table]="node.level === 0"
                      [class.child-table]="node.level > 0">
                    </fa-icon>
                    <div class="node-name-container">
                      <span class="node-name">
                        <span class="schema-prefix" *ngIf="node.table.schema">{{ node.table.schema }}.</span>{{ node.table.displayName || node.table.name }}
                      </span>
                      <span class="relationship-info" *ngIf="node.relationship">
                        ({{ node.relationship.cardinality.replace('_', ' ') }})
                      </span>
                      <span class="object-type-badge" *ngIf="node.table.type">
                        {{ getObjectTypeDisplay(node.table.type) }}
                      </span>
                    </div>
                  </div>
                  <div class="node-actions">
                    <button 
                      class="select-all-btn"
                      (click)="selectAllFieldsFromHierarchyNode(node); $event.stopPropagation()"
                      title="Select all fields from this table">
                      <fa-icon [icon]="faCheckSquare"></fa-icon>
                    </button>
                    <span class="field-count">{{ node.table.columns.length }}</span>
                  </div>
                </div>

                <!-- Table Fields -->
                <div class="node-fields" *ngIf="node.expanded">
                  <div 
                    *ngFor="let field of node.table.columns"
                    class="field-item hierarchical-field"
                    [class.selected]="isFieldSelected(field)"
                    [class.primary-key]="field.isPrimaryKey"
                    [class.foreign-key]="field.isForeignKey"
                    [class.relationship-key]="isRelationshipKey(field, node)"
                    cdkDrag
                    [cdkDragData]="field"
                    [cdkDragDisabled]="isFieldSelected(field)">
                    
                    <div class="field-item-content">
                      <div class="field-info">
                        <div class="field-name">
                          <fa-icon 
                            *ngIf="field.isPrimaryKey" 
                            [icon]="faKey" 
                            class="key-icon primary-key-icon"
                            title="Primary Key">
                          </fa-icon>
                          <fa-icon 
                            *ngIf="field.isForeignKey" 
                            [icon]="faLink" 
                            class="key-icon foreign-key-icon"
                            title="Foreign Key">
                          </fa-icon>
                          {{ field.displayName || field.name }}
                        </div>
                        <div class="field-type">
                          <fa-icon [icon]="getFieldTypeIcon(field.dataType)" class="field-type-icon"></fa-icon>
                          {{ getFieldTypeDisplay(field.dataType) }}
                        </div>
                        <div class="field-reference" *ngIf="field.foreignKeyReference">
                          <fa-icon [icon]="faArrowRight" class="reference-icon"></fa-icon>
                          {{ field.foreignKeyReference.referencedTable }}.{{ field.foreignKeyReference.referencedColumn }}
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
                      <div class="field-title">
                        <fa-icon 
                          *ngIf="field.relatedTable" 
                          [icon]="faNetworkWired" 
                          class="related-field-icon"
                          title="Related table field">
                        </fa-icon>
                        {{ field.displayName }}
                      </div>
                      <div class="field-meta">
                        <span class="field-source">{{ field.tableName }}</span>
                        <span class="field-source" *ngIf="!field.relatedTable">{{ field.fieldName }}</span>
                        <span class="field-source related-badge" *ngIf="field.relatedTable">
                          <fa-icon [icon]="faProjectDiagram"></fa-icon>
                          {{ field.relatedTable.displayMode === 'aggregate' ? 'Aggregated' : 'Sub-Report' }}
                        </span>
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
  faProjectDiagram = faProjectDiagram;
  faLink = faLink;
  faKey = faKey;
  faArrowRight = faArrowRight;
  faCheckSquare = faCheckSquare;
  faNetworkWired = faNetworkWired;

  searchTerm = '';
  filteredCategories: any[] = [];
  allCategories: any[] = [];
  
  // View mode and hierarchical data
  viewMode: 'flat' | 'hierarchical' = 'flat';
  hierarchicalNodes: HierarchyNode[] = [];

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
    this.buildHierarchicalView();
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
      this.buildHierarchicalView();
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
      schema: table.schema,
      objectType: table.type || 'base_table',
      displayName: table.name || this.humanizeTableName(table.name),
      fields: table.columns.map(field => ({
        ...field,
        tableName: table.name,
        schema: table.schema,
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
      displayName: field.displayName || field.name,
      dataType: field.normalizedType || field.dataType,
      aggregation: this.getDefaultAggregation(field.normalizedType || field.dataType) as AggregationType | undefined,
      schema: field.schema // Include schema information
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

  getObjectTypeIcon(objectType: string): any {
    const iconMap: { [key: string]: any } = {
      'base_table': faTable,
      'view': faLayerGroup,
      'table': faTable,
      'stored_procedure': faCog,
      'procedure': faCog,
      'function': faCog
    };
    return iconMap[objectType] || faTable;
  }

  getObjectTypeDisplay(objectType: string): string {
    const displayMap: { [key: string]: string } = {
      'base_table': 'Table',
      'view': 'View',
      'table': 'Table',
      'stored_procedure': 'Procedure',
      'procedure': 'Procedure',
      'function': 'Function'
    };
    return displayMap[objectType] || objectType;
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

  // Hierarchical view methods
  setViewMode(mode: 'flat' | 'hierarchical'): void {
    this.viewMode = mode;
  }

  private buildHierarchicalView(): void {
    if (!this.schema || !this.schema.relationships) {
      this.hierarchicalNodes = [];
      return;
    }

    const tables = this.schema.tables;
    const relationships = this.schema.relationships;
    const nodeMap = new Map<string, HierarchyNode>();
    
    // Create nodes for all tables
    tables.forEach(table => {
      nodeMap.set(table.name, {
        table: {
          ...table,
          schema: table.schema,
          type: table.type || 'base_table',
          columns: table.columns.map(col => ({
            ...col,
            tableName: table.name,
            schema: table.schema,
            displayName: col.displayName || col.name
          }))
        },
        level: 0,
        expanded: false,
        children: []
      });
    });

    // Build hierarchy based on relationships
    relationships.forEach(rel => {
      const parentNode = nodeMap.get(rel.parentTable);
      const childNode = nodeMap.get(rel.childTable);
      
      if (parentNode && childNode) {
        childNode.relationship = rel;
        childNode.parent = parentNode;
        parentNode.children.push(childNode);
      }
    });

    // Find root nodes (tables with no parent relationships)
    const rootNodes: HierarchyNode[] = [];
    nodeMap.forEach(node => {
      if (!node.parent) {
        rootNodes.push(node);
      }
    });

    // Set levels for hierarchy
    const setLevels = (nodes: HierarchyNode[], level: number) => {
      nodes.forEach(node => {
        node.level = level;
        if (node.children.length > 0) {
          setLevels(node.children, level + 1);
        }
      });
    };

    setLevels(rootNodes, 0);

    // Flatten the hierarchy for display
    const flattenHierarchy = (nodes: HierarchyNode[]): HierarchyNode[] => {
      const result: HierarchyNode[] = [];
      nodes.forEach(node => {
        result.push(node);
        if (node.expanded && node.children.length > 0) {
          result.push(...flattenHierarchy(node.children));
        }
      });
      return result;
    };

    this.hierarchicalNodes = flattenHierarchy(rootNodes);
  }

  toggleHierarchyNode(node: HierarchyNode): void {
    node.expanded = !node.expanded;
    this.buildHierarchicalView(); // Rebuild to show/hide children
  }

  isRelationshipKey(field: any, node: HierarchyNode): boolean {
    if (!node.relationship) return false;
    
    return node.relationship.columnMappings.some((mapping: any) => 
      mapping.childColumn === field.name || mapping.parentColumn === field.name
    );
  }

  selectAllFieldsFromTable(table: any): void {
    // Get all fields from the table that aren't already selected
    const fieldsToAdd = table.fields.filter((field: any) => !this.isFieldSelected(field));
    
    // Convert to SelectedField objects
    const newSelectedFields = fieldsToAdd.map((field: any) => ({
      id: `${field.tableName}.${field.name}`,
      tableName: field.tableName,
      fieldName: field.name,
      displayName: field.displayName || field.name,
      dataType: field.normalizedType || field.dataType,
      aggregation: this.getDefaultAggregation(field.normalizedType || field.dataType) as AggregationType | undefined,
      schema: field.schema // Include schema information
    }));
    
    // Add all new fields
    this.selectedFields = [...this.selectedFields, ...newSelectedFields];
    this.fieldsChanged.emit(this.selectedFields);
  }

  selectAllFieldsFromHierarchyNode(node: HierarchyNode): void {
    // Get all fields from the node's table that aren't already selected
    const fieldsToAdd = node.table.columns.filter((field: any) => !this.isFieldSelected(field));
    
    // Convert to SelectedField objects
    const newSelectedFields = fieldsToAdd.map((field: any) => ({
      id: `${field.tableName}.${field.name}`,
      tableName: field.tableName,
      fieldName: field.name,
      displayName: field.displayName || field.name,
      dataType: field.normalizedType || field.dataType,
      aggregation: this.getDefaultAggregation(field.normalizedType || field.dataType) as AggregationType | undefined,
      schema: field.schema // Include schema information
    }));
    
    // Add all new fields
    this.selectedFields = [...this.selectedFields, ...newSelectedFields];
    this.fieldsChanged.emit(this.selectedFields);
  }

  openRelatedFieldDialog(): void {
    if (!this.schema) return;

    // Get the primary table from selected fields or first table in schema
    const sourceTableName = this.selectedFields.length > 0 
      ? this.selectedFields[0].tableName 
      : this.schema.tables[0]?.name;

    if (!sourceTableName) return;

    const dialogRef = this.dialog.open(RelatedFieldDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
      autoFocus: true,
      restoreFocus: false,
      data: {
        schema: this.schema,
        sourceTableName: sourceTableName
      }
    });

    dialogRef.afterClosed().subscribe((result?: RelatedFieldDialogResult) => {
      if (!result) return;

      // Create a new selected field with the related table configuration
      const relatedField: SelectedField = {
        id: `related_${Date.now()}_${result.config.relationshipId}`,
        tableName: sourceTableName,
        fieldName: `related_${result.config.relatedTableName}`,
        displayName: result.displayName,
        dataType: result.dataType,
        relatedTable: result.config
      };

      this.selectedFields = [...this.selectedFields, relatedField];
      this.fieldsChanged.emit(this.selectedFields);
    });
  }
}