/**
 * Utility functions for validating model objects and ensuring data integrity.
 * Provides type guards and validation functions for core models.
 */

import { DataSourceInfo } from '../models/data-source-info.model';
import { PreviewResult } from '../models/preview-result.model';
import { 
  ReportDefinition, 
  SelectedField, 
  FilterCondition, 
  SortField, 
  GroupByField,
  ReportParameter,
  FieldDataType,
  FilterOperator,
  AggregationType
} from '../models/report.models';
import { SchemaInfo } from '../models/schema-info.model';

/**
 * Type guard to check if an object is a valid DataSourceInfo.
 * @param obj - Object to validate
 * @returns True if object is a valid DataSourceInfo
 */
export function isDataSourceInfo(obj: any): obj is DataSourceInfo {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.name === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.server === 'string' &&
    typeof obj.database === 'string' &&
    typeof obj.username === 'string' &&
    typeof obj.password === 'string' &&
    (obj.port === undefined || typeof obj.port === 'number') &&
    (obj.includedSchemas === undefined || Array.isArray(obj.includedSchemas)) &&
    (obj.includedObjectTypes === undefined || Array.isArray(obj.includedObjectTypes)) &&
    (obj.objectNamePattern === undefined || typeof obj.objectNamePattern === 'string')
  );
}

/**
 * Validates a DataSourceInfo object and returns validation errors if any.
 * @param dataSource - DataSourceInfo to validate
 * @returns Array of validation error messages, empty if valid
 */
export function validateDataSourceInfo(dataSource: any): string[] {
  const errors: string[] = [];

  if (!dataSource || typeof dataSource !== 'object') {
    return ['DataSourceInfo must be an object'];
  }

  if (!dataSource.name || typeof dataSource.name !== 'string' || dataSource.name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  }

  if (!dataSource.type || typeof dataSource.type !== 'string') {
    errors.push('Type is required and must be a string');
  }

  if (!dataSource.server || typeof dataSource.server !== 'string' || dataSource.server.trim().length === 0) {
    errors.push('Server is required and must be a non-empty string');
  }

  if (dataSource.port !== undefined && (typeof dataSource.port !== 'number' || dataSource.port < 1 || dataSource.port > 65535)) {
    errors.push('Port must be a number between 1 and 65535');
  }

  if (!dataSource.database || typeof dataSource.database !== 'string' || dataSource.database.trim().length === 0) {
    errors.push('Database is required and must be a non-empty string');
  }

  if (!dataSource.username || typeof dataSource.username !== 'string' || dataSource.username.trim().length === 0) {
    errors.push('Username is required and must be a non-empty string');
  }

  if (!dataSource.password || typeof dataSource.password !== 'string') {
    errors.push('Password is required and must be a string');
  }

  if (dataSource.includedSchemas !== undefined && !Array.isArray(dataSource.includedSchemas)) {
    errors.push('includedSchemas must be an array if provided');
  }

  if (dataSource.includedObjectTypes !== undefined && !Array.isArray(dataSource.includedObjectTypes)) {
    errors.push('includedObjectTypes must be an array if provided');
  }

  if (dataSource.objectNamePattern !== undefined && typeof dataSource.objectNamePattern !== 'string') {
    errors.push('objectNamePattern must be a string if provided');
  }

  return errors;
}

/**
 * Type guard to check if an object is a valid PreviewResult.
 * @param obj - Object to validate
 * @returns True if object is a valid PreviewResult
 */
export function isPreviewResult(obj: any): obj is PreviewResult {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    Array.isArray(obj.data) &&
    typeof obj.totalCount === 'number' &&
    obj.totalCount >= 0
  );
}

/**
 * Validates a PreviewResult object.
 * @param result - PreviewResult to validate
 * @returns Array of validation error messages, empty if valid
 */
export function validatePreviewResult(result: any): string[] {
  const errors: string[] = [];

  if (!result || typeof result !== 'object') {
    return ['PreviewResult must be an object'];
  }

  if (!Array.isArray(result.data)) {
    errors.push('Data must be an array');
  }

  if (typeof result.totalCount !== 'number' || result.totalCount < 0 || !Number.isInteger(result.totalCount)) {
    errors.push('totalCount must be a non-negative integer');
  }

  return errors;
}

/**
 * Type guard to check if a value is a valid FieldDataType.
 * @param value - Value to check
 * @returns True if value is a valid FieldDataType
 */
export function isFieldDataType(value: any): value is FieldDataType {
  return Object.values(FieldDataType).includes(value);
}

/**
 * Type guard to check if a value is a valid FilterOperator.
 * @param value - Value to check
 * @returns True if value is a valid FilterOperator
 */
