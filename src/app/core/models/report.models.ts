// core/models/report.models.ts
import { DataSourceInfo } from './data-source-info.model';

/**
 * Enumeration of supported data types for report fields.
 * Used to specify the data type of fields when building reports.
 */
export enum FieldDataType {
  /** String/text data type */
  STRING = 'string',
  /** Generic numeric data type */
  NUMBER = 'number',
  /** Date/time data type */
  DATE = 'date',
  /** Boolean (true/false) data type */
  BOOLEAN = 'boolean',
  /** Currency data type */
  CURRENCY = 'currency',
  /** Small integer (typically 16-bit) */
  SMALLINT = 'smallint',
  /** Big integer (typically 64-bit) */
  BIGINT = 'bigint',
  /** Single-precision floating point */
  FLOAT = 'float',
  /** Double-precision floating point */
  DOUBLE = 'double',
  /** Fixed-point decimal */
  DECIMAL = 'decimal',
  /** Numeric data type */
  NUMERIC = 'numeric',
  /** Money data type */
  MONEY = 'money'
}

/**
 * Complete definition of a report, including data source, fields, filters, grouping, sorting, and layout.
 * This is the main model that represents a saved or in-progress report configuration.
 */
export interface ReportDefinition {
  /** Unique identifier for the report (optional, typically assigned when saved) */
  id?: string;
  
  /** Display name of the report */
  name: string;
  
  /** Optional description of the report's purpose or contents */
  description?: string | undefined;
  
  /** Data source configuration that the report queries */
  dataSource: DataSourceInfo;
  
  /** Array of fields selected for display in the report */
  selectedFields: SelectedField[];
  
  /** Array of filter conditions applied to the report data */
  filters: FilterCondition[];
  
  /** Array of fields used for grouping report data */
  groupBy: GroupByField[];
  
  /** Array of fields used for sorting report data */
  sorting: SortField[];
  
  /** Layout and formatting configuration for the report output */
  layout: LayoutConfiguration;
  
  /** Array of parameters that can be provided at report execution time */
  parameters: ReportParameter[];
}

/**
 * Represents a parameter that can be passed to a report at execution time.
 * Parameters allow for dynamic filtering and customization of report output.
 */
export interface ReportParameter {
  /** Unique identifier for the parameter */
  id: string;
  
  /** Internal name of the parameter (used in queries) */
  name: string;
  
  /** Data type of the parameter (e.g., 'string', 'number', 'date') */
  type: string;
  
  /** Default or current value of the parameter (optional) */
  value?: any;
  
  /** Whether the parameter is required for report execution */
  required?: boolean;
  
  /** Display name shown to users when prompting for parameter values */
  displayName?: string;
}

/**
 * Configuration for the layout, formatting, and visual presentation of a report.
 * Supports both traditional tabular reports and dashboard-style layouts with charts and widgets.
 */
export interface LayoutConfiguration {
  /** Page orientation: 'portrait' (vertical) or 'landscape' (horizontal) */
  orientation?: 'portrait' | 'landscape';
  
  /** Page size identifier (e.g., 'A4', 'Letter', 'Legal') */
  pageSize?: string;
  
  /** Whether to display a header on each page */
  showHeader?: boolean;
  
  /** Whether to display a footer on each page */
  showFooter?: boolean;
  
  /** Whether to display page numbers in the footer */
  showPageNumbers?: boolean;
  
  /** Whether to display grid lines around cells in tabular data */
  showGridLines?: boolean;
  
  /** Top margin size in points */
  topMargin?: number;
  
  /** Bottom margin size in points */
  bottomMargin?: number;
  
  /** Left margin size in points */
  leftMargin?: number;
  
  /** Right margin size in points */
  rightMargin?: number;
  
  /** Font size for header text in points */
  headerFontSize?: number;
  
  /** Font size for body text in points */
  bodyFontSize?: number;
  
  /** Whether to repeat column headers on each page of a multi-page report */
  repeatHeaderOnEachPage?: boolean;
  
  /** Whether to automatically scale content to fit the page width */
  fitToPage?: boolean;
  
  /** Whether to allow page breaks within table rows */
  allowPageBreak?: boolean;

  /** Optional layout content */
  
  /** Array of chart configurations for dashboard-style layouts */
  charts?: ChartConfig[];
  
  /** Array of widget configurations for dashboard-style layouts */
  widgets?: WidgetConfig[];
  
  /** 
   * Configuration for the data table component.
   * If provided, the data table is included and should render last in the layout.
   */
  dataTable?: DataTableConfig;
}

