import { CdkDragDrop, DragDropModule, moveItemInArray } from "@angular/cdk/drag-drop";
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatChipsModule } from "@angular/material/chips";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { MatCardModule } from "@angular/material/card";
import { trigger, transition, style, animate } from '@angular/animations';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faGripVertical, faLayerGroup, faPlus, faSort, faTimes, faArrowUp, faArrowDown, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { GroupByField, SelectedField, SortField, FieldDataType } from "../../../../core/models/report.models";

@Component({
  selector: 'app-group-sorting',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    FontAwesomeModule,
    DragDropModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatChipsModule,
    MatSelectModule,
    MatOptionModule,
    MatCardModule
  ],
  template: `
  <div class="group-sorting">
    <!-- Header -->
    <div class="group-sorting-header">
      <div class="header-content">
        <h3>Group and Sort Your Data</h3>
        <p class="help-text">Organize your report data for better insights and readability</p>
      </div>
      <div class="header-stats" *ngIf="groupBy.length > 0 || sorting.length > 0">
        <mat-chip-listbox>
          <mat-chip *ngIf="groupBy.length > 0" class="stat-chip group-chip">
            <mat-icon>layers</mat-icon>
            {{ groupBy.length }} Group{{ groupBy.length > 1 ? 's' : '' }}
          </mat-chip>
          <mat-chip *ngIf="sorting.length > 0" class="stat-chip sort-chip">
            <mat-icon>sort</mat-icon>
            {{ sorting.length }} Sort{{ sorting.length > 1 ? 's' : '' }}
          </mat-chip>
        </mat-chip-listbox>
      </div>
    </div>

    <div class="group-sorting-content">
      <!-- Grouping Section -->
      <mat-card class="section-card grouping-section">
        <mat-card-header>
          <div class="section-header">
            <div class="section-title">
              <mat-icon class="section-icon">layers</mat-icon>
              <h4>Group By Fields</h4>
            </div>
            <p class="section-description">
              <mat-icon class="info-icon">info</mat-icon>
              Group records by common values to create summaries and subtotals
            </p>
          </div>
        </mat-card-header>

        <mat-card-content>
          <!-- Add Group Controls -->
          <div class="add-controls">
            <mat-select 
              [(ngModel)]="selectedGroupFieldId"
              placeholder="Select a field to group by..."
              class="field-select">
              <mat-option 
                *ngFor="let field of availableGroupFields"
                [value]="field.id"
                [disabled]="isFieldGrouped(field)">
                <div class="option-content">
                  <span class="field-name">{{ field.displayName }}</span>
                  <span class="field-type">{{ getFieldTypeDisplay(field.dataType) }}</span>
                </div>
              </mat-option>
            </mat-select>

            <button 
              mat-raised-button
              color="primary"
              class="add-btn"
              [disabled]="!selectedGroupFieldId"
              (click)="addGroupBy()"
              matTooltip="Add this field to grouping">
              <mat-icon>add_circle</mat-icon>
              Add Group
            </button>
          </div>

          <!-- Current Groups -->
          <div class="current-items" *ngIf="groupBy.length > 0">
            <div class="items-header">
              <h5>
                <mat-icon>format_list_numbered</mat-icon>
                Grouping Hierarchy ({{ groupBy.length }})
              </h5>
              <button 
                mat-button
                color="warn"
                class="clear-all-btn"
                (click)="clearAllGroups()"
                matTooltip="Remove all groupings">
                <mat-icon>clear_all</mat-icon>
                Clear All
              </button>
            </div>

            <div 
              class="items-list"
              cdkDropList
              [cdkDropListData]="groupBy"
              (cdkDropListDropped)="onGroupDropped($event)"
              [@listAnimation]>
              <div 
                *ngFor="let group of groupBy; let i = index"
                class="item-card group-item"
                cdkDrag
                [@itemAnimation]>
                
                <div class="item-content">
                  <div class="drag-handle" cdkDragHandle matTooltip="Drag to reorder">
                    <mat-icon>drag_indicator</mat-icon>
                  </div>
                  
                  <div class="item-info">
                    <div class="item-header-row">
                      <div class="item-name">
                        <mat-icon class="item-type-icon">layers</mat-icon>
                        {{ group.displayName }}
                      </div>
                      <mat-chip class="hierarchy-badge">Level {{ i + 1 }}</mat-chip>
                    </div>
                    <div class="item-meta">
                      <span class="table-name">{{ group.tableName }}.{{ group.fieldName }}</span>
                    </div>
                  </div>
                  
                  <button 
                    mat-icon-button
                    color="warn"
                    class="remove-btn"
                    (click)="removeGroupBy(i)"
                    matTooltip="Remove this group">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>

                <div class="hierarchy-info">
                  <mat-icon class="info-icon">info</mat-icon>
                  <span>Records will be grouped by {{ group.displayName }}{{ i < groupBy.length - 1 ? ', then by ' + groupBy[i + 1].displayName : '' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div class="empty-state" *ngIf="groupBy.length === 0">
            <mat-icon class="empty-icon">layers_clear</mat-icon>
            <h4>No Grouping Applied</h4>
            <p>Your report will show individual records without grouping.</p>
            <p class="hint-text">Add a field above to create groups and subtotals.</p>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Sorting Section -->
      <mat-card class="section-card sorting-section">
        <mat-card-header>
          <div class="section-header">
            <div class="section-title">
              <mat-icon class="section-icon">sort</mat-icon>
              <h4>Sort Order</h4>
            </div>
            <p class="section-description">
              <mat-icon class="info-icon">info</mat-icon>
              Define the order in which records will be displayed
            </p>
          </div>
        </mat-card-header>

        <mat-card-content>
          <!-- Add Sort Controls -->
          <div class="add-controls">
            <mat-select 
              [(ngModel)]="selectedSortFieldId"
              placeholder="Select a field to sort by..."
              class="field-select">
              <mat-option 
                *ngFor="let field of availableFields"
                [value]="field.id">
                <div class="option-content">
                  <span class="field-name">{{ field.displayName }}</span>
                  <span class="field-type">{{ getFieldTypeDisplay(field.dataType) }}</span>
                </div>
              </mat-option>
            </mat-select>

            <mat-select 
              [(ngModel)]="selectedSortDirection"
              class="direction-select">
              <mat-option value="asc">
                <mat-icon>arrow_upward</mat-icon>
                Ascending (A→Z, 1→9)
              </mat-option>
              <mat-option value="desc">
                <mat-icon>arrow_downward</mat-icon>
                Descending (Z→A, 9→1)
              </mat-option>
            </mat-select>

            <button 
              mat-raised-button
              color="primary"
              class="add-btn"
              [disabled]="!selectedSortFieldId"
              (click)="addSort()"
              matTooltip="Add this field to sort order">
              <mat-icon>add_circle</mat-icon>
              Add Sort
            </button>
          </div>

          <!-- Current Sorts -->
          <div class="current-items" *ngIf="sorting.length > 0">
            <div class="items-header">
              <h5>
                <mat-icon>format_list_numbered</mat-icon>
                Sort Priority ({{ sorting.length }})
              </h5>
              <button 
                mat-button
                color="warn"
                class="clear-all-btn"
                (click)="clearAllSorts()"
                matTooltip="Remove all sorting">
                <mat-icon>clear_all</mat-icon>
                Clear All
              </button>
            </div>

            <div 
              class="items-list"
              cdkDropList
              [cdkDropListData]="sorting"
              (cdkDropListDropped)="onSortDropped($event)"
              [@listAnimation]>
              <div 
                *ngFor="let sort of sorting; let i = index"
                class="item-card sort-item"
                cdkDrag
                [@itemAnimation]>
                
                <div class="item-content">
                  <div class="drag-handle" cdkDragHandle matTooltip="Drag to reorder">
                    <mat-icon>drag_indicator</mat-icon>
                  </div>
                  
                  <div class="item-info">
                    <div class="item-header-row">
                      <div class="item-name">
                        <mat-icon class="item-type-icon">{{ sort.direction === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                        {{ sort.displayName }}
                      </div>
                      <mat-chip class="priority-badge">Priority {{ i + 1 }}</mat-chip>
                    </div>
                    <div class="item-meta">
                      <span class="table-name">{{ sort.tableName }}.{{ sort.fieldName }}</span>
                      <span class="direction-badge" [class.asc]="sort.direction === 'asc'" [class.desc]="sort.direction === 'desc'">
                        {{ sort.direction === 'asc' ? 'Ascending' : 'Descending' }}
                      </span>
                    </div>
                  </div>

                  <div class="item-actions">
                    <button 
                      mat-icon-button
                      class="toggle-direction-btn"
                      (click)="toggleSortDirection(i)"
                      [matTooltip]="'Switch to ' + (sort.direction === 'asc' ? 'descending' : 'ascending')">
                      <mat-icon>swap_vert</mat-icon>
                    </button>
                    <button 
                      mat-icon-button
                      color="warn"
                      class="remove-btn"
                      (click)="removeSort(i)"
                      matTooltip="Remove this sort">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div class="empty-state" *ngIf="sorting.length === 0">
            <mat-icon class="empty-icon">sort_by_alpha</mat-icon>
            <h4>No Sorting Applied</h4>
            <p>Data will be displayed in the default database order.</p>
            <p class="hint-text">Add a field above to control the sort order.</p>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Summary Section -->
      <mat-card class="section-card summary-section" *ngIf="groupBy.length > 0 || sorting.length > 0">
        <mat-card-header>
          <div class="section-header">
            <div class="section-title">
              <mat-icon class="section-icon">summarize</mat-icon>
              <h4>Organization Summary</h4>
            </div>
          </div>
        </mat-card-header>

        <mat-card-content>
          <div class="summary-content">
            <div class="summary-item" *ngIf="groupBy.length > 0">
              <div class="summary-label">
                <mat-icon>layers</mat-icon>
                <strong>Grouping:</strong>
              </div>
              <div class="summary-value">{{ getGroupByPreview() }}</div>
            </div>
            
            <div class="summary-item" *ngIf="sorting.length > 0">
              <div class="summary-label">
                <mat-icon>sort</mat-icon>
                <strong>Sorting:</strong>
              </div>
              <div class="summary-value">{{ getSortPreview() }}</div>
            </div>

            <div class="summary-explanation">
              <mat-icon class="explanation-icon">lightbulb</mat-icon>
              <p>{{ getOrganizationExplanation() }}</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  </div>
`
  ,
  styleUrls: ['./group-sorting.component.scss'],
  animations: [
    trigger('listAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('itemAnimation', [
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
export class GroupSortingComponent implements OnInit, OnChanges {
    @Input() availableFields: SelectedField[] = [];
    @Input() groupBy: GroupByField[] = [];
    @Input() sorting: SortField[] = [];
    @Output() groupingChanged = new EventEmitter<GroupByField[]>();
    @Output() sortingChanged = new EventEmitter<SortField[]>();

    faPlus = faPlus;
    faTimes = faTimes;
    faGripVertical = faGripVertical;
    faLayerGroup = faLayerGroup;
    faSort = faSort;
    faArrowUp = faArrowUp;
    faArrowDown = faArrowDown;
    faInfoCircle = faInfoCircle;

    selectedSortFieldId: string = '';
    selectedGroupFieldId: string = '';
    selectedSortDirection: 'asc' | 'desc' = 'asc';

    get availableGroupFields(): SelectedField[] {
        // Only show fields suitable for grouping (non-aggregated fields)
        return this.availableFields.filter(field => !field.aggregation);
    }

    ngOnInit(): void {
        console.log('🔷 GroupSortingComponent ngOnInit');
        console.log('  📊 availableFields:', this.availableFields.length, this.availableFields);
        console.log('  📦 groupBy:', this.groupBy.length, this.groupBy);
        console.log('  🔀 sorting:', this.sorting.length, this.sorting);
        this.syncFieldReferences();
    }

    ngOnChanges(changes: SimpleChanges): void {
        console.log('🔷 GroupSortingComponent ngOnChanges', changes);
        
        if (changes['availableFields']) {
            console.log('  📊 availableFields changed:', {
                previousValue: changes['availableFields'].previousValue?.length,
                currentValue: changes['availableFields'].currentValue?.length,
                isFirstChange: changes['availableFields'].firstChange
            });
        }
        
        if (changes['groupBy']) {
            console.log('  📦 groupBy changed:', {
                previousValue: changes['groupBy'].previousValue,
                currentValue: changes['groupBy'].currentValue,
                isFirstChange: changes['groupBy'].firstChange
            });
        }
        
        if (changes['sorting']) {
            console.log('  🔀 sorting changed:', {
                previousValue: changes['sorting'].previousValue,
                currentValue: changes['sorting'].currentValue,
                isFirstChange: changes['sorting'].firstChange
            });
        }
        
        // Sync whenever availableFields, groupBy, or sorting changes
        if ((changes['availableFields'] && this.availableFields.length > 0) ||
            (changes['groupBy'] && this.groupBy.length > 0) ||
            (changes['sorting'] && this.sorting.length > 0)) {
            console.log('  ⏱️ Scheduling syncFieldReferences...');
            // Use setTimeout to ensure all inputs are set
            setTimeout(() => this.syncFieldReferences(), 0);
        }
    }

    /**
     * Sync groupBy and sorting field data with availableFields to ensure they display correctly
     */
    private syncFieldReferences(): void {
        console.log('🔄 syncFieldReferences called');
        console.log('  📊 availableFields.length:', this.availableFields.length);
        console.log('  📦 groupBy.length:', this.groupBy.length);
        console.log('  🔀 sorting.length:', this.sorting.length);
        
        if (!this.availableFields.length) {
            console.log('  ⚠️ No availableFields, skipping sync');
            return;
        }

        // Sync groupBy fields
        if (this.groupBy.length > 0) {
            console.log('  📦 Syncing groupBy fields...');
            console.log('    Before:', JSON.stringify(this.groupBy, null, 2));
            
            const updatedGroupBy = this.groupBy.map((group, index) => {
                console.log(`    🔍 Processing group[${index}]:`, group);
                
                // If displayName is already set and valid, keep it
                if (group.displayName) {
                    console.log(`      ✅ displayName already set: "${group.displayName}"`);
                    return group;
                }

                console.log(`      ⚠️ No displayName, searching for match...`);
                
                // Otherwise, try to find the matching field
                const matchingField = this.availableFields.find(f => 
                    f.id === group.id || 
                    (f.tableName === group.tableName && f.fieldName === group.fieldName)
                );

                if (matchingField) {
                    console.log(`      ✅ Found matching field:`, matchingField);
                    // Update with current field data from availableFields
                    return {
                        ...group,
                        id: matchingField.id,
                        tableName: matchingField.tableName,
                        fieldName: matchingField.fieldName,
                        displayName: matchingField.displayName
                    };
                }
                
                console.log(`      ⚠️ No matching field found, using fieldName as fallback`);
                // If no match found, use fieldName as displayName
                return {
                    ...group,
                    displayName: group.displayName || group.fieldName
                };
            });

            console.log('    After:', JSON.stringify(updatedGroupBy, null, 2));

            // Only update if something changed
            if (JSON.stringify(updatedGroupBy) !== JSON.stringify(this.groupBy)) {
                console.log('    ✅ Updating groupBy array');
                this.groupBy = updatedGroupBy;
            } else {
                console.log('    ℹ️ No changes needed');
            }
        }

        // Sync sorting fields
        if (this.sorting.length > 0) {
            console.log('  🔀 Syncing sorting fields...');
            console.log('    Before:', JSON.stringify(this.sorting, null, 2));
            
            const updatedSorting = this.sorting.map((sort, index) => {
                console.log(`    🔍 Processing sort[${index}]:`, sort);
                
                // If displayName is already set and valid, keep it
                if (sort.displayName) {
                    console.log(`      ✅ displayName already set: "${sort.displayName}"`);
                    return sort;
                }

                console.log(`      ⚠️ No displayName, searching for match...`);
                
                // Otherwise, try to find the matching field
                const matchingField = this.availableFields.find(f => 
                    f.id === sort.id || 
                    (f.tableName === sort.tableName && f.fieldName === sort.fieldName)
                );

                if (matchingField) {
                    console.log(`      ✅ Found matching field:`, matchingField);
                    // Update with current field data from availableFields
                    return {
                        ...sort,
                        id: matchingField.id,
                        tableName: matchingField.tableName,
                        fieldName: matchingField.fieldName,
                        displayName: matchingField.displayName
                    };
                }
                
                console.log(`      ⚠️ No matching field found, using fieldName as fallback`);
                // If no match found, use fieldName as displayName
                return {
                    ...sort,
                    displayName: sort.displayName || sort.fieldName
                };
            });

            console.log('    After:', JSON.stringify(updatedSorting, null, 2));

            // Only update if something changed
            if (JSON.stringify(updatedSorting) !== JSON.stringify(this.sorting)) {
                console.log('    ✅ Updating sorting array');
                this.sorting = updatedSorting;
            } else {
                console.log('    ℹ️ No changes needed');
            }
        }
        
        console.log('🔄 syncFieldReferences complete');
    }

    // Grouping Methods
    addGroupBy(): void {
        console.log('➕ addGroupBy called');
        console.log('  selectedGroupFieldId:', this.selectedGroupFieldId);
        
        if (!this.selectedGroupFieldId) return;

        const selectedField = this.availableFields.find(f => f.id === this.selectedGroupFieldId);
        console.log('  selectedField:', selectedField);
        
        if (selectedField && !this.isFieldGrouped(selectedField)) {
            const newGroup: GroupByField = {
                id: selectedField.id,
                tableName: selectedField.tableName,
                fieldName: selectedField.fieldName,
                displayName: selectedField.displayName
            };
            console.log('  Creating new group:', newGroup);
            this.groupBy = [...this.groupBy, newGroup];
            console.log('  Updated groupBy array:', this.groupBy);
            this.selectedGroupFieldId = '';
            this.emitGroupingChanges();
        } else {
            console.log('  ⚠️ Field not added (already grouped or not found)');
        }
    }

    removeGroupBy(index: number): void {
        this.groupBy = this.groupBy.filter((_, i) => i !== index);
        this.emitGroupingChanges();
    }

    clearAllGroups(): void {
        if (confirm('Are you sure you want to remove all grouping?')) {
            this.groupBy = [];
            this.emitGroupingChanges();
        }
    }

    onGroupDropped(event: CdkDragDrop<GroupByField[]>): void {
        moveItemInArray(this.groupBy, event.previousIndex, event.currentIndex);
        this.emitGroupingChanges();
    }

    isFieldGrouped(field: SelectedField): boolean {
        return this.groupBy.some(group => group.id === field.id);
    }

    // Sorting Methods
    addSort(): void {
        console.log('➕ addSort called');
        console.log('  selectedSortFieldId:', this.selectedSortFieldId);
        console.log('  selectedSortDirection:', this.selectedSortDirection);
        
        if (!this.selectedSortFieldId) return;

        const selectedField = this.availableFields.find(f => f.id === this.selectedSortFieldId);
        console.log('  selectedField:', selectedField);
        
        if (selectedField) {
            const newSort: SortField = {
                id: selectedField.id,
                tableName: selectedField.tableName,
                fieldName: selectedField.fieldName,
                displayName: selectedField.displayName,
                direction: this.selectedSortDirection
            };
            console.log('  Creating new sort:', newSort);
            this.sorting = [...this.sorting, newSort];
            console.log('  Updated sorting array:', this.sorting);
            this.selectedSortFieldId = '';
            this.emitSortingChanges();
        } else {
            console.log('  ⚠️ Field not found');
        }
    }

    removeSort(index: number): void {
        this.sorting = this.sorting.filter((_, i) => i !== index);
        this.emitSortingChanges();
    }

    clearAllSorts(): void {
        if (confirm('Are you sure you want to remove all sorting?')) {
            this.sorting = [];
            this.emitSortingChanges();
        }
    }

    toggleSortDirection(index: number): void {
        const sort = this.sorting[index];
        if (sort) {
            sort.direction = sort.direction === 'asc' ? 'desc' : 'asc';
            this.emitSortingChanges();
        }
    }

    onSortDropped(event: CdkDragDrop<SortField[]>): void {
        moveItemInArray(this.sorting, event.previousIndex, event.currentIndex);
        this.emitSortingChanges();
    }

    // Preview Methods
    getGroupByPreview(): string {
        if (this.groupBy.length === 0) return 'None';
        return this.groupBy.map((group, i) => {
            const level = i + 1;
            return `Level ${level}: ${group.displayName}`;
        }).join(' → ');
    }

    getSortPreview(): string {
        if (this.sorting.length === 0) return 'None';
        return this.sorting.map((sort, i) => {
            const direction = sort.direction === 'asc' ? '↑' : '↓';
            return `${i + 1}. ${sort.displayName} ${direction}`;
        }).join(', then ');
    }

    getOrganizationExplanation(): string {
        const parts: string[] = [];

        if (this.groupBy.length > 0) {
            const groupNames = this.groupBy.map(g => g.displayName).join(', then by ');
            parts.push(`Data will be grouped by ${groupNames}`);
        }

        if (this.sorting.length > 0) {
            if (this.groupBy.length > 0) {
                parts.push('Within each group');
            } else {
                parts.push('Data will be');
            }
            
            const sortDescriptions = this.sorting.map((sort, i) => {
                const direction = sort.direction === 'asc' ? 'ascending' : 'descending';
                const priority = i === 0 ? 'sorted' : 'then sorted';
                return `${priority} by ${sort.displayName} (${direction})`;
            });
            parts.push(sortDescriptions.join(', '));
        }

        if (parts.length === 0) {
            return 'No organization applied. Records will appear in default order.';
        }

        return parts.join(this.groupBy.length > 0 && this.sorting.length > 0 ? ', ' : ' ') + '.';
    }

    // Utility Methods
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
        const typeStr = String(dataType);
        return typeMap[typeStr.toLowerCase()] || 'Text';
    }

    private emitGroupingChanges(): void {
        this.groupingChanged.emit(this.groupBy);
    }

    private emitSortingChanges(): void {
        this.sortingChanged.emit(this.sorting);
    }
}