export function isFilterOperator(value: any): value is FilterOperator {
  return Object.values(FilterOperator).includes(value);
}

/**
 * Type guard to check if a value is a valid AggregationType.
 * @param value - Value to check
 * @returns True if value is a valid AggregationType
 */
export function isAggregationType(value: any): value is AggregationType {
  return Object.values(AggregationType).includes(value);
}

/**
 * Validates a SelectedField object.
 * @param field - SelectedField to validate
 * @returns Array of validation error messages, empty if valid
 */
export function validateSelectedField(field: any): string[] {
  const errors: string[] = [];

  if (!field || typeof field !== 'object') {
    return ['SelectedField must be an object'];
  }

  if (!field.id || typeof field.id !== 'string') {
    errors.push('id is required and must be a string');
  }

  if (!field.tableName || typeof field.tableName !== 'string') {
    errors.push('tableName is required and must be a string');
  }

  if (!field.fieldName || typeof field.fieldName !== 'string') {
    errors.push('fieldName is required and must be a string');
  }

  if (!field.displayName || typeof field.displayName !== 'string') {
    errors.push('displayName is required and must be a string');
  }

  if (!field.dataType || !isFieldDataType(field.dataType)) {
    errors.push('dataType is required and must be a valid FieldDataType');
  }

  if (field.aggregation !== undefined && !isAggregationType(field.aggregation)) {
    errors.push('aggregation must be a valid AggregationType if provided');
  }

  return errors;
}

/**
 * Validates a FilterCondition object.
 * @param filter - FilterCondition to validate
 * @returns Array of validation error messages, empty if valid
 */
export function validateFilterCondition(filter: any): string[] {
  const errors: string[] = [];

  if (!filter || typeof filter !== 'object') {
    return ['FilterCondition must be an object'];
  }

  if (!filter.id || typeof filter.id !== 'string') {
    errors.push('id is required and must be a string');
  }

  if (!filter.field) {
    errors.push('field is required');
  } else {
    const fieldErrors = validateSelectedField(filter.field);
    if (fieldErrors.length > 0) {
      errors.push(`field is invalid: ${fieldErrors.join(', ')}`);
    }
  }

  if (!filter.operator || !isFilterOperator(filter.operator)) {
    errors.push('operator is required and must be a valid FilterOperator');
  }

  if (!filter.displayText || typeof filter.displayText !== 'string') {
    errors.push('displayText is required and must be a string');
  }

  return errors;
}

/**
 * Validates a SortField object.
 * @param sort - SortField to validate
 * @returns Array of validation error messages, empty if valid
 */
export function validateSortField(sort: any): string[] {
  const errors: string[] = [];

  if (!sort || typeof sort !== 'object') {
    return ['SortField must be an object'];
  }

  if (!sort.id || typeof sort.id !== 'string') {
    errors.push('id is required and must be a string');
  }

  if (!sort.tableName || typeof sort.tableName !== 'string') {
    errors.push('tableName is required and must be a string');
  }

  if (!sort.fieldName || typeof sort.fieldName !== 'string') {
    errors.push('fieldName is required and must be a string');
  }

  if (!sort.displayName || typeof sort.displayName !== 'string') {
    errors.push('displayName is required and must be a string');
  }

  if (!sort.direction || (sort.direction !== 'asc' && sort.direction !== 'desc')) {
    errors.push('direction is required and must be "asc" or "desc"');
  }

  return errors;
}

/**
 * Validates a GroupByField object.
 * @param group - GroupByField to validate
 * @returns Array of validation error messages, empty if valid
 */
export function validateGroupByField(group: any): string[] {
  const errors: string[] = [];

  if (!group || typeof group !== 'object') {
    return ['GroupByField must be an object'];
  }

  if (!group.id || typeof group.id !== 'string') {
    errors.push('id is required and must be a string');
  }

  if (!group.tableName || typeof group.tableName !== 'string') {
    errors.push('tableName is required and must be a string');
  }

  if (!group.fieldName || typeof group.fieldName !== 'string') {
    errors.push('fieldName is required and must be a string');
  }

  if (!group.displayName || typeof group.displayName !== 'string') {
    errors.push('displayName is required and must be a string');
  }

  return errors;
}

/**
 * Validates a ReportParameter object.
 * @param param - ReportParameter to validate
 * @returns Array of validation error messages, empty if valid
 */
export function validateReportParameter(param: any): string[] {
  const errors: string[] = [];

  if (!param || typeof param !== 'object') {
    return ['ReportParameter must be an object'];
  }

  if (!param.id || typeof param.id !== 'string') {
    errors.push('id is required and must be a string');
  }

  if (!param.name || typeof param.name !== 'string') {
    errors.push('name is required and must be a string');
  }

  if (!param.type || typeof param.type !== 'string') {
    errors.push('type is required and must be a string');
  }

  if (param.required !== undefined && typeof param.required !== 'boolean') {
    errors.push('required must be a boolean if provided');
  }

  return errors;
}

