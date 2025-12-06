/**
 * Unit tests for model validator functions.
 */

import { 
  isDataSourceInfo,
  validateDataSourceInfo,
  isPreviewResult,
  validatePreviewResult,
  isFieldDataType,
  isFilterOperator,
  isAggregationType,
  validateSelectedField,
  validateFilterCondition,
  validateSortField,
  validateGroupByField,
  validateReportParameter,
  validateReportDefinition,
  validateSchemaInfo,
  isNumericDataType,
  isGroupableDataType,
  isDateDataType,
  getFieldDataTypeDisplayName,
  getFilterOperatorDisplayName,
  getAggregationTypeDisplayName
} from './model-validators';
import { FieldDataType, FilterOperator, AggregationType } from '../models/report.models';

describe('ModelValidators', () => {
  describe('isDataSourceInfo', () => {
    it('should return true for valid DataSourceInfo', () => {
      const valid: any = {
        name: 'Test DB',
        type: 'sqlserver',
        server: 'localhost',
        database: 'testdb',
        username: 'user',
        password: 'pass'
      };
      expect(isDataSourceInfo(valid)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isDataSourceInfo(null)).toBe(false);
    });

    it('should return false for invalid object', () => {
      expect(isDataSourceInfo({})).toBe(false);
    });

    it('should return false for object missing required fields', () => {
      const invalid = { name: 'Test' };
      expect(isDataSourceInfo(invalid)).toBe(false);
    });

    it('should return true with optional fields', () => {
      const valid: any = {
        name: 'Test DB',
        type: 'sqlserver',
        server: 'localhost',
        port: 1433,
        database: 'testdb',
        username: 'user',
        password: 'pass',
        includedSchemas: ['dbo'],
        includedObjectTypes: ['table'],
        objectNamePattern: 'Test%'
      };
      expect(isDataSourceInfo(valid)).toBe(true);
    });
  });

  describe('validateDataSourceInfo', () => {
    it('should return empty array for valid DataSourceInfo', () => {
      const valid: any = {
        name: 'Test DB',
        type: 'sqlserver',
        server: 'localhost',
        database: 'testdb',
        username: 'user',
        password: 'pass'
      };
      expect(validateDataSourceInfo(valid)).toEqual([]);
    });

    it('should return errors for null', () => {
      const errors = validateDataSourceInfo(null);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate required fields', () => {
      const invalid: any = {};
      const errors = validateDataSourceInfo(invalid);
      expect(errors).toContain('Name is required and must be a non-empty string');
      expect(errors).toContain('Type is required and must be a string');
      expect(errors).toContain('Server is required and must be a non-empty string');
      expect(errors).toContain('Database is required and must be a non-empty string');
      expect(errors).toContain('Username is required and must be a non-empty string');
      expect(errors).toContain('Password is required and must be a string');
    });

    it('should validate port range', () => {
      const invalid1: any = { name: 'Test', type: 'sqlserver', server: 'localhost', database: 'db', username: 'user', password: 'pass', port: 0 };
      const invalid2: any = { name: 'Test', type: 'sqlserver', server: 'localhost', database: 'db', username: 'user', password: 'pass', port: 70000 };
      expect(validateDataSourceInfo(invalid1)).toContain('Port must be a number between 1 and 65535');
      expect(validateDataSourceInfo(invalid2)).toContain('Port must be a number between 1 and 65535');
    });

    it('should validate optional array fields', () => {
      const invalid: any = {
        name: 'Test',
        type: 'sqlserver',
        server: 'localhost',
        database: 'db',
        username: 'user',
        password: 'pass',
        includedSchemas: 'not an array',
        includedObjectTypes: 'not an array'
      };
      const errors = validateDataSourceInfo(invalid);
      expect(errors).toContain('includedSchemas must be an array if provided');
      expect(errors).toContain('includedObjectTypes must be an array if provided');
    });
  });

  describe('isPreviewResult', () => {
    it('should return true for valid PreviewResult', () => {
      const valid: any = {
        data: [{ id: 1, name: 'Test' }],
        totalCount: 1
      };
      expect(isPreviewResult(valid)).toBe(true);
    });

    it('should return false for invalid PreviewResult', () => {
      expect(isPreviewResult(null)).toBe(false);
      expect(isPreviewResult({})).toBe(false);
      expect(isPreviewResult({ data: [] })).toBe(false);
      expect(isPreviewResult({ totalCount: 0 })).toBe(false);
      expect(isPreviewResult({ data: 'not array', totalCount: 0 })).toBe(false);
    });

    it('should accept empty data array', () => {
      const valid: any = { data: [], totalCount: 0 };
      expect(isPreviewResult(valid)).toBe(true);
    });
  });

  describe('validatePreviewResult', () => {
    it('should return empty array for valid PreviewResult', () => {
      const valid: any = {
        data: [{ id: 1 }],
        totalCount: 1
      };
      expect(validatePreviewResult(valid)).toEqual([]);
    });

    it('should validate data is an array', () => {
      const invalid: any = { data: 'not array', totalCount: 0 };
      expect(validatePreviewResult(invalid)).toContain('Data must be an array');
    });

    it('should validate totalCount is non-negative integer', () => {
      const invalid1: any = { data: [], totalCount: -1 };
      const invalid2: any = { data: [], totalCount: 1.5 };
      expect(validatePreviewResult(invalid1)).toContain('totalCount must be a non-negative integer');
      expect(validatePreviewResult(invalid2)).toContain('totalCount must be a non-negative integer');
    });
  });

  describe('isFieldDataType', () => {
    it('should return true for valid FieldDataType values', () => {
      expect(isFieldDataType(FieldDataType.STRING)).toBe(true);
      expect(isFieldDataType(FieldDataType.NUMBER)).toBe(true);
      expect(isFieldDataType(FieldDataType.DATE)).toBe(true);
      expect(isFieldDataType(FieldDataType.BOOLEAN)).toBe(true);
      expect(isFieldDataType(FieldDataType.CURRENCY)).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(isFieldDataType('invalid')).toBe(false);
      expect(isFieldDataType(null)).toBe(false);
      expect(isFieldDataType(undefined)).toBe(false);
    });
  });

  describe('isFilterOperator', () => {
    it('should return true for valid FilterOperator values', () => {
      expect(isFilterOperator(FilterOperator.EQUALS)).toBe(true);
      expect(isFilterOperator(FilterOperator.CONTAINS)).toBe(true);
      expect(isFilterOperator(FilterOperator.GREATER_THAN)).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(isFilterOperator('invalid')).toBe(false);
      expect(isFilterOperator(null)).toBe(false);
    });
  });

  describe('isAggregationType', () => {
    it('should return true for valid AggregationType values', () => {
      expect(isAggregationType(AggregationType.SUM)).toBe(true);
      expect(isAggregationType(AggregationType.AVG)).toBe(true);
      expect(isAggregationType(AggregationType.COUNT)).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(isAggregationType('invalid')).toBe(false);
      expect(isAggregationType(null)).toBe(false);
    });
  });

  describe('validateSelectedField', () => {
    it('should return empty array for valid SelectedField', () => {
      const valid: any = {
        id: 'field1',
        tableName: 'users',
        fieldName: 'name',
        displayName: 'User Name',
        dataType: FieldDataType.STRING
      };
      expect(validateSelectedField(valid)).toEqual([]);
    });

    it('should validate required fields', () => {
      const invalid: any = {};
      const errors = validateSelectedField(invalid);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('id is required and must be a string');
      expect(errors).toContain('tableName is required and must be a string');
      expect(errors).toContain('fieldName is required and must be a string');
      expect(errors).toContain('displayName is required and must be a string');
      expect(errors).toContain('dataType is required and must be a valid FieldDataType');
    });

    it('should validate dataType is valid', () => {
      const invalid: any = {
        id: 'field1',
        tableName: 'users',
        fieldName: 'name',
        displayName: 'Name',
        dataType: 'invalid'
      };
      const errors = validateSelectedField(invalid);
      expect(errors).toContain('dataType is required and must be a valid FieldDataType');
    });

    it('should validate aggregation if provided', () => {
      const invalid: any = {
        id: 'field1',
        tableName: 'users',
        fieldName: 'amount',
        displayName: 'Amount',
        dataType: FieldDataType.NUMBER,
        aggregation: 'invalid'
      };
      const errors = validateSelectedField(invalid);
      expect(errors).toContain('aggregation must be a valid AggregationType if provided');
    });
  });

  describe('validateFilterCondition', () => {
    it('should return empty array for valid FilterCondition', () => {
      const validField: any = {
        id: 'field1',
        tableName: 'users',
        fieldName: 'name',
        displayName: 'Name',
        dataType: FieldDataType.STRING
      };
      const valid: any = {
        id: 'filter1',
        field: validField,
        operator: FilterOperator.EQUALS,
        value: 'test',
        displayText: 'Name equals test'
      };
      expect(validateFilterCondition(valid)).toEqual([]);
    });

    it('should validate required fields', () => {
      const invalid: any = {};
      const errors = validateFilterCondition(invalid);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('id is required and must be a string');
      expect(errors).toContain('operator is required and must be a valid FilterOperator');
      expect(errors).toContain('displayText is required and must be a string');
    });

    it('should validate field property', () => {
      const invalid: any = {
        id: 'filter1',
        field: {},
        operator: FilterOperator.EQUALS,
        displayText: 'Test'
      };
      const errors = validateFilterCondition(invalid);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateSortField', () => {
    it('should return empty array for valid SortField', () => {
      const valid: any = {
        id: 'sort1',
        tableName: 'users',
        fieldName: 'name',
        displayName: 'Name',
        direction: 'asc'
      };
      expect(validateSortField(valid)).toEqual([]);
    });

    it('should validate required fields', () => {
      const invalid: any = {};
      const errors = validateSortField(invalid);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('id is required and must be a string');
      expect(errors).toContain('tableName is required and must be a string');
      expect(errors).toContain('fieldName is required and must be a string');
      expect(errors).toContain('displayName is required and must be a string');
      expect(errors).toContain('direction is required and must be "asc" or "desc"');
    });

    it('should validate direction is asc or desc', () => {
      const invalid: any = {
        id: 'sort1',
        tableName: 'users',
        fieldName: 'name',
        displayName: 'Name',
        direction: 'invalid'
      };
      const errors = validateSortField(invalid);
      expect(errors).toContain('direction is required and must be "asc" or "desc"');
    });
  });

  describe('validateGroupByField', () => {
    it('should return empty array for valid GroupByField', () => {
      const valid: any = {
        id: 'group1',
        tableName: 'users',
        fieldName: 'category',
        displayName: 'Category'
      };
      expect(validateGroupByField(valid)).toEqual([]);
    });

    it('should validate required fields', () => {
      const invalid: any = {};
      const errors = validateGroupByField(invalid);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('id is required and must be a string');
      expect(errors).toContain('tableName is required and must be a string');
      expect(errors).toContain('fieldName is required and must be a string');
      expect(errors).toContain('displayName is required and must be a string');
    });
  });

  describe('validateReportParameter', () => {
    it('should return empty array for valid ReportParameter', () => {
      const valid: any = {
        id: 'param1',
        name: 'startDate',
        type: 'date'
      };
      expect(validateReportParameter(valid)).toEqual([]);
    });

    it('should validate required fields', () => {
      const invalid: any = {};
      const errors = validateReportParameter(invalid);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('id is required and must be a string');
      expect(errors).toContain('name is required and must be a string');
      expect(errors).toContain('type is required and must be a string');
    });

    it('should validate required property is boolean if provided', () => {
      const invalid: any = {
        id: 'param1',
        name: 'test',
        type: 'string',
        required: 'not boolean'
      };
      const errors = validateReportParameter(invalid);
      expect(errors).toContain('required must be a boolean if provided');
    });
  });

  describe('validateReportDefinition', () => {
    const validDataSource: any = {
      name: 'Test DB',
      type: 'sqlserver',
      server: 'localhost',
      database: 'testdb',
      username: 'user',
      password: 'pass'
    };

    const validField: any = {
      id: 'field1',
      tableName: 'users',
      fieldName: 'name',
      displayName: 'Name',
      dataType: FieldDataType.STRING
    };

    it('should return empty array for valid ReportDefinition', () => {
      const valid: any = {
        name: 'Test Report',
        dataSource: validDataSource,
        selectedFields: [validField],
        filters: [],
        groupBy: [],
        sorting: [],
        layout: {},
        parameters: []
      };
      expect(validateReportDefinition(valid)).toEqual([]);
    });

    it('should validate required fields', () => {
      const invalid: any = {};
      const errors = validateReportDefinition(invalid);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('name is required and must be a non-empty string');
      expect(errors).toContain('layout is required and must be an object');
    });

    it('should validate name is non-empty', () => {
      const invalid: any = {
        name: '   ',
        dataSource: validDataSource,
        selectedFields: [],
        filters: [],
        groupBy: [],
        sorting: [],
        layout: {},
        parameters: []
      };
      const errors = validateReportDefinition(invalid);
      expect(errors).toContain('name is required and must be a non-empty string');
    });

    it('should validate description is string if provided', () => {
      const invalid: any = {
        name: 'Test',
        description: 123,
        dataSource: validDataSource,
        selectedFields: [],
        filters: [],
        groupBy: [],
        sorting: [],
        layout: {},
        parameters: []
      };
      const errors = validateReportDefinition(invalid);
      expect(errors).toContain('description must be a string if provided');
    });

    it('should validate arrays', () => {
      const invalid: any = {
        name: 'Test',
        dataSource: validDataSource,
        selectedFields: 'not array',
        filters: 'not array',
        groupBy: 'not array',
        sorting: 'not array',
        layout: {},
        parameters: 'not array'
      };
      const errors = validateReportDefinition(invalid);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('selectedFields must be an array');
      expect(errors).toContain('filters must be an array');
      expect(errors).toContain('groupBy must be an array');
      expect(errors).toContain('sorting must be an array');
      expect(errors).toContain('parameters must be an array');
    });

    it('should validate array contents', () => {
      const invalid: any = {
        name: 'Test',
        dataSource: validDataSource,
        selectedFields: [{}], // Invalid field
        filters: [{}], // Invalid filter
        groupBy: [{}], // Invalid group
        sorting: [{}], // Invalid sort
        layout: {},
        parameters: [{}] // Invalid parameter
      };
      const errors = validateReportDefinition(invalid);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('selectedFields[0]'))).toBe(true);
      expect(errors.some(e => e.includes('filters[0]'))).toBe(true);
      expect(errors.some(e => e.includes('groupBy[0]'))).toBe(true);
      expect(errors.some(e => e.includes('sorting[0]'))).toBe(true);
      expect(errors.some(e => e.includes('parameters[0]'))).toBe(true);
    });
  });

  describe('validateSchemaInfo', () => {
    it('should return empty array for valid SchemaInfo', () => {
      const valid: any = {
        tables: [
          {
            name: 'users',
            columns: [
              { name: 'id', dataType: 'int' },
              { name: 'name', dataType: 'varchar' }
            ]
          }
        ]
      };
      expect(validateSchemaInfo(valid)).toEqual([]);
    });

    it('should validate tables is an array', () => {
      const invalid: any = { tables: 'not array' };
      expect(validateSchemaInfo(invalid)).toContain('tables must be an array');
    });

    it('should validate table structure', () => {
      const invalid: any = {
        tables: [
          { name: 'users' }, // Missing columns
          { columns: [] } // Missing name
        ]
      };
      const errors = validateSchemaInfo(invalid);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate columns structure', () => {
      const invalid: any = {
        tables: [
          {
            name: 'users',
            columns: [
              { name: 'id' }, // Missing dataType
              { dataType: 'int' } // Missing name
            ]
          }
        ]
      };
      const errors = validateSchemaInfo(invalid);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate relationships if provided', () => {
      const invalid: any = {
        tables: [{ name: 'users', columns: [{ name: 'id', dataType: 'int' }] }],
        relationships: [
          {} // Invalid relationship
        ]
      };
      const errors = validateSchemaInfo(invalid);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('relationships[0]'))).toBe(true);
    });

    it('should validate relationships array', () => {
      const invalid: any = {
        tables: [{ name: 'users', columns: [{ name: 'id', dataType: 'int' }] }],
        relationships: 'not array'
      };
      const errors = validateSchemaInfo(invalid);
      expect(errors).toContain('relationships must be an array if provided');
    });

    it('should validate relationship required fields', () => {
      const invalid: any = {
        tables: [{ name: 'users', columns: [{ name: 'id', dataType: 'int' }] }],
        relationships: [
          {
            id: 'rel1',
            name: 'rel1',
            parentTable: 'users',
            childTable: 'orders',
            columnMappings: []
          },
          {
            // Missing required fields
          }
        ]
      };
      const errors = validateSchemaInfo(invalid);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate columnMappings is array', () => {
      const invalid: any = {
        tables: [{ name: 'users', columns: [{ name: 'id', dataType: 'int' }] }],
        relationships: [
          {
            id: 'rel1',
            name: 'rel1',
            parentTable: 'users',
            childTable: 'orders',
            columnMappings: 'not array'
          }
        ]
      };
      const errors = validateSchemaInfo(invalid);
      expect(errors).toContain('relationships[0].columnMappings must be an array');
    });
  });

  describe('isNumericDataType', () => {
    it('should return true for numeric data types', () => {
      expect(isNumericDataType(FieldDataType.NUMBER)).toBe(true);
      expect(isNumericDataType(FieldDataType.CURRENCY)).toBe(true);
      expect(isNumericDataType(FieldDataType.SMALLINT)).toBe(true);
      expect(isNumericDataType(FieldDataType.BIGINT)).toBe(true);
      expect(isNumericDataType(FieldDataType.FLOAT)).toBe(true);
      expect(isNumericDataType(FieldDataType.DOUBLE)).toBe(true);
      expect(isNumericDataType(FieldDataType.DECIMAL)).toBe(true);
      expect(isNumericDataType(FieldDataType.NUMERIC)).toBe(true);
      expect(isNumericDataType(FieldDataType.MONEY)).toBe(true);
    });

    it('should return false for non-numeric data types', () => {
      expect(isNumericDataType(FieldDataType.STRING)).toBe(false);
      expect(isNumericDataType(FieldDataType.DATE)).toBe(false);
      expect(isNumericDataType(FieldDataType.BOOLEAN)).toBe(false);
    });
  });

  describe('isGroupableDataType', () => {
    it('should return true for groupable data types', () => {
      expect(isGroupableDataType(FieldDataType.STRING)).toBe(true);
      expect(isGroupableDataType(FieldDataType.DATE)).toBe(true);
      expect(isGroupableDataType(FieldDataType.BOOLEAN)).toBe(true);
      expect(isGroupableDataType(FieldDataType.NUMBER)).toBe(true);
    });

    it('should return false for non-groupable data types', () => {
      expect(isGroupableDataType(FieldDataType.CURRENCY)).toBe(false);
      expect(isGroupableDataType(FieldDataType.FLOAT)).toBe(false);
    });
  });

  describe('isDateDataType', () => {
    it('should return true for date data type', () => {
      expect(isDateDataType(FieldDataType.DATE)).toBe(true);
    });

    it('should return false for non-date data types', () => {
      expect(isDateDataType(FieldDataType.STRING)).toBe(false);
      expect(isDateDataType(FieldDataType.NUMBER)).toBe(false);
    });
  });

  describe('getFieldDataTypeDisplayName', () => {
    it('should return display names for all data types', () => {
      expect(getFieldDataTypeDisplayName(FieldDataType.STRING)).toBe('Text');
      expect(getFieldDataTypeDisplayName(FieldDataType.NUMBER)).toBe('Number');
      expect(getFieldDataTypeDisplayName(FieldDataType.DATE)).toBe('Date');
      expect(getFieldDataTypeDisplayName(FieldDataType.BOOLEAN)).toBe('Boolean');
      expect(getFieldDataTypeDisplayName(FieldDataType.CURRENCY)).toBe('Currency');
      expect(getFieldDataTypeDisplayName(FieldDataType.MONEY)).toBe('Money');
    });
  });

  describe('getFilterOperatorDisplayName', () => {
    it('should return display names for all operators', () => {
      expect(getFilterOperatorDisplayName(FilterOperator.EQUALS)).toBe('Equals');
      expect(getFilterOperatorDisplayName(FilterOperator.CONTAINS)).toBe('Contains');
      expect(getFilterOperatorDisplayName(FilterOperator.GREATER_THAN)).toBe('Greater Than');
      expect(getFilterOperatorDisplayName(FilterOperator.BETWEEN)).toBe('Between');
    });
  });

  describe('getAggregationTypeDisplayName', () => {
    it('should return display names for all aggregation types', () => {
      expect(getAggregationTypeDisplayName(AggregationType.SUM)).toBe('Sum');
      expect(getAggregationTypeDisplayName(AggregationType.AVG)).toBe('Average');
      expect(getAggregationTypeDisplayName(AggregationType.COUNT)).toBe('Count');
      expect(getAggregationTypeDisplayName(AggregationType.MIN)).toBe('Minimum');
      expect(getAggregationTypeDisplayName(AggregationType.MAX)).toBe('Maximum');
    });
  });
});