/**
 * Reference to a database field used in charts, widgets, or table columns.
 * Provides a way to reference fields without including full field definitions.
 */
export interface FieldRef {
  /** Optional unique identifier for the field reference */
  id?: string;
  
  /** Name of the table containing the field */
  tableName?: string;
  
  /** Name of the field/column */
  fieldName?: string;
  
  /** Display name to show in the UI */
  displayName?: string;
}

/**
 * Grid position and dimensions for dashboard-style layout components.
 * Used for placing charts and widgets in a grid-based dashboard layout.
 */
export interface GridPosition {
  /** Zero-based row index in the grid */
  row?: number;
  
  /** Zero-based column index in the grid */
  col?: number;
  
  /** Width in grid columns (how many columns this component spans) */
  width?: number;
  
  /** Height in grid rows (how many rows this component spans) */
  height?: number;
}

/**
 * Supported chart types for report visualization.
 */
export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'column';

/**
 * Configuration for a single data series within a chart.
 * Used for multi-series charts where multiple data series are displayed together.
 */
export interface ChartSeriesConfig {
  /** Display name for this series (shown in legend) */
  name?: string;
  
  /** Reference to the field containing the data for this series */
  field: FieldRef;
  
  /** Aggregation function to apply to the field values */
  aggregation?: AggregationType;
}

/**
 * Configuration for a chart visualization within a report layout.
 * Charts display aggregated data in graphical form.
 */
export interface ChartConfig {
  /** Unique identifier for this chart instance */
  id: string;
  
  /** Title to display above the chart */
  title?: string;
  
  /** Type of chart to render */
  type: ChartType;
  
  /** Field reference for the X-axis (category or date axis) */
  x?: FieldRef;
  
  /** Field reference for the Y-axis (primary value when single-series) */
  y?: FieldRef;
  
  /** Array of series configurations for multi-series charts (optional) */
  series?: ChartSeriesConfig[];
  
  /** Default aggregation function if not specified in y or series */
  aggregation?: AggregationType;
  
  /** Chart display options */
  options?: {
    /** Whether to display a legend */
    showLegend?: boolean;
    /** Whether to stack series vertically (for bar/column charts) */
    stacked?: boolean;
    /** Array of color codes for custom color scheme */
    colorScheme?: string[];
  };
  
  /** Grid position for dashboard layouts */
  layout?: GridPosition;
}

/**
 * Supported widget types for report dashboards.
 */
export type WidgetType = 'metric' | 'kpi' | 'text' | 'trend';

/**
 * Configuration for a widget visualization within a report layout.
 * Widgets display single metrics, KPIs, or text content.
 */
export interface WidgetConfig {
  /** Unique identifier for this widget instance */
  id: string;
  
  /** Title to display above the widget */
  title?: string;
  
  /** Type of widget to render */
  type: WidgetType;
  
  /** Field reference for numeric/text data (used for metric/kpi/trend widgets) */
  field?: FieldRef;
  
  /** Aggregation function to apply to the field */
  aggregation?: AggregationType;
  
  /** Formatting configuration for the widget value */
  valueFormat?: FieldFormatting;
  
  /** Text content (used for text widgets) */
  text?: string;
  
  /** Grid position for dashboard layouts */
  layout?: GridPosition;
}

/**
 * Configuration for the data table component in a report.
 * Controls how tabular data is displayed.
 */
export interface DataTableConfig {
  /** Whether the data table is enabled (defaults to true if provided) */
  enabled?: boolean;
  
  /** Array of column configurations with field references and optional width */
  columns?: Array<{ field: FieldRef; width?: number }>;
  
  /** Whether to display totals row at the bottom */
  showTotals?: boolean;
  
  /** Number of rows to display per page (for pagination) */
  pageSize?: number;
  
  /** Whether to apply alternating row colors (zebra striping) */
  zebraStripes?: boolean;
}

/**
 * Configuration for sorting a report by a specific field.
 * Defines which field to sort by and the sort direction.
 */
export interface SortField {
  /** Unique identifier for this sort field */
  id: string;
  
  /** Name of the table containing the field to sort by */
  tableName: string;
  
  /** Name of the field/column to sort by */
  fieldName: string;
  
  /** Display name of the field (shown in UI) */
  displayName: string;
  
  /** Sort direction: 'asc' (ascending) or 'desc' (descending) */
  direction: 'asc' | 'desc';
}

/**
 * Represents a field selected for inclusion in a report.
 * Contains field metadata, aggregation settings, and formatting options.
 */
