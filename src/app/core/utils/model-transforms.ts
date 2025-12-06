/**
 * Utility functions for transforming and manipulating model objects.
 * Provides functions for normalizing, converting, and modifying model data.
 */

import { DataSourceInfo } from '../models/data-source-info.model';
import { 
  ReportDefinition,
  SelectedField,
  FieldDataType
} from '../models/report.models';
import { SchemaInfo } from '../models/schema-info.model';

/**
 * Creates a deep copy of a DataSourceInfo object, optionally omitting sensitive data.
 * @param dataSource - DataSourceInfo to clone
 * @param omitPassword - If true, password will be omitted from the clone
 * @returns Cloned DataSourceInfo object (or DataSourceInfo without password if omitPassword is true)
 */
export function cloneDataSourceInfo(dataSource: DataSourceInfo, omitPassword: boolean = false): DataSourceInfo | Omit<DataSourceInfo, 'password'> {
  const cloned: Partial<DataSourceInfo> = {
    ...dataSource
  };

  // Deep clone schema if it exists
  if (dataSource.schema) {
    cloned.schema = JSON.parse(JSON.stringify(dataSource.schema));
  }

  // Clone arrays if they exist
  if (dataSource.includedSchemas) {
    cloned.includedSchemas = [...dataSource.includedSchemas];
  }

  if (dataSource.includedObjectTypes) {
    cloned.includedObjectTypes = [...dataSource.includedObjectTypes];
  }

  if (omitPassword) {
    const { password, ...clonedWithoutPassword } = cloned as DataSourceInfo;
    return clonedWithoutPassword as Omit<DataSourceInfo, 'password'>;
  }

  return cloned as DataSourceInfo;
}

/**
 * Normalizes a DataSourceInfo by setting default values for optional fields.
 * @param dataSource - DataSourceInfo to normalize
 * @returns Normalized DataSourceInfo
 */
export function normalizeDataSourceInfo(dataSource: Partial<DataSourceInfo>): DataSourceInfo {
  return {
    name: dataSource.name || '',
    type: dataSource.type || 'sqlserver',
    server: dataSource.server || 'localhost',
    database: dataSource.database || '',
    username: dataSource.username || '',
    password: dataSource.password || '',
    id: dataSource.id,
    port: dataSource.port,
    schema: dataSource.schema,
    includedSchemas: dataSource.includedSchemas || [],
    includedObjectTypes: dataSource.includedObjectTypes || [],
    objectNamePattern: dataSource.objectNamePattern
  };
}

/**
 * Merges two DataSourceInfo objects, with the second taking precedence.
 * @param base - Base DataSourceInfo
 * @param updates - Updates to apply
 * @returns Merged DataSourceInfo
 */
export function mergeDataSourceInfo(base: DataSourceInfo, updates: Partial<DataSourceInfo>): DataSourceInfo {
  return {
    ...base,
    ...updates,
    includedSchemas: updates.includedSchemas !== undefined ? updates.includedSchemas : base.includedSchemas,
    includedObjectTypes: updates.includedObjectTypes !== undefined ? updates.includedObjectTypes : base.includedObjectTypes,
    schema: updates.schema !== undefined ? updates.schema : base.schema
  };
}

/**
 * Creates a connection string from DataSourceInfo.
 * Format varies by database type.
 * @param dataSource - DataSourceInfo to create connection string from
 * @returns Connection string
 */
export function createConnectionString(dataSource: DataSourceInfo): string {
  const port = dataSource.port ? `:${dataSource.port}` : '';
  
  switch (dataSource.type.toLowerCase()) {
    case 'sqlserver':
      return `Server=${dataSource.server}${port};Database=${dataSource.database};User Id=${dataSource.username};Password=${dataSource.password};`;
    case 'postgresql':
      return `postgresql://${dataSource.username}:${dataSource.password}@${dataSource.server}${port}/${dataSource.database}`;
    case 'mysql':
      return `mysql://${dataSource.username}:${dataSource.password}@${dataSource.server}${port}/${dataSource.database}`;
    case 'oracle':
      return `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=${dataSource.server})(PORT=${dataSource.port || 1521}))(CONNECT_DATA=(SID=${dataSource.database})))`;
    default:
      return `${dataSource.type}://${dataSource.username}:${dataSource.password}@${dataSource.server}${port}/${dataSource.database}`;
  }
}

/**
 * Extracts all unique table names from a ReportDefinition's selected fields.
 * @param report - ReportDefinition to extract table names from
 * @returns Array of unique table names
 */
export function extractTableNames(report: ReportDefinition): string[] {
  const tableNames = new Set<string>();
  
  report.selectedFields?.forEach(field => {
    if (field.tableName) {
      tableNames.add(field.tableName);
    }
  });

  report.groupBy?.forEach(group => {
    if (group.tableName) {
      tableNames.add(group.tableName);
    }
  });

  report.sorting?.forEach(sort => {
    if (sort.tableName) {
      tableNames.add(sort.tableName);
    }
  });

  return Array.from(tableNames);
}

/**
 * Checks if a report has any aggregated fields.
 * @param report - ReportDefinition to check
 * @returns True if report has aggregated fields
 */