/**
 * Validates a ReportDefinition object.
 * @param report - ReportDefinition to validate
 * @returns Array of validation error messages, empty if valid
 */
export function validateReportDefinition(report: any): string[] {
  const errors: string[] = [];

  if (!report || typeof report !== 'object') {
    return ['ReportDefinition must be an object'];
  }

  if (!report.name || typeof report.name !== 'string' || report.name.trim().length === 0) {
    errors.push('name is required and must be a non-empty string');
  }

  if (report.description !== undefined && typeof report.description !== 'string') {
    errors.push('description must be a string if provided');
  }

  if (!report.dataSource || !isDataSourceInfo(report.dataSource)) {
    const dataSourceErrors = validateDataSourceInfo(report.dataSource);
    if (dataSourceErrors.length > 0) {
      errors.push(`dataSource is invalid: ${dataSourceErrors.join(', ')}`);
    }
  }

  if (!Array.isArray(report.selectedFields)) {
    errors.push('selectedFields must be an array');
  } else {
    report.selectedFields.forEach((field: any, index: number) => {
      const fieldErrors = validateSelectedField(field);
      if (fieldErrors.length > 0) {
        errors.push(`selectedFields[${index}] is invalid: ${fieldErrors.join(', ')}`);
      }
    });
  }

  if (!Array.isArray(report.filters)) {
    errors.push('filters must be an array');
  } else {
    report.filters.forEach((filter: any, index: number) => {
      const filterErrors = validateFilterCondition(filter);
      if (filterErrors.length > 0) {
        errors.push(`filters[${index}] is invalid: ${filterErrors.join(', ')}`);
      }
    });
  }

  if (!Array.isArray(report.groupBy)) {
    errors.push('groupBy must be an array');
  } else {
    report.groupBy.forEach((group: any, index: number) => {
      const groupErrors = validateGroupByField(group);
      if (groupErrors.length > 0) {
        errors.push(`groupBy[${index}] is invalid: ${groupErrors.join(', ')}`);
      }
    });
  }

  if (!Array.isArray(report.sorting)) {
    errors.push('sorting must be an array');
  } else {
    report.sorting.forEach((sort: any, index: number) => {
      const sortErrors = validateSortField(sort);
      if (sortErrors.length > 0) {
        errors.push(`sorting[${index}] is invalid: ${sortErrors.join(', ')}`);
      }
    });
  }

  if (!report.layout || typeof report.layout !== 'object') {
    errors.push('layout is required and must be an object');
  }

  if (!Array.isArray(report.parameters)) {
    errors.push('parameters must be an array');
  } else {
    report.parameters.forEach((param: any, index: number) => {
      const paramErrors = validateReportParameter(param);
      if (paramErrors.length > 0) {
        errors.push(`parameters[${index}] is invalid: ${paramErrors.join(', ')}`);
      }
    });
  }

  return errors;
}

/**
 * Validates a SchemaInfo object.
 * @param schema - SchemaInfo to validate
 * @returns Array of validation error messages, empty if valid
 */
export function validateSchemaInfo(schema: any): string[] {
  const errors: string[] = [];

  if (!schema || typeof schema !== 'object') {
    return ['SchemaInfo must be an object'];
  }

  if (!Array.isArray(schema.tables)) {
    errors.push('tables must be an array');
  } else {
    schema.tables.forEach((table: any, index: number) => {
      if (!table || typeof table !== 'object') {
        errors.push(`tables[${index}] must be an object`);
        return;
      }

      if (!table.name || typeof table.name !== 'string') {
        errors.push(`tables[${index}].name is required and must be a string`);
      }

      if (!Array.isArray(table.columns)) {
        errors.push(`tables[${index}].columns must be an array`);
      } else {
        table.columns.forEach((column: any, colIndex: number) => {
          if (!column || typeof column !== 'object') {
            errors.push(`tables[${index}].columns[${colIndex}] must be an object`);
            return;
          }

          if (!column.name || typeof column.name !== 'string') {
            errors.push(`tables[${index}].columns[${colIndex}].name is required and must be a string`);
          }

          if (!column.dataType || typeof column.dataType !== 'string') {
            errors.push(`tables[${index}].columns[${colIndex}].dataType is required and must be a string`);
          }
        });
      }
    });
  }

  if (schema.relationships !== undefined) {
    if (!Array.isArray(schema.relationships)) {
      errors.push('relationships must be an array if provided');
    } else {
      schema.relationships.forEach((rel: any, index: number) => {
        if (!rel || typeof rel !== 'object') {
          errors.push(`relationships[${index}] must be an object`);
          return;
        }

        if (!rel.id || typeof rel.id !== 'string') {
          errors.push(`relationships[${index}].id is required and must be a string`);
        }

        if (!rel.name || typeof rel.name !== 'string') {
          errors.push(`relationships[${index}].name is required and must be a string`);
        }

        if (!rel.parentTable || typeof rel.parentTable !== 'string') {
          errors.push(`relationships[${index}].parentTable is required and must be a string`);
        }

        if (!rel.childTable || typeof rel.childTable !== 'string') {
          errors.push(`relationships[${index}].childTable is required and must be a string`);
        }

        if (!Array.isArray(rel.columnMappings)) {
          errors.push(`relationships[${index}].columnMappings must be an array`);
        }
      });
    }
  }

  return errors;
}

