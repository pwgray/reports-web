// core/models/report.models.ts
import { DataSourceInfo } from './data-source-info.model';

// Define FieldDataType enum or import it if defined elsewhere
export enum FieldDataType {
  STRING = 'string',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  CURRENCY = 'currency',
  SMALLINT = 'smallint',
  BIGINT = 'bigint',
  FLOAT = 'float',
  DOUBLE = 'double',
  DECIMAL = 'decimal',
  NUMERIC = 'numeric',
  MONEY = 'money'
}

export interface ReportDefinition {
  id?: string;
  name: string;
  description?: string | undefined;
  dataSource: DataSourceInfo;
  selectedFields: SelectedField[];
  filters: FilterCondition[];
  groupBy: GroupByField[];
  sorting: SortField[];
  layout: LayoutConfiguration;
  parameters: ReportParameter[];
}

// Define ReportParameter interface
export interface ReportParameter {
  id: string;
  name: string;
  type: string;
  value?: any;
  required?: boolean;
  displayName?: string;
}

// Define LayoutConfiguration interface
export interface LayoutConfiguration {
  orientation?: 'portrait' | 'landscape';
  pageSize?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  showPageNumbers?: boolean;
  showGridLines?: boolean;
  topMargin?: number;
  bottomMargin?: number;
  leftMargin?: number;
  rightMargin?: number;
  headerFontSize?: number;
  bodyFontSize?: number;
  repeatHeaderOnEachPage?: boolean;
  fitToPage?: boolean;
  allowPageBreak?: boolean;
}

// Define SortField interface
export interface SortField {
  id: string;
  tableName: string;
  fieldName: string;
  displayName: string;
  direction: 'asc' | 'desc';
}

export interface SelectedField {
  id: string;
  tableName: string;
  fieldName: string;
  displayName: string;
  dataType: FieldDataType;
  aggregation?: AggregationType;
  formatting?: FieldFormatting;
}

// Define AggregationType enum
export enum AggregationType {
  SUM = 'sum',
  AVG = 'avg',
  COUNT = 'count',
  MIN = 'min',
  MAX = 'max'
}

// Define FieldFormatting interface
export interface FieldFormatting {
  formatType?: 'currency' | 'percentage' | 'decimal' | 'date' | 'string' | 'smallint' | 'bigint' | 'float' | 'double' | 'decimal' | 'numeric' | 'money';
  decimalPlaces?: number;
  dateFormat?: string;
  currencyCode?: string;
  // Add other formatting options as needed
}

export interface FilterCondition {
  id: string;
  field: SelectedField;
  operator: FilterOperator;
  value: any;
  displayText: string;
}

export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  BETWEEN = 'between',
  IN_LIST = 'in_list'
}

// Define GroupByField interface
export interface GroupByField {
  id: string;
  tableName: string;
  fieldName: string;
  displayName: string;
}