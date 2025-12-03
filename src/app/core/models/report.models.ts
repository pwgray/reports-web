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

  // New: optional layout content
  charts?: ChartConfig[];
  widgets?: WidgetConfig[];
  // If provided, the data table is included and should render last
  dataTable?: DataTableConfig;
}

// Reusable field reference for charts/widgets/table columns
export interface FieldRef {
  id?: string;
  tableName?: string;
  fieldName?: string;
  displayName?: string;
}

// Optional grid placement for dashboard-style layouts
export interface GridPosition {
  row?: number;
  col?: number;
  width?: number;
  height?: number;
}

export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'column';

export interface ChartSeriesConfig {
  name?: string;
  field: FieldRef;
  aggregation?: AggregationType;
}

export interface ChartConfig {
  id: string;
  title?: string;
  type: ChartType;
  x?: FieldRef; // category/date axis
  y?: FieldRef; // primary value when single-series
  series?: ChartSeriesConfig[]; // optional multi-series
  aggregation?: AggregationType; // fallback if y/series not specified
  options?: {
    showLegend?: boolean;
    stacked?: boolean;
    colorScheme?: string[];
  };
  layout?: GridPosition;
}

export type WidgetType = 'metric' | 'kpi' | 'text' | 'trend';

export interface WidgetConfig {
  id: string;
  title?: string;
  type: WidgetType;
  field?: FieldRef; // numeric/text backing field for metric/kpi/trend
  aggregation?: AggregationType;
  valueFormat?: FieldFormatting;
  text?: string; // for text widget
  layout?: GridPosition;
}

export interface DataTableConfig {
  enabled?: boolean; // defaults to true if provided
  columns?: Array<{ field: FieldRef; width?: number }>;
  showTotals?: boolean;
  pageSize?: number;
  zebraStripes?: boolean;
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
  relatedTable?: RelatedTableConfig; // For related data aggregation or sub-reports
}

// Configuration for related table fields
export interface RelatedTableConfig {
  relationshipId: string; // ID of the relationship from schema
  relationshipName: string; // Display name of relationship
  relatedTableName: string; // Name of the related table
  relatedFieldName: string; // Field from related table to aggregate/display
  displayMode: 'aggregate' | 'subreport'; // How to display related data
  aggregation?: AggregationType; // For aggregate mode
  subReportFields?: string[]; // Fields to include in sub-report mode
  subReportLimit?: number; // Max records to show in sub-report
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