export function hasAggregatedFields(report: ReportDefinition): boolean {
  return report.selectedFields?.some(field => field.aggregation !== undefined) || false;
}

/**
 * Gets all fields that have aggregations applied.
 * @param report - ReportDefinition to extract aggregated fields from
 * @returns Array of SelectedField objects with aggregations
 */
export function getAggregatedFields(report: ReportDefinition): SelectedField[] {
  return report.selectedFields?.filter(field => field.aggregation !== undefined) || [];
}

/**
 * Gets all fields that are used for grouping.
 * @param report - ReportDefinition to extract group fields from
 * @returns Array of SelectedField objects used for grouping
 */
export function getGroupFields(report: ReportDefinition): SelectedField[] {
  if (!report.groupBy || report.groupBy.length === 0) {
    return [];
  }

  const groupFieldIds = new Set(report.groupBy.map(g => g.id));
  return report.selectedFields?.filter(field => groupFieldIds.has(field.id)) || [];
}

/**
 * Normalizes field data types by converting database-specific types to standard types.
 * @param dbType - Database-specific type string
 * @returns Normalized FieldDataType
 */
export function normalizeFieldDataType(dbType: string): FieldDataType {
  const normalized = dbType.toLowerCase().trim();

  // String types
  if (normalized.includes('char') || normalized.includes('text') || normalized.includes('varchar') || normalized.includes('nvarchar')) {
    return FieldDataType.STRING;
  }

  // Integer types
  if (normalized.includes('int') || normalized.includes('integer')) {
    if (normalized.includes('big') || normalized.includes('int8')) {
      return FieldDataType.BIGINT;
    }
    if (normalized.includes('small') || normalized.includes('int2')) {
      return FieldDataType.SMALLINT;
    }
    return FieldDataType.NUMBER;
  }

  // Floating point types
  if (normalized.includes('float') || normalized.includes('real')) {
    return FieldDataType.FLOAT;
  }
  if (normalized.includes('double')) {
    return FieldDataType.DOUBLE;
  }

  // Decimal types
  if (normalized.includes('decimal') || normalized.includes('numeric')) {
    return FieldDataType.DECIMAL;
  }

  // Money/Currency types
  if (normalized.includes('money') || normalized.includes('currency')) {
    return FieldDataType.MONEY;
  }

  // Date/Time types
  if (normalized.includes('date') || normalized.includes('time') || normalized.includes('timestamp')) {
    return FieldDataType.DATE;
  }

  // Boolean types
  if (normalized.includes('bool') || normalized === 'bit') {
    return FieldDataType.BOOLEAN;
  }

  // Default to string for unknown types
  return FieldDataType.STRING;
}

/**
 * Converts a ReportDefinition to a minimal JSON representation.
 * Useful for storage or transmission.
 * @param report - ReportDefinition to serialize
 * @returns Serialized report object
 */
export function serializeReportDefinition(report: ReportDefinition): any {
  return {
    id: report.id,
    name: report.name,
    description: report.description,
    dataSource: report.dataSource ? {
      id: report.dataSource.id,
      name: report.dataSource.name,
      type: report.dataSource.type,
      server: report.dataSource.server,
      port: report.dataSource.port,
      database: report.dataSource.database,
      // Note: password is intentionally omitted for security
      includedSchemas: report.dataSource.includedSchemas,
      includedObjectTypes: report.dataSource.includedObjectTypes,
      objectNamePattern: report.dataSource.objectNamePattern
      // Note: schema is intentionally omitted to reduce size
    } : null,
    selectedFields: report.selectedFields,
    filters: report.filters,
    groupBy: report.groupBy,
    sorting: report.sorting,
    layout: report.layout,
    parameters: report.parameters
  };
}

/**
 * Counts the total number of columns across all tables in a schema.
 * @param schema - SchemaInfo to count columns for
 * @returns Total number of columns
 */
export function countSchemaColumns(schema: SchemaInfo): number {
  return schema.tables.reduce((total, table) => total + (table.columns?.length || 0), 0);
}

/**
 * Gets all unique data types used across a schema.
 * @param schema - SchemaInfo to extract data types from
 * @returns Array of unique data type strings
 */
export function getUniqueDataTypes(schema: SchemaInfo): string[] {
  const dataTypes = new Set<string>();

  schema.tables.forEach(table => {
    table.columns?.forEach(column => {
      if (column.dataType) {
        dataTypes.add(column.dataType);
      }
      if (column.normalizedType) {
        dataTypes.add(column.normalizedType);
      }
    });
  });

  return Array.from(dataTypes);
}

/**
 * Finds all tables that have foreign key relationships.
 * @param schema - SchemaInfo to analyze
 * @returns Array of table names that have foreign keys
 */
export function getTablesWithForeignKeys(schema: SchemaInfo): string[] {
  const tableNames = new Set<string>();

  schema.tables.forEach(table => {
    const hasForeignKey = table.columns?.some(column => column.isForeignKey);
    if (hasForeignKey) {
      tableNames.add(table.name);
    }
  });

  return Array.from(tableNames);
}