export interface SelectedField {
  /** Unique identifier for this field selection */
  id: string;
  
  /** Name of the table containing the field */
  tableName: string;
  
  /** Name of the field/column */
  fieldName: string;
  
  /** Display name for the field (shown in report headers) */
  displayName: string;
  
  /** Data type of the field */
  dataType: FieldDataType;
  
  /** Optional aggregation function to apply to the field */
  aggregation?: AggregationType;
  
  /** Optional formatting configuration for displaying the field value */
  formatting?: FieldFormatting;
  
  /** Configuration for related table data (for aggregation or sub-reports) */
  relatedTable?: RelatedTableConfig;
  
  /** Database schema name containing the table (e.g., 'dbo', 'stage') */
  schema?: string;
}

/**
 * Configuration for including related table data in a report field.
 * Allows for aggregating or displaying related records from another table.
 */
export interface RelatedTableConfig {
  /** ID of the relationship from the schema definition */
  relationshipId: string;
  
  /** Display name of the relationship */
  relationshipName: string;
  
  /** Name of the related table */
  relatedTableName: string;
  
  /** Field name from the related table to aggregate or display */
  relatedFieldName: string;
  
  /** How to display the related data: 'aggregate' (single value) or 'subreport' (list of records) */
  displayMode: 'aggregate' | 'subreport';
  
  /** Aggregation function to apply (used when displayMode is 'aggregate') */
  aggregation?: AggregationType;
  
  /** List of field names to include in sub-report mode */
  subReportFields?: string[];
  
  /** Maximum number of records to show in sub-report mode */
  subReportLimit?: number;
}

/**
 * Enumeration of aggregation functions that can be applied to report fields.
 * Used to calculate summary statistics from grouped or related data.
 */
export enum AggregationType {
  /** Sum of all values */
  SUM = 'sum',
  /** Average of all values */
  AVG = 'avg',
  /** Count of records */
  COUNT = 'count',
  /** Minimum value */
  MIN = 'min',
  /** Maximum value */
  MAX = 'max'
}

/**
 * Configuration for formatting the display of field values in reports.
 * Controls how numeric, date, and currency values are presented to users.
 */
export interface FieldFormatting {
  /** Type of formatting to apply */
  formatType?: 'currency' | 'percentage' | 'decimal' | 'date' | 'string' | 'smallint' | 'bigint' | 'float' | 'double' | 'decimal' | 'numeric' | 'money';
  
  /** Number of decimal places to display (for numeric types) */
  decimalPlaces?: number;
  
  /** Date format string (e.g., 'MM/DD/YYYY', 'YYYY-MM-DD') */
  dateFormat?: string;
  
  /** ISO currency code (e.g., 'USD', 'EUR') for currency formatting */
  currencyCode?: string;
  // Add other formatting options as needed
}

/**
 * Represents a filter condition applied to report data.
 * Defines a field, operator, and value to filter the dataset.
 */
export interface FilterCondition {
  /** Unique identifier for this filter condition */
  id: string;
  
  /** The field that this filter applies to */
  field: SelectedField;
  
  /** The comparison operator to use */
  operator: FilterOperator;
  
  /** The value(s) to compare against (type depends on operator) */
  value: any;
  
  /** Human-readable text representation of the filter (for display purposes) */
  displayText: string;
}

/**
 * Enumeration of filter operators available for report filter conditions.
 * Defines the types of comparisons that can be performed.
 */
export enum FilterOperator {
  /** Equals comparison (=) */
  EQUALS = 'equals',
  /** Not equals comparison (!= or <>) */
  NOT_EQUALS = 'not_equals',
  /** Contains substring (LIKE '%value%') */
  CONTAINS = 'contains',
  /** Starts with prefix (LIKE 'value%') */
  STARTS_WITH = 'starts_with',
  /** Greater than comparison (>) */
  GREATER_THAN = 'greater_than',
  /** Less than comparison (<) */
  LESS_THAN = 'less_than',
  /** Between two values (BETWEEN value1 AND value2) */
  BETWEEN = 'between',
  /** In list of values (IN (value1, value2, ...)) */
  IN_LIST = 'in_list'
}

/**
 * Represents a field used for grouping report data.
 * Defines which field should be used to group rows together for aggregation.
 */
export interface GroupByField {
  /** Unique identifier for this group-by field */
  id: string;
  
  /** Name of the table containing the field */
  tableName: string;
  
  /** Name of the field/column to group by */
  fieldName: string;
  
  /** Display name of the field (shown in report output) */
  displayName: string;
}
