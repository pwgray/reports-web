import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { LayoutConfiguration, ReportDefinition, FieldDataType } from "../../core/models/report.models";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faEye, faCog, faTable, faChartBar, faFileAlt, faDownload } from "@fortawesome/free-solid-svg-icons";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { LayoutSettingsDialogComponent } from "../layout-settings-dialog/layout-settings-dialog.component";

@Component({
  selector: 'app-layout-preview',
  imports: [CommonModule, FontAwesomeModule, MatDialogModule],
  template: `
    <div class="layout-preview">
      <div class="preview-header">
        <h2>Report Preview</h2>
        <div class="preview-actions">
          <button class="btn btn-secondary" (click)="openLayoutSettings()">
            <fa-icon [icon]="faCog"></fa-icon>
            Layout Settings
          </button>
          <button class="btn btn-primary" (click)="exportReport()">
            <fa-icon [icon]="faDownload"></fa-icon>
            Export Report
          </button>
        </div>
      </div>

      <div class="preview-content" *ngIf="report && report.selectedFields.length">
        <!-- Report Summary -->
        <div class="report-summary">
          <div class="summary-item">
            <strong>Data Source:</strong> {{ report.dataSource.name || 'Not selected' }}
          </div>
          <div class="summary-item">
            <strong>Fields:</strong> {{ report.selectedFields.length || 0 }} selected
          </div>
          <div class="summary-item">
            <strong>Filters:</strong> {{ report.filters.length || 0 }} applied
          </div>
          <div class="summary-item">
            <strong>Grouping:</strong> {{ report.groupBy.length || 0 }} groups
          </div>
          <div class="summary-item">
            <strong>Sorting:</strong> {{ report.sorting.length || 0 }} sorts
          </div>
        </div>

        <!-- Report Structure Preview -->
        <div class="report-structure">
          <h3>Report Structure</h3>
          
          <!-- Selected Fields -->
          <div class="structure-section">
            <h4><fa-icon [icon]="faTable"></fa-icon> Selected Fields</h4>
            <div class="fields-grid">
              <div 
                *ngFor="let field of report.selectedFields; let i = index"
                class="field-item">
                <div class="field-header">
                  <span class="field-number">{{ i + 1 }}</span>
                  <span class="field-name">{{ field.displayName }}</span>
                  <span class="field-type">{{ getFieldTypeDisplay(field.dataType) }}</span>
                </div>
                <div class="field-details">
                  <span class="table-name">{{ field.tableName }}</span>
                  <span class="field-name-small">{{ field.fieldName }}</span>
                  <span *ngIf="field.aggregation" class="aggregation">
                    {{ field.aggregation }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Filters -->
          <div class="structure-section" *ngIf="report.filters?.length">
            <h4>Filters</h4>
            <div class="filters-list">
              <div 
                *ngFor="let filter of report.filters"
                class="filter-item">
                <span class="filter-field">{{ filter.field.displayName }}</span>
                <span class="filter-operator">{{ filter.operator }}</span>
                <span class="filter-value">{{ filter.displayText }}</span>
              </div>
            </div>
          </div>

          <!-- Grouping -->
          <div class="structure-section" *ngIf="report.groupBy?.length">
            <h4>Grouping</h4>
            <div class="grouping-list">
              <div 
                *ngFor="let group of report.groupBy; let i = index"
                class="group-item">
                <span class="group-number">{{ i + 1 }}</span>
                <span class="group-field">{{ group.displayName }}</span>
                <span class="group-table">{{ group.tableName }}</span>
              </div>
            </div>
          </div>

          <!-- Sorting -->
          <div class="structure-section" *ngIf="report.sorting?.length">
            <h4>Sorting</h4>
            <div class="sorting-list">
              <div 
                *ngFor="let sort of report.sorting; let i = index"
                class="sort-item">
                <span class="sort-number">{{ i + 1 }}</span>
                <span class="sort-field">{{ sort.displayName }}</span>
                <span class="sort-direction" [class]="sort.direction">
                  {{ sort.direction === 'asc' ? '↑' : '↓' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Table Relationships -->
          <div class="structure-section" *ngIf="getTablesInReport().length > 1">
            <h4><fa-icon [icon]="faChartBar"></fa-icon> Table Relationships</h4>
            <div class="relationships-info">
              <div class="relationship-note">
                <strong>Multi-table Report:</strong> This report combines data from {{ getTablesInReport().length }} tables.
                The preview shows how master-child relationships will be reflected in the final data.
              </div>
              <div class="tables-involved">
                <div class="table-chip" *ngFor="let table of getTablesInReport()" [class.master-table]="isTableMaster(table)">
                  <fa-icon [icon]="faTable"></fa-icon>
                  {{ table }}
                  <span class="table-role" *ngIf="isTableMaster(table)">Master</span>
                  <span class="table-role child" *ngIf="!isTableMaster(table)">Child</span>
                </div>
              </div>
              <div class="relationship-explanation">
                <small>
                  Master table records are joined with related child table records. 
                  Each master record may appear multiple times if it has multiple related child records.
                </small>
              </div>
            </div>
          </div>
        </div>

                 <!-- Layout Configuration -->
         <div class="layout-config" *ngIf="report.layout">
           <h3>Layout Configuration</h3>
           <div class="layout-settings">
             <div class="setting-item" *ngIf="report.layout.orientation">
               <strong>Orientation:</strong> {{ report.layout.orientation }}
             </div>
             <div class="setting-item" *ngIf="report.layout.pageSize">
               <strong>Page Size:</strong> {{ report.layout.pageSize }}
             </div>
             <div class="setting-item" *ngIf="report.layout.showHeader !== undefined">
               <strong>Show Header:</strong> {{ report.layout.showHeader ? 'Yes' : 'No' }}
             </div>
             <div class="setting-item" *ngIf="report.layout.showFooter !== undefined">
               <strong>Show Footer:</strong> {{ report.layout.showFooter ? 'Yes' : 'No' }}
             </div>
             <div class="setting-item" *ngIf="report.layout.showPageNumbers !== undefined">
               <strong>Page Numbers:</strong> {{ report.layout.showPageNumbers ? 'Yes' : 'No' }}
             </div>
             <div class="setting-item" *ngIf="report.layout.showGridLines !== undefined">
               <strong>Grid Lines:</strong> {{ report.layout.showGridLines ? 'Yes' : 'No' }}
             </div>
             <div class="setting-item" *ngIf="report.layout.topMargin">
               <strong>Margins:</strong> {{ report.layout.topMargin }}mm top, {{ report.layout.bottomMargin }}mm bottom, {{ report.layout.leftMargin }}mm left, {{ report.layout.rightMargin }}mm right
             </div>
             <div class="setting-item" *ngIf="report.layout.headerFontSize">
               <strong>Font Sizes:</strong> Header {{ report.layout.headerFontSize }}pt, Body {{ report.layout.bodyFontSize }}pt
             </div>
             <div class="setting-item" *ngIf="report.layout.repeatHeaderOnEachPage !== undefined">
               <strong>Repeat Header:</strong> {{ report.layout.repeatHeaderOnEachPage ? 'Yes' : 'No' }}
             </div>
             <div class="setting-item" *ngIf="report.layout.fitToPage !== undefined">
               <strong>Fit to Page:</strong> {{ report.layout.fitToPage ? 'Yes' : 'No' }}
             </div>
           </div>
         </div>

                 <!-- Mock Data Preview -->
         <div class="data-preview">
           <h3>Sample Data Preview</h3>
           <div class="table-container">
             <table class="preview-table" [class.grouped-table]="report.groupBy.length">
               <thead>
                 <tr>
                   <th *ngFor="let field of report.selectedFields" 
                       [class.group-header]="isGroupField(field)"
                       [class.data-header]="!isGroupField(field)">
                     {{ field.displayName }}
                     <div class="field-meta">
                       <span class="field-type">{{ getFieldTypeDisplay(field.dataType) }}</span>
                       <span *ngIf="field.aggregation" class="aggregation">{{ field.aggregation }}</span>
                       <span *ngIf="isGroupField(field)" class="group-indicator">Group</span>
                     </div>
                   </th>
                 </tr>
               </thead>
               <tbody>
                 <ng-container *ngIf="report.groupBy?.length; else simpleTable">
                   <ng-container *ngFor="let group of getGroupedMockData(); let groupIndex = index">
                     <!-- Group Header Row -->
                     <tr class="group-header-row" *ngFor="let groupField of report.groupBy; let fieldIndex = index">
                       <td [attr.colspan]="report.selectedFields.length" class="group-header-cell">
                         <div class="group-header-content">
                           <span class="group-label">{{ groupField.displayName }}:</span>
                           <span class="group-value">{{ getGroupValue(groupField, groupIndex) }}</span>
                           <span class="group-count">({{ group.items.length }} items)</span>
                         </div>
                       </td>
                     </tr>
                     <!-- Data Rows for this Group -->
                     <tr *ngFor="let row of group.items; let rowIndex = index" 
                         class="data-row"
                         [class.grouped-row]="true">
                       <td *ngFor="let field of report.selectedFields" 
                           [class.group-field]="isGroupField(field)"
                           [class.data-field]="!isGroupField(field)">
                         <span *ngIf="isGroupField(field)" class="group-field-indent">└─</span>
                         {{ getMockValue(field, rowIndex, groupIndex) }}
                       </td>
                     </tr>
                     <!-- Group Summary Row (if aggregations exist) -->
                     <tr class="group-summary-row" *ngIf="hasAggregations()">
                       <td *ngFor="let field of report.selectedFields" class="summary-cell">
                         <span *ngIf="field.aggregation" class="aggregation-summary">
                           {{ field.aggregation }}: {{ getAggregationValue(field, group.items) }}
                         </span>
                       </td>
                     </tr>
                   </ng-container>
                 </ng-container>
                 
                 <ng-template #simpleTable>
                   <tr *ngFor="let row of getMockData(); let i = index">
                     <td *ngFor="let field of report.selectedFields">
                       {{ getMockValue(field, i) }}
                     </td>
                   </tr>
                 </ng-template>
               </tbody>
             </table>
           </div>
                       <div class="preview-note">
              <fa-icon [icon]="faEye"></fa-icon>
              This is a preview with sample data. Actual results will depend on your data source.
              <span *ngIf="report.groupBy?.length">Data is grouped by {{ getGroupByDisplayNames() }}.</span>
            </div>
         </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!report || !report.selectedFields?.length">
        <fa-icon [icon]="faFileAlt"></fa-icon>
        <h3>No Report to Preview</h3>
        <p>Please complete the previous steps to see a preview of your report.</p>
        <div class="empty-requirements">
          <div class="requirement" [class.completed]="report.dataSource">
            <span class="requirement-icon">✓</span>
            <span>Select a data source</span>
          </div>
          <div class="requirement" [class.completed]="report.selectedFields.length">
            <span class="requirement-icon">✓</span>
            <span>Choose fields to include</span>
          </div>
          <div class="requirement" [class.completed]="true">
            <span class="requirement-icon">✓</span>
            <span>Configure filters (optional)</span>
          </div>
          <div class="requirement" [class.completed]="true">
            <span class="requirement-icon">✓</span>
            <span>Set grouping and sorting (optional)</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./layout-preview.component.scss']
})
export class LayoutPreviewComponent {
    @Input() report: ReportDefinition = {} as ReportDefinition;
    @Output() layoutChanged = new EventEmitter<LayoutConfiguration>();

    constructor(private dialog: MatDialog) {}

    // FontAwesome icons
    faEye = faEye;
    faCog = faCog;
    faTable = faTable;
    faChartBar = faChartBar;
    faFileAlt = faFileAlt;
    faDownload = faDownload;

    getFieldTypeDisplay(dataType: FieldDataType): string {
      switch (dataType) {
        case FieldDataType.STRING:
          return 'Text';
        case FieldDataType.NUMBER:
          return 'Number';
        case FieldDataType.DATE:
          return 'Date';
        case FieldDataType.BOOLEAN:
          return 'Yes/No';
        case FieldDataType.CURRENCY:
          return 'Currency';
        default:
          return 'Unknown';
      }
    }

    getMockData(): any[] {
      return this.generateRelationshipAwareMockData();
    }

    private generateRelationshipAwareMockData(): any[] {
      const tablesInReport = this.getTablesInReport();
      
      if (tablesInReport.length === 1) {
        // Single table - use simple mock data
        return this.generateSimpleMockData(tablesInReport[0]);
      }
      
      // Multiple tables - generate relationship-aware data
      return this.generateJoinedMockData(tablesInReport);
    }

    getTablesInReport(): string[] {
      if (!this.report.selectedFields) return [];
      
      const tables = new Set<string>();
      this.report.selectedFields.forEach(field => {
        if (field.tableName) {
          tables.add(field.tableName);
        }
      });
      
      return Array.from(tables);
    }

    private generateSimpleMockData(tableName: string): any[] {
      const baseData = [
        { id: 1, name: 'Sample Data 1', value: 100, date: '2024-01-15', status: true },
        { id: 2, name: 'Sample Data 2', value: 250, date: '2024-01-16', status: false },
        { id: 3, name: 'Sample Data 3', value: 75, date: '2024-01-17', status: true },
        { id: 4, name: 'Sample Data 4', value: 300, date: '2024-01-18', status: false },
        { id: 5, name: 'Sample Data 5', value: 125, date: '2024-01-19', status: true }
      ];

      // Customize data based on table name
      return baseData.map((item, index) => {
        const customizedItem: any = { ...item };
        
        switch (tableName.toLowerCase()) {
          case 'customers':
            customizedItem.customer_id = `CUST${String(index + 1).padStart(3, '0')}`;
            customizedItem.company_name = `Company ${index + 1}`;
            customizedItem.contact_name = `Contact ${index + 1}`;
            customizedItem.country = ['USA', 'Canada', 'UK', 'Germany', 'France'][index % 5];
            break;
          case 'orders':
            customizedItem.order_id = 10000 + index;
            customizedItem.customer_id = `CUST${String((index % 3) + 1).padStart(3, '0')}`;
            customizedItem.order_date = new Date(2024, 0, 15 + index).toISOString().split('T')[0];
            customizedItem.freight = (Math.random() * 100).toFixed(2);
            break;
          case 'order_details':
            customizedItem.order_id = 10000 + Math.floor(index / 2);
            customizedItem.product_id = index + 1;
            customizedItem.quantity = Math.floor(Math.random() * 10) + 1;
            customizedItem.unit_price = (Math.random() * 50 + 10).toFixed(2);
            break;
          case 'products':
            customizedItem.product_id = index + 1;
            customizedItem.product_name = `Product ${index + 1}`;
            customizedItem.unit_price = (Math.random() * 100 + 10).toFixed(2);
            customizedItem.units_in_stock = Math.floor(Math.random() * 100);
            break;
        }
        
        return customizedItem;
      });
    }

    private generateJoinedMockData(tables: string[]): any[] {
      // Generate master-child relationship data
      const masterTable = this.identifyMasterTable(tables);
      const joinedData: any[] = [];
      
      // Create base records for master table
      const masterRecords = this.generateSimpleMockData(masterTable);
      
      masterRecords.forEach((masterRecord, masterIndex) => {
        // For each master record, create related child records
        tables.forEach(table => {
          if (table === masterTable) return;
          
          const childRecords = this.generateRelatedChildRecords(masterRecord, table, masterIndex);
          
          if (childRecords.length > 0) {
            childRecords.forEach(childRecord => {
              // Merge master and child data
              const joinedRecord = { ...masterRecord, ...childRecord };
              joinedData.push(joinedRecord);
            });
          } else {
            // No child records, just add master record
            joinedData.push(masterRecord);
          }
        });
        
        // If only master table fields selected, add master record
        if (tables.length === 1) {
          joinedData.push(masterRecord);
        }
      });
      
      return joinedData.slice(0, 10); // Limit to reasonable preview size
    }

    private identifyMasterTable(tables: string[]): string {
      // Simple heuristic: customers > orders > order_details > products
      const hierarchy = ['customers', 'orders', 'order_details', 'products'];
      
      for (const masterCandidate of hierarchy) {
        if (tables.includes(masterCandidate)) {
          return masterCandidate;
        }
      }
      
      return tables[0]; // Fallback to first table
    }

    private generateRelatedChildRecords(masterRecord: any, childTable: string, masterIndex: number): any[] {
      const childRecords: any[] = [];
      
      switch (childTable.toLowerCase()) {
        case 'orders':
          // Each customer has 1-3 orders
          const orderCount = Math.floor(Math.random() * 3) + 1;
          for (let i = 0; i < orderCount; i++) {
            childRecords.push({
              order_id: 10000 + (masterIndex * 3) + i,
              customer_id: masterRecord.customer_id,
              order_date: new Date(2024, 0, 15 + (masterIndex * 3) + i).toISOString().split('T')[0],
              freight: (Math.random() * 100).toFixed(2)
            });
          }
          break;
          
        case 'order_details':
          // Each order has 1-4 order details
          const detailCount = Math.floor(Math.random() * 4) + 1;
          for (let i = 0; i < detailCount; i++) {
            childRecords.push({
              order_id: masterRecord.order_id,
              product_id: (masterIndex * 4) + i + 1,
              quantity: Math.floor(Math.random() * 10) + 1,
              unit_price: (Math.random() * 50 + 10).toFixed(2)
            });
          }
          break;
          
        case 'products':
          // Products referenced by order details
          if (masterRecord.product_id) {
            childRecords.push({
              product_id: masterRecord.product_id,
              product_name: `Product ${masterRecord.product_id}`,
              unit_price: (Math.random() * 100 + 10).toFixed(2),
              units_in_stock: Math.floor(Math.random() * 100)
            });
          }
          break;
      }
      
      return childRecords;
    }

    getMockValue(field: any, rowIndex: number, groupIndex?: number): string {
      const mockData = this.getMockData();
      const row = mockData[rowIndex % mockData.length];
      
      // Try to get the actual field value from the row first
      const fieldKey = field.fieldName || field.name;
      let value = row[fieldKey];
      
      // If field value exists, format it according to data type
      if (value !== undefined && value !== null) {
        return this.formatValue(value, field.dataType);
      }
      
      // Fallback to generic value based on data type
      switch (field.dataType) {
        case FieldDataType.CURRENCY:
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(row.value || Math.random() * 100);
        case FieldDataType.NUMBER:
          return new Intl.NumberFormat().format(row.value || Math.floor(Math.random() * 1000));
        case FieldDataType.DATE:
          return new Date(row.date || new Date()).toLocaleDateString();
        case FieldDataType.BOOLEAN:
          return row.status !== undefined ? (row.status ? 'Yes' : 'No') : (Math.random() > 0.5 ? 'Yes' : 'No');
        case FieldDataType.STRING:
        default:
          return row.name || `Sample ${field.displayName} ${rowIndex + 1}`;
      }
    }

    private formatValue(value: any, dataType: FieldDataType): string {
      switch (dataType) {
        case FieldDataType.CURRENCY:
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(parseFloat(value) || 0);
        case FieldDataType.NUMBER:
          return new Intl.NumberFormat().format(parseFloat(value) || 0);
        case FieldDataType.DATE:
          return new Date(value).toLocaleDateString();
        case FieldDataType.BOOLEAN:
          return value ? 'Yes' : 'No';
        case FieldDataType.STRING:
        default:
          return String(value);
      }
    }

    isGroupField(field: any): boolean {
      return this.report.groupBy?.some(group => group.id === field.id) || false;
    }

    getGroupedMockData(): any[] {
      if (!this.report.groupBy?.length) {
        return [];
      }

      const mockData = this.getMockData();
      const groups: { [key: string]: any[] } = {};

      // Group the data by the first group field
      const groupField = this.report.groupBy[0];
      mockData.forEach((row, index) => {
        const groupKey = this.getGroupKey(row, groupField, index);
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(row);
      });

      return Object.keys(groups).map(groupKey => ({
        key: groupKey,
        items: groups[groupKey]
      }));
    }

    getGroupKey(row: any, groupField: any, index: number): string {
      // Create different group keys based on the field type
      switch (groupField.fieldName) {
        case 'category':
          return `Category ${Math.floor(index / 2) + 1}`;
        case 'region':
          return `Region ${String.fromCharCode(65 + (index % 3))}`; // A, B, C
        case 'status':
          return index % 2 === 0 ? 'Active' : 'Inactive';
        default:
          return `Group ${Math.floor(index / 3) + 1}`;
      }
    }

    getGroupValue(groupField: any, groupIndex: number): string {
      const groupKey = this.getGroupedMockData()[groupIndex]?.key;
      return groupKey || `Group ${groupIndex + 1}`;
    }

    hasAggregations(): boolean {
      return this.report.selectedFields?.some(field => field.aggregation) || false;
    }

    getAggregationValue(field: any, items: any[]): string {
      if (!field.aggregation) return '';

      const values = items.map(item => {
        switch (field.dataType) {
          case FieldDataType.NUMBER:
          case FieldDataType.CURRENCY:
            return item.value || 0;
          default:
            return 1; // Count for non-numeric fields
        }
      });

      switch (field.aggregation) {
        case 'sum':
          const sum = values.reduce((a, b) => a + b, 0);
          return field.dataType === FieldDataType.CURRENCY 
            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(sum)
            : new Intl.NumberFormat().format(sum);
        case 'avg':
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          return field.dataType === FieldDataType.CURRENCY 
            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(avg)
            : new Intl.NumberFormat().format(avg);
        case 'count':
          return values.length.toString();
        case 'min':
          const min = Math.min(...values);
          return field.dataType === FieldDataType.CURRENCY 
            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(min)
            : new Intl.NumberFormat().format(min);
        case 'max':
          const max = Math.max(...values);
          return field.dataType === FieldDataType.CURRENCY 
            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(max)
            : new Intl.NumberFormat().format(max);
        default:
          return '';
      }
    }

    getGroupByDisplayNames(): string {
      if (!this.report.groupBy?.length) {
        return '';
      }
      return this.report.groupBy.map(g => g.displayName).join(', ');
    }

    exportReport(): void {
      // Placeholder for export functionality
      console.log('Export report:', this.report);
    }

    isTableMaster(tableName: string): boolean {
      const tables = this.getTablesInReport();
      if (tables.length <= 1) return true;
      
      const masterTable = this.identifyMasterTable(tables);
      return tableName === masterTable;
    }

    openLayoutSettings(): void {
      const dialogRef = this.dialog.open(LayoutSettingsDialogComponent, {
        width: '700px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        data: { layout: this.report.layout || {} }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.layoutChanged.emit(result);
        }
      });
    }
}