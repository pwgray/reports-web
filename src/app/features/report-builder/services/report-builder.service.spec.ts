/**
 * Unit tests for ReportBuilderService.
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReportBuilderService } from './report-builder.service';
import { ReportDefinition } from '../../../core/models/report.models';
import { DataSourceInfo } from '../../../core/models/data-source-info.model';
import { SchemaInfo } from '../../../core/models/schema-info.model';
import { PreviewResult } from '../../../core/models/preview-result.model';
import { environment } from '../../../../environments/environment';

describe('ReportBuilderService', () => {
  let service: ReportBuilderService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReportBuilderService]
    });
    service = TestBed.inject(ReportBuilderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getReports', () => {
    it('should retrieve all reports', () => {
      const mockReports: ReportDefinition[] = [
        {
          id: '1',
          name: 'Test Report',
          dataSource: {} as DataSourceInfo,
          selectedFields: [],
          filters: [],
          groupBy: [],
          sorting: [],
          layout: {},
          parameters: []
        }
      ];

      service.getReports().subscribe(reports => {
        expect(reports).toEqual(mockReports);
        expect(reports.length).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}/reports`);
      expect(req.request.method).toBe('GET');
      req.flush(mockReports);
    });

    it('should handle empty reports array', () => {
      service.getReports().subscribe(reports => {
        expect(reports).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiUrl}/reports`);
      req.flush([]);
    });
  });

  describe('getCurrentReport', () => {
    it('should return null initially', () => {
      service.getCurrentReport().subscribe(report => {
        expect(report).toBeNull();
      });
    });

    it('should return current report after update', () => {
      const mockReport: ReportDefinition = {
        id: '1',
        name: 'Test Report',
        dataSource: {} as DataSourceInfo,
        selectedFields: [],
        filters: [],
        groupBy: [],
        sorting: [],
        layout: {},
        parameters: []
      };

      service.updateCurrentReport(mockReport);

      service.getCurrentReport().subscribe(report => {
        expect(report).toEqual(mockReport);
      });
    });
  });

  describe('updateCurrentReport', () => {
    it('should update current report', () => {
      const mockReport: ReportDefinition = {
        id: '1',
        name: 'Updated Report',
        dataSource: {} as DataSourceInfo,
        selectedFields: [],
        filters: [],
        groupBy: [],
        sorting: [],
        layout: {},
        parameters: []
      };

      service.updateCurrentReport(mockReport);

      service.getCurrentReport().subscribe(report => {
        expect(report).toEqual(mockReport);
        expect(report?.name).toBe('Updated Report');
      });
    });
  });

  describe('getDataSources', () => {
    it('should retrieve all data sources', () => {
      const mockDataSources: DataSourceInfo[] = [
        {
          id: '1',
          name: 'Test DB',
          type: 'sqlserver',
          server: 'localhost',
          database: 'testdb',
          username: 'user',
          password: 'pass'
        }
      ];

      service.getDataSources().subscribe(dataSources => {
        expect(dataSources).toEqual(mockDataSources);
      });

      const req = httpMock.expectOne(`${apiUrl}/data-sources`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDataSources);
    });
  });

  describe('previewReport', () => {
    it('should preview a report', () => {
      const mockReport: ReportDefinition = {
        id: '1',
        name: 'Test Report',
        dataSource: {} as DataSourceInfo,
        selectedFields: [],
        filters: [],
        groupBy: [],
        sorting: [],
        layout: {},
        parameters: []
      };

      const mockPreview: PreviewResult = {
        data: [{ id: 1, name: 'Test' }],
        totalCount: 1
      };

      service.previewReport(mockReport).subscribe(result => {
        expect(result).toEqual(mockPreview);
        expect(result.data.length).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}/reports/preview`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.limit).toBe(1000000);
      req.flush(mockPreview);
    });

    it('should preview report with custom limit', () => {
      const mockReport: ReportDefinition = {
        id: '1',
        name: 'Test Report',
        dataSource: {} as DataSourceInfo,
        selectedFields: [],
        filters: [],
        groupBy: [],
        sorting: [],
        layout: {},
        parameters: []
      };

      service.previewReport(mockReport, 100).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/reports/preview`);
      expect(req.request.body.limit).toBe(100);
      req.flush({ data: [], totalCount: 0 });
    });
  });

  describe('saveReport', () => {
    it('should create a new report', () => {
      const mockReport: ReportDefinition = {
        name: 'New Report',
        dataSource: {} as DataSourceInfo,
        selectedFields: [],
        filters: [],
        groupBy: [],
        sorting: [],
        layout: {},
        parameters: []
      };

      const savedReport = { ...mockReport, id: '1' };

      service.saveReport(mockReport).subscribe(report => {
        expect(report).toEqual(savedReport);
        expect(report.id).toBe('1');
      });

      const req = httpMock.expectOne(`${apiUrl}/reports`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.name).toBe('New Report');
      req.flush(savedReport);
    });

    it('should update an existing report', () => {
      const mockReport: ReportDefinition = {
        id: '1',
        name: 'Updated Report',
        dataSource: {} as DataSourceInfo,
        selectedFields: [],
        filters: [],
        groupBy: [],
        sorting: [],
        layout: {},
        parameters: []
      };

      service.saveReport(mockReport).subscribe(report => {
        expect(report).toEqual(mockReport);
      });

      const req = httpMock.expectOne(`${apiUrl}/reports/1`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockReport);
    });

    it('should transform report structure correctly', () => {
      const mockReport: ReportDefinition = {
        id: '1',
        name: 'Test Report',
        description: 'Test Description',
        dataSource: {} as DataSourceInfo,
        selectedFields: [{ id: 'f1', tableName: 'users', fieldName: 'name', displayName: 'Name', dataType: 'string' as any }],
        filters: [],
        groupBy: [],
        sorting: [],
        layout: { orientation: 'portrait', pageSize: 'A4' },
        parameters: []
      };

      service.saveReport(mockReport).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/reports/1`);
      expect(req.request.body.queryConfig).toBeDefined();
      expect(req.request.body.layoutConfig).toBeDefined();
      req.flush(mockReport);
    });
  });

  describe('generateReport', () => {
    it('should generate report in Excel format', () => {
      const reportId = '1';
      const parameters = {};
      const format = 'excel' as const;
      const mockBlob = new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      service.generateReport(reportId, parameters, format).subscribe(blob => {
        expect(blob).toBeInstanceOf(Blob);
      });

      const req = httpMock.expectOne(`${apiUrl}/reports/1/generate`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.format).toBe('excel');
      req.flush(mockBlob);
    });
  });

  describe('deleteReport', () => {
    it('should delete a report', () => {
      const reportId = '1';

      service.deleteReport(reportId).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/reports/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('getSchema', () => {
    it('should retrieve schema for a data source', () => {
      const dataSourceId = '1';
      const mockSchema: SchemaInfo = {
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

      service.getSchema(dataSourceId).subscribe(schema => {
        expect(schema).toEqual(mockSchema);
        expect(schema.tables.length).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}/data-sources/1/schema`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSchema);
    });
  });

  describe('introspectSchema', () => {
    it('should introspect database schema', () => {
      const mockSchema: SchemaInfo = {
        tables: []
      };

      service.introspectSchema(
        'localhost',
        1433,
        'testdb',
        'user',
        'pass',
        'sqlserver',
        ['dbo'],
        ['table'],
        'Test%'
      ).subscribe(schema => {
        expect(schema).toEqual(mockSchema);
      });

      const req = httpMock.expectOne(`${apiUrl}/data-sources/introspect`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.server).toBe('localhost');
      expect(req.request.body.database).toBe('testdb');
      expect(req.request.body.type).toBe('sqlserver');
      req.flush(mockSchema);
    });

    it('should handle optional parameters', () => {
      service.introspectSchema(
        'localhost',
        undefined,
        'testdb',
        'user',
        'pass',
        'postgresql'
      ).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/data-sources/introspect`);
      expect(req.request.body.port).toBeUndefined();
      expect(req.request.body.includedSchemas).toBeUndefined();
      req.flush({ tables: [] });
    });
  });

  describe('createDataSource', () => {
    it('should create a new data source', () => {
      const payload = {
        name: 'Test DB',
        type: 'sqlserver',
        server: 'localhost',
        database: 'testdb',
        username: 'user',
        password: 'pass'
      };

      const mockDataSource: DataSourceInfo = {
        id: '1',
        ...payload
      };

      service.createDataSource(payload).subscribe(dataSource => {
        expect(dataSource).toEqual(mockDataSource);
      });

      const req = httpMock.expectOne(`${apiUrl}/data-sources`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.name).toBe('Test DB');
      req.flush(mockDataSource);
    });
  });

  describe('updateDataSource', () => {
    it('should update an existing data source', () => {
      const id = '1';
      const payload = {
        name: 'Updated DB',
        type: 'sqlserver',
        server: 'localhost',
        database: 'testdb',
        username: 'user',
        password: 'pass'
      };

      service.updateDataSource(id, payload).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/data-sources/1`);
      expect(req.request.method).toBe('PUT');
      req.flush({ id, ...payload });
    });
  });

  describe('deleteDataSource', () => {
    it('should delete a data source', () => {
      const id = '1';

      service.deleteDataSource(id).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/data-sources/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, message: 'Deleted' });
    });
  });

  describe('getDataSource', () => {
    it('should retrieve a specific data source', () => {
      const id = '1';
      const mockDataSource: DataSourceInfo = {
        id,
        name: 'Test DB',
        type: 'sqlserver',
        server: 'localhost',
        database: 'testdb',
        username: 'user',
        password: 'pass'
      };

      service.getDataSource(id).subscribe(dataSource => {
        expect(dataSource).toEqual(mockDataSource);
      });

      const req = httpMock.expectOne(`${apiUrl}/data-sources/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDataSource);
    });
  });

  describe('getReport', () => {
    it('should retrieve a specific report with cache-busting', () => {
      const id = '1';
      const mockReport: ReportDefinition = {
        id,
        name: 'Test Report',
        dataSource: {} as DataSourceInfo,
        selectedFields: [],
        filters: [],
        groupBy: [],
        sorting: [],
        layout: {},
        parameters: []
      };

      service.getReport(id).subscribe(report => {
        expect(report).toEqual(mockReport);
      });

      const req = httpMock.expectOne(request => {
        return request.url.startsWith(`${apiUrl}/reports/1`) && 
               request.url.includes('_=') &&
               request.headers.get('Cache-Control') === 'no-cache, no-store, must-revalidate';
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockReport);
    });
  });

  describe('exportToExcel', () => {
    it('should export report to Excel', () => {
      const mockReport: ReportDefinition = {
        id: '1',
        name: 'Test Report',
        dataSource: {} as DataSourceInfo,
        selectedFields: [],
        filters: [],
        groupBy: [],
        sorting: [],
        layout: {},
        parameters: []
      };

      const mockBlob = new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      service.exportToExcel(mockReport).subscribe(blob => {
        expect(blob).toBeInstanceOf(Blob);
      });

      const req = httpMock.expectOne(`${apiUrl}/reports/export/excel`);
      expect(req.request.method).toBe('POST');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });
  });
});
