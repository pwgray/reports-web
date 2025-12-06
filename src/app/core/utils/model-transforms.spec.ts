/**
 * Unit tests for model transform utility functions.
 */

import {
  cloneDataSourceInfo,
  normalizeDataSourceInfo,
  mergeDataSourceInfo,
  createConnectionString,
  extractTableNames,
  hasAggregatedFields,
  getAggregatedFields,
  getGroupFields,
  normalizeFieldDataType,
  serializeReportDefinition,
  countSchemaColumns,
  getUniqueDataTypes,
  getTablesWithForeignKeys
} from './model-transforms';
import { DataSourceInfo } from '../models/data-source-info.model';
import { ReportDefinition, FieldDataType, AggregationType } from '../models/report.models';
import { SchemaInfo } from '../models/schema-info.model';

describe('ModelTransforms', () => {
  describe('cloneDataSourceInfo', () => {
    const source: DataSourceInfo = {
      id: '1',
      name: 'Test DB',
      type: 'sqlserver',
      server: 'localhost',
      port: 1433,
      database: 'testdb',
      username: 'user',
      password: 'secret',
      includedSchemas: ['dbo', 'custom'],
      includedObjectTypes: ['table']
    };

    it('should create a deep copy', () => {
      const cloned = cloneDataSourceInfo(source);
      expect(cloned).not.toBe(source);
      expect(cloned).toEqual(source);
    });

    it('should not share reference to arrays', () => {
      const cloned = cloneDataSourceInfo(source);
      cloned.includedSchemas!.push('new');
      expect(source.includedSchemas).not.toContain('new');
    });

    it('should omit password when omitPassword is true', () => {
      const cloned = cloneDataSourceInfo(source, true);
      expect('password' in cloned).toBe(false);
      expect(cloned.name).toBe(source.name);
    });

    it('should handle undefined optional fields', () => {
      const minimal: DataSourceInfo = {
        name: 'Test',
        type: 'sqlserver',
        server: 'localhost',
        database: 'db',
        username: 'user',
        password: 'pass'
      };
      const cloned = cloneDataSourceInfo(minimal);
      expect(cloned.port).toBeUndefined();
      expect(cloned.includedSchemas).toBeUndefined();
    });
  });

  describe('normalizeDataSourceInfo', () => {
    it('should set default values for missing fields', () => {
      const partial: Partial<DataSourceInfo> = {
        name: 'Test',
        database: 'db',
        username: 'user',
        password: 'pass'
      };
      const normalized = normalizeDataSourceInfo(partial);
      expect(normalized.type).toBe('sqlserver');
      expect(normalized.server).toBe('localhost');
      expect(normalized.includedSchemas).toEqual([]);
      expect(normalized.includedObjectTypes).toEqual([]);
    });

    it('should preserve provided values', () => {
      const partial: Partial<DataSourceInfo> = {
        name: 'Test',
        type: 'postgresql',
        server: 'remote',
        port: 5432,
        database: 'db',
        username: 'user',
        password: 'pass'
      };
      const normalized = normalizeDataSourceInfo(partial);
      expect(normalized.name).toBe('Test');
      expect(normalized.type).toBe('postgresql');
      expect(normalized.server).toBe('remote');
      expect(normalized.port).toBe(5432);
    });
  });

  describe('mergeDataSourceInfo', () => {
    const base: DataSourceInfo = {
      name: 'Base DB',
      type: 'sqlserver',
      server: 'localhost',
      database: 'base',
      username: 'user',
      password: 'pass',
      includedSchemas: ['dbo']
    };

    it('should merge updates into base', () => {
      const updates: Partial<DataSourceInfo> = {
        name: 'Updated DB',
        port: 1433
      };
      const merged = mergeDataSourceInfo(base, updates);
      expect(merged.name).toBe('Updated DB');
      expect(merged.port).toBe(1433);
      expect(merged.type).toBe(base.type);
    });

    it('should handle array fields correctly', () => {
      const updates: Partial<DataSourceInfo> = {
        includedSchemas: ['custom']
      };
      const merged = mergeDataSourceInfo(base, updates);
      expect(merged.includedSchemas).toEqual(['custom']);
    });

    it('should preserve base arrays if not updated', () => {
      const updates: Partial<DataSourceInfo> = {
        name: 'Updated'
      };
      const merged = mergeDataSourceInfo(base, updates);
      expect(merged.includedSchemas).toEqual(['dbo']);
    });
  });

  describe('createConnectionString', () => {
    it('should create SQL Server connection string', () => {
      const ds: DataSourceInfo = {
        name: 'Test',
        type: 'sqlserver',
        server: 'localhost',
        port: 1433,
        database: 'testdb',
        username: 'user',
        password: 'pass'
      };
      const connStr = createConnectionString(ds);
      expect(connStr).toContain('Server=localhost:1433');
      expect(connStr).toContain('Database=testdb');
      expect(connStr).toContain('User Id=user');
      expect(connStr).toContain('Password=pass');
    });

    it('should create PostgreSQL connection string', () => {
      const ds: DataSourceInfo = {
        name: 'Test',
        type: 'postgresql',
        server: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'user',
        password: 'pass'
      };
      const connStr = createConnectionString(ds);
      expect(connStr).toBe('postgresql://user:pass@localhost:5432/testdb');
    });

    it('should create MySQL connection string', () => {
      const ds: DataSourceInfo = {
        name: 'Test',
        type: 'mysql',
        server: 'localhost',
        database: 'testdb',
        username: 'user',
        password: 'pass'
      };
      const connStr = createConnectionString(ds);
      expect(connStr).toContain('mysql://');
      expect(connStr).toContain('localhost');
    });

    it('should handle missing port', () => {
      const ds: DataSourceInfo = {
        name: 'Test',
        type: 'sqlserver',
        server: 'localhost',
        database: 'testdb',
        username: 'user',
        password: 'pass'
      };
      const connStr = createConnectionString(ds);
      expect(connStr).not.toContain(':undefined');
    });

    it('should handle Oracle connection string', () => {
      const ds: DataSourceInfo = {
        name: 'Test',
        type: 'oracle',
        server: 'localhost',
        port: 1521,
        database: 'orcl',
        username: 'user',
        password: 'pass'
      };
      const connStr = createConnectionString(ds);
      expect(connStr).toContain('HOST=localhost');
      expect(connStr).toContain('PORT=1521');
      expect(connStr).toContain('SID=orcl');
    });
  });

  describe('extractTableNames', () => {
    const report: ReportDefinition = {
      name: 'Test Report',
      dataSource: {} as DataSourceInfo,
      selectedFields: [
        { id: '1', tableName: 'users', fieldName: 'name', displayName: 'Name', dataType: FieldDataType.STRING },
        { id: '2', tableName: 'users', fieldName: 'email', displayName: 'Email', dataType: FieldDataType.STRING },
        { id: '3', tableName: 'orders', fieldName: 'total', displayName: 'Total', dataType: FieldDataType.NUMBER }
      ],
      filters: [],
      groupBy: [
        { id: '1', tableName: 'users', fieldName: 'category', displayName: 'Category' }
      ],
      sorting: [
        { id: '1', tableName: 'orders', fieldName: 'date', displayName: 'Date', direction: 'asc' }
      ],
      layout: {},
      parameters: []
    };

    it('should extract unique table names from selected fields', () => {
      const tableNames = extractTableNames(report);
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('orders');
    });

    it('should include tables from groupBy and sorting', () => {
      const tableNames = extractTableNames(report);
      expect(tableNames.length).toBe(2);
    });

    it('should return empty array for report with no fields', () => {
      const emptyReport: ReportDefinition = {
        name: 'Empty',
        dataSource: {} as DataSourceInfo,
        selectedFields: [],
        filters: [],
        groupBy: [],
        sorting: [],
        layout: {},
        parameters: []
      };
      expect(extractTableNames(emptyReport)).toEqual([]);
    });
  });

  describe('hasAggregatedFields', () => {
    it('should return true when report has aggregated fields', () => {
      const report: ReportDefinition = {
        name: 'Test',
        dataSource: {} as DataSourceInfo,
        selectedFields: [
          { id: '1', tableName: 'users', fieldName: 'total', displayName: 'Total', dataType: FieldDataType.NUMBER, aggregation: AggregationType.SUM }
        ],
        filters: [],
        groupBy: [],
        sorting: [],
        layout: {},
        parameters: []
      };
      expect(hasAggregatedFields(report)).toBe(true);
    });

    it('should return false when report has no aggregated fields', () => {
      const report: ReportDefinition = {
        name: 'Test',
        dataSource: {} as DataSourceInfo,
        selectedFields: [
          { id: '1', tableName: 'users', fieldName: 'name', displayName: 'Name', dataType: FieldDataType.STRING }
        ],
        filters: [],
        groupBy: [],
        sorting: [],
        layout: {},
        parameters: []
      };
      expect(hasAggregatedFields(report)).toBe(false);
    });

    it('should return false for empty selectedFields', () => {
      const report: ReportDefinition = {
        name: 'Test',
        dataSource: {} as DataSourceInfo,
        selectedFields: [],
        filters: [],
        groupBy: [],
        sorting: [],
        layout: {},
        parameters: []
      };
      expect(hasAggregatedFields(report)).toBe(false);
    });
  });

  describe('getAggregatedFields', () => {
    it('should return only fields with aggregations', () => {
      const report: ReportDefinition = {
        name: 'Test',
        dataSource: {} as DataSourceInfo,
        selectedFields: [
          { id: '1', tableName: 'users', fieldName: 'name', displayName: 'Name', dataType: FieldDataType.STRING },
          { id: '2', tableName: 'users', fieldName: 'total', displayName: 'Total', dataType: FieldDataType.NUMBER, aggregation: AggregationType.SUM },
          { id: '3', tableName: 'users', fieldName: 'count', displayName: 'Count', dataType: FieldDataType.NUMBER, aggregation: AggregationType.COUNT }
        ],
        filters: [],
        groupBy: [],
        sorting: [],
        layout: {},
        parameters: []
      };
      const aggregated = getAggregatedFields(report);
      expect(aggregated.length).toBe(2);
      expect(aggregated[0].aggregation).toBe(AggregationType.SUM);
      expect(aggregated[1].aggregation).toBe(AggregationType.COUNT);
    });

    it('should return empty array when no aggregations', () => {
      const report: ReportDefinition = {
        name: 'Test',
        dataSource: {} as DataSourceInfo,
        selectedFields: [
          { id: '1', tableName: 'users', fieldName: 'name', displayName: 'Name', dataType: FieldDataType.STRING }
        ],
        filters: [],
        groupBy: [],
        sorting: [],
        layout: {},
        parameters: []
      };
      expect(getAggregatedFields(report)).toEqual([]);
    });
  });

  describe('getGroupFields', () => {
    it('should return fields used for grouping', () => {
      const report: ReportDefinition = {
        name: 'Test',
        dataSource: {} as DataSourceInfo,
        selectedFields: [
          { id: '1', tableName: 'users', fieldName: 'category', displayName: 'Category', dataType: FieldDataType.STRING },
          { id: '2', tableName: 'users', fieldName: 'name', displayName: 'Name', dataType: FieldDataType.STRING }
        ],
        filters: [],
        groupBy: [
          { id: '1', tableName: 'users', fieldName: 'category', displayName: 'Category' }
        ],
        sorting: [],
        layout: {},
        parameters: []
      };
      const groupFields = getGroupFields(report);
      expect(groupFields.length).toBe(1);
      expect(groupFields[0].id).toBe('1');
    });

    it('should return empty array when no grouping', () => {
      const report: ReportDefinition = {
        name: 'Test',
        dataSource: {} as DataSourceInfo,
        selectedFields: [
          { id: '1', tableName: 'users', fieldName: 'name', displayName: 'Name', dataType: FieldDataType.STRING }
        ],
        filters: [],
        groupBy: [],
        sorting: [],
        layout: {},
        parameters: []
      };
      expect(getGroupFields(report)).toEqual([]);
    });
  });

  describe('normalizeFieldDataType', () => {
    it('should normalize string types', () => {
      expect(normalizeFieldDataType('varchar(50)')).toBe(FieldDataType.STRING);
      expect(normalizeFieldDataType('nvarchar')).toBe(FieldDataType.STRING);
      expect(normalizeFieldDataType('text')).toBe(FieldDataType.STRING);
      expect(normalizeFieldDataType('char')).toBe(FieldDataType.STRING);
    });

    it('should normalize integer types', () => {
      expect(normalizeFieldDataType('int')).toBe(FieldDataType.NUMBER);
      expect(normalizeFieldDataType('integer')).toBe(FieldDataType.NUMBER);
      expect(normalizeFieldDataType('bigint')).toBe(FieldDataType.BIGINT);
      expect(normalizeFieldDataType('smallint')).toBe(FieldDataType.SMALLINT);
      expect(normalizeFieldDataType('int8')).toBe(FieldDataType.BIGINT);
      expect(normalizeFieldDataType('int2')).toBe(FieldDataType.SMALLINT);
    });

    it('should normalize floating point types', () => {
      expect(normalizeFieldDataType('float')).toBe(FieldDataType.FLOAT);
      expect(normalizeFieldDataType('real')).toBe(FieldDataType.FLOAT);
      expect(normalizeFieldDataType('double')).toBe(FieldDataType.DOUBLE);
    });

    it('should normalize decimal types', () => {
      expect(normalizeFieldDataType('decimal(10,2)')).toBe(FieldDataType.DECIMAL);
      expect(normalizeFieldDataType('numeric')).toBe(FieldDataType.DECIMAL);
    });

    it('should normalize money types', () => {
      expect(normalizeFieldDataType('money')).toBe(FieldDataType.MONEY);
      expect(normalizeFieldDataType('currency')).toBe(FieldDataType.MONEY);
    });

    it('should normalize date types', () => {
      expect(normalizeFieldDataType('date')).toBe(FieldDataType.DATE);
      expect(normalizeFieldDataType('datetime')).toBe(FieldDataType.DATE);
      expect(normalizeFieldDataType('timestamp')).toBe(FieldDataType.DATE);
      expect(normalizeFieldDataType('time')).toBe(FieldDataType.DATE);
    });

    it('should normalize boolean types', () => {
      expect(normalizeFieldDataType('boolean')).toBe(FieldDataType.BOOLEAN);
      expect(normalizeFieldDataType('bool')).toBe(FieldDataType.BOOLEAN);
      expect(normalizeFieldDataType('bit')).toBe(FieldDataType.BOOLEAN);
    });

    it('should default to string for unknown types', () => {
      expect(normalizeFieldDataType('unknown_type')).toBe(FieldDataType.STRING);
      expect(normalizeFieldDataType('')).toBe(FieldDataType.STRING);
    });

    it('should handle case insensitive normalization', () => {
      expect(normalizeFieldDataType('INT')).toBe(FieldDataType.NUMBER);
      expect(normalizeFieldDataType('VARCHAR')).toBe(FieldDataType.STRING);
    });
  });

  describe('serializeReportDefinition', () => {
    const report: ReportDefinition = {
      id: 'report1',
      name: 'Test Report',
      description: 'Test Description',
      dataSource: {
        id: 'ds1',
        name: 'Test DB',
        type: 'sqlserver',
        server: 'localhost',
        database: 'testdb',
        username: 'user',
        password: 'secret'
      },
      selectedFields: [
        { id: '1', tableName: 'users', fieldName: 'name', displayName: 'Name', dataType: FieldDataType.STRING }
      ],
      filters: [],
      groupBy: [],
      sorting: [],
      layout: {},
      parameters: []
    };

    it('should serialize report definition', () => {
      const serialized = serializeReportDefinition(report);
      expect(serialized.id).toBe(report.id);
      expect(serialized.name).toBe(report.name);
      expect(serialized.dataSource).toBeDefined();
    });

    it('should omit password from data source', () => {
      const serialized = serializeReportDefinition(report);
      expect(serialized.dataSource.password).toBeUndefined();
    });

    it('should preserve all report structure', () => {
      const serialized = serializeReportDefinition(report);
      expect(serialized.selectedFields).toEqual(report.selectedFields);
      expect(serialized.filters).toEqual(report.filters);
      expect(serialized.groupBy).toEqual(report.groupBy);
      expect(serialized.sorting).toEqual(report.sorting);
      expect(serialized.layout).toEqual(report.layout);
      expect(serialized.parameters).toEqual(report.parameters);
    });
  });

  describe('countSchemaColumns', () => {
    it('should count columns across all tables', () => {
      const schema: SchemaInfo = {
        tables: [
          {
            name: 'table1',
            columns: [
              { name: 'col1', dataType: 'int' },
              { name: 'col2', dataType: 'varchar' }
            ]
          },
          {
            name: 'table2',
            columns: [
              { name: 'col1', dataType: 'int' }
            ]
          }
        ]
      };
      expect(countSchemaColumns(schema)).toBe(3);
    });

    it('should return 0 for empty schema', () => {
      const schema: SchemaInfo = {
        tables: []
      };
      expect(countSchemaColumns(schema)).toBe(0);
    });

    it('should handle tables with no columns', () => {
      const schema: SchemaInfo = {
        tables: [
          { name: 'table1', columns: [] }
        ]
      };
      expect(countSchemaColumns(schema)).toBe(0);
    });
  });

  describe('getUniqueDataTypes', () => {
    it('should extract unique data types from schema', () => {
      const schema: SchemaInfo = {
        tables: [
          {
            name: 'table1',
            columns: [
              { name: 'col1', dataType: 'int', normalizedType: 'number' },
              { name: 'col2', dataType: 'varchar', normalizedType: 'string' },
              { name: 'col3', dataType: 'int' } // Duplicate
            ]
          }
        ]
      };
      const dataTypes = getUniqueDataTypes(schema);
      expect(dataTypes).toContain('int');
      expect(dataTypes).toContain('varchar');
      expect(dataTypes).toContain('number');
      expect(dataTypes).toContain('string');
    });

    it('should return empty array for empty schema', () => {
      const schema: SchemaInfo = {
        tables: []
      };
      expect(getUniqueDataTypes(schema)).toEqual([]);
    });

    it('should handle columns without dataType', () => {
      const schema: SchemaInfo = {
        tables: [
          {
            name: 'table1',
            columns: [
              { name: 'col1', dataType: 'int' },
              { name: 'col2' } as any
            ]
          }
        ]
      };
      const dataTypes = getUniqueDataTypes(schema);
      expect(dataTypes).toEqual(['int']);
    });
  });

  describe('getTablesWithForeignKeys', () => {
    it('should return tables that have foreign keys', () => {
      const schema: SchemaInfo = {
        tables: [
          {
            name: 'table1',
            columns: [
              { name: 'id', dataType: 'int', isPrimaryKey: true },
              { name: 'fk_id', dataType: 'int', isForeignKey: true }
            ]
          },
          {
            name: 'table2',
            columns: [
              { name: 'id', dataType: 'int', isPrimaryKey: true }
            ]
          }
        ]
      };
      const tables = getTablesWithForeignKeys(schema);
      expect(tables).toContain('table1');
      expect(tables).not.toContain('table2');
    });

    it('should return empty array when no foreign keys', () => {
      const schema: SchemaInfo = {
        tables: [
          {
            name: 'table1',
            columns: [
              { name: 'id', dataType: 'int', isPrimaryKey: true }
            ]
          }
        ]
      };
      expect(getTablesWithForeignKeys(schema)).toEqual([]);
    });

    it('should handle empty schema', () => {
      const schema: SchemaInfo = {
        tables: []
      };
      expect(getTablesWithForeignKeys(schema)).toEqual([]);
    });
  });

  describe('edge cases and additional coverage', () => {
    it('should handle null/undefined gracefully in extractTableNames', () => {
      const report: ReportDefinition = {
        name: 'Test',
        dataSource: {} as DataSourceInfo,
        selectedFields: [
          { id: '1', tableName: undefined as any, fieldName: 'name', displayName: 'Name', dataType: FieldDataType.STRING }
        ],
        filters: [],
        groupBy: [],
        sorting: [],
        layout: {},
        parameters: []
      };
      const tableNames = extractTableNames(report);
      expect(tableNames.length).toBe(0);
    });

    it('should handle null/undefined in getAggregatedFields', () => {
      const report: ReportDefinition = {
        name: 'Test',
        dataSource: {} as DataSourceInfo,
        selectedFields: undefined as any,
        filters: [],
        groupBy: [],
        sorting: [],
        layout: {},
        parameters: []
      };
      expect(getAggregatedFields(report)).toEqual([]);
    });

    it('should handle null/undefined in getGroupFields', () => {
      const report: ReportDefinition = {
        name: 'Test',
        dataSource: {} as DataSourceInfo,
        selectedFields: undefined as any,
        filters: [],
        groupBy: [],
        sorting: [],
        layout: {},
        parameters: []
      };
      expect(getGroupFields(report)).toEqual([]);
    });

    it('should serialize report with null dataSource', () => {
      const report: ReportDefinition = {
        name: 'Test',
        dataSource: null as any,
        selectedFields: [],
        filters: [],
        groupBy: [],
        sorting: [],
        layout: {},
        parameters: []
      };
      const serialized = serializeReportDefinition(report);
      expect(serialized.dataSource).toBeNull();
    });
  });
});