/**
 * Checks if a field data type is numeric.
 * @param dataType - FieldDataType to check
 * @returns True if the data type is numeric
 */
export function isNumericDataType(dataType: FieldDataType): boolean {
  return [
    FieldDataType.NUMBER,
    FieldDataType.CURRENCY,
    FieldDataType.SMALLINT,
    FieldDataType.BIGINT,
    FieldDataType.FLOAT,
    FieldDataType.DOUBLE,
    FieldDataType.DECIMAL,
    FieldDataType.NUMERIC,
    FieldDataType.MONEY
  ].includes(dataType);
}

/**
 * Checks if a field data type is suitable for grouping.
 * @param dataType - FieldDataType to check
 * @returns True if the data type is suitable for grouping
 */
export function isGroupableDataType(dataType: FieldDataType): boolean {
  return [
    FieldDataType.STRING,
    FieldDataType.DATE,
    FieldDataType.BOOLEAN,
    FieldDataType.NUMBER,
    FieldDataType.SMALLINT,
    FieldDataType.BIGINT
  ].includes(dataType);
}

/**
 * Checks if a field data type is suitable for date operations.
 * @param dataType - FieldDataType to check
 * @returns True if the data type is a date type
 */
export function isDateDataType(dataType: FieldDataType): boolean {
  return dataType === FieldDataType.DATE;
}

/**
 * Gets a human-readable display name for a FieldDataType.
 * @param dataType - FieldDataType to get display name for
 * @returns Display name for the data type
 */
export function getFieldDataTypeDisplayName(dataType: FieldDataType): string {
  const displayNames: Record<FieldDataType, string> = {
    [FieldDataType.STRING]: 'Text',
    [FieldDataType.NUMBER]: 'Number',
    [FieldDataType.DATE]: 'Date',
    [FieldDataType.BOOLEAN]: 'Boolean',
    [FieldDataType.CURRENCY]: 'Currency',
    [FieldDataType.SMALLINT]: 'Small Integer',
    [FieldDataType.BIGINT]: 'Big Integer',
    [FieldDataType.FLOAT]: 'Float',
    [FieldDataType.DOUBLE]: 'Double',
    [FieldDataType.DECIMAL]: 'Decimal',
    [FieldDataType.NUMERIC]: 'Numeric',
    [FieldDataType.MONEY]: 'Money'
  };

  return displayNames[dataType] || 'Unknown';
}

/**
 * Gets a human-readable display name for a FilterOperator.
 * @param operator - FilterOperator to get display name for
 * @returns Display name for the operator
 */
export function getFilterOperatorDisplayName(operator: FilterOperator): string {
  const displayNames: Record<FilterOperator, string> = {
    [FilterOperator.EQUALS]: 'Equals',
    [FilterOperator.NOT_EQUALS]: 'Not Equals',
    [FilterOperator.CONTAINS]: 'Contains',
    [FilterOperator.STARTS_WITH]: 'Starts With',
    [FilterOperator.GREATER_THAN]: 'Greater Than',
    [FilterOperator.LESS_THAN]: 'Less Than',
    [FilterOperator.BETWEEN]: 'Between',
    [FilterOperator.IN_LIST]: 'In List'
  };

  return displayNames[operator] || operator;
}

/**
 * Gets a human-readable display name for an AggregationType.
 * @param aggregation - AggregationType to get display name for
 * @returns Display name for the aggregation
 */
export function getAggregationTypeDisplayName(aggregation: AggregationType): string {
  const displayNames: Record<AggregationType, string> = {
    [AggregationType.SUM]: 'Sum',
    [AggregationType.AVG]: 'Average',
    [AggregationType.COUNT]: 'Count',
    [AggregationType.MIN]: 'Minimum',
    [AggregationType.MAX]: 'Maximum'
  };

  return displayNames[aggregation] || aggregation;
}
