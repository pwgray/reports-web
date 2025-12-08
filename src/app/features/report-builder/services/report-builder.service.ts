import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { ReportDefinition } from "../../../core/models/report.models";
import { environment } from "../../../../environments/environment";
import { DataSourceInfo } from "../../../core/models/data-source-info.model";
import { SchemaInfo } from "../../../core/models/schema-info.model";
import { PreviewResult } from "../../../core/models/preview-result.model";

// core/services/report-builder.service.ts
/**
 * Service for managing report definitions, data sources, and report operations.
 * Provides methods to create, read, update, and delete reports, as well as 
 * manage data sources and generate report previews.
 */
@Injectable({
  providedIn: 'root'
})
export class ReportBuilderService {

  /** Base API URL for report and data source endpoints */
  private readonly apiUrl = environment.apiUrl;
  
  /** BehaviorSubject to track the current report being built/edited */
  private currentReport$ = new BehaviorSubject<ReportDefinition | null>(null);

  /**
   * Creates an instance of ReportBuilderService.
   * @param http - Angular HttpClient for making HTTP requests
   */
  constructor(private http: HttpClient) {}
  /**
   * Retrieves all saved reports from the server.
   * @returns Observable that emits an array of ReportDefinition objects
   */
  getReports(): Observable<ReportDefinition[]> {
    return this.http.get<ReportDefinition[]>(`${this.apiUrl}/reports`);
  }

  /**
   * Gets an observable of the current report being built/edited.
   * Components can subscribe to this to react to report changes.
   * @returns Observable that emits the current ReportDefinition or null
   */
  getCurrentReport(): Observable<ReportDefinition | null> {
    return this.currentReport$.asObservable();
  }

  /**
   * Updates the current report being built/edited.
   * Notifies all subscribers of the currentReport$ observable.
   * @param report - The report definition to set as current
   */
  updateCurrentReport(report: ReportDefinition): void {
    this.currentReport$.next(report);
  }

  /**
   * Retrieves all available data sources from the server.
   * @returns Observable that emits an array of DataSourceInfo objects
   */
  getDataSources(): Observable<DataSourceInfo[]> {
    return this.http.get<DataSourceInfo[]>(`${this.apiUrl}/data-sources`);
  }

  /**
   * Generates a preview of the report data.
   * Executes the report query with the specified limit and returns preview results.
   * @param report - The report definition to preview
   * @param limit - Maximum number of rows to return (default: 1000000)
   * @returns Observable that emits a PreviewResult containing the preview data
   */
  previewReport(report: ReportDefinition, limit = 1000000): Observable<PreviewResult> {
    return this.http.post<PreviewResult>(`${this.apiUrl}/reports/preview`, {
      ...report,
      limit
    });
  }

  /**
   * Saves a report definition to the server.
   * If the report has an ID, it updates the existing report; otherwise, it creates a new one.
   * Transforms the ReportDefinition into the API format before sending.
   * @param report - The report definition to save
   * @returns Observable that emits the saved ReportDefinition
   */
  saveReport(report: ReportDefinition): Observable<ReportDefinition> {
    // Extract dataSourceId from dataSource object
    const dataSourceId = report.dataSource?.id;
    if (!dataSourceId) {
      throw new Error('Report must have a valid data source ID');
    }

    // Transform selectedFields to match FieldConfigurationDto structure
    // DTO expects: name, alias, type (all strings)
    const fields = report.selectedFields.map(field => {
      // Build fully qualified field name: schema.tableName.fieldName or tableName.fieldName
      const fieldName = field.schema 
        ? `${field.schema}.${field.tableName}.${field.fieldName}`
        : `${field.tableName}.${field.fieldName}`;
      
      return {
        name: fieldName,
        alias: field.displayName || field.fieldName,
        type: typeof field.dataType === 'string' ? field.dataType : String(field.dataType)
      };
    });

    // Extract unique schema-qualified table names from selectedFields
    const tableSet = new Set<string>();
    report.selectedFields.forEach(field => {
      const tableName = field.schema 
        ? `${field.schema}.${field.tableName}`
        : field.tableName;
      tableSet.add(tableName);
    });
    const tables = Array.from(tableSet);

    // Transform filters to match FilterConfigurationDto structure
    // DTO expects: field (string), operator (string), value (any)
    const filters = (report.filters || []).map(filter => {
      // Build fully qualified field name from filter.field
      const fieldName = filter.field.schema 
        ? `${filter.field.schema}.${filter.field.tableName}.${filter.field.fieldName}`
        : `${filter.field.tableName}.${filter.field.fieldName}`;
      
      return {
        field: fieldName,
        operator: typeof filter.operator === 'string' ? filter.operator : String(filter.operator),
        value: filter.value
      };
    });

    // Transform ReportDefinition to API Report structure matching CreateReportDto
    const apiReport = {
      id: report.id,
      name: report.name,
      description: report.description || '',
      dataSourceId: dataSourceId, // DTO expects dataSourceId as UUID string
      layoutConfig: report.layout || {},
      queryConfig: {
        fields: fields,
        tables: tables,
        filters: filters
      },
      parameters: report.parameters || []
    };

    if (report.id) {
      return this.http.put<ReportDefinition>(`${this.apiUrl}/reports/${report.id}`, apiReport);
    }
    return this.http.post<ReportDefinition>(`${this.apiUrl}/reports`, apiReport);
  }

  /**
   * Generates a formatted report file (HTML, PDF, or Excel).
   * @param reportId - The ID of the report to generate
   * @param parameters - Optional parameters to pass to the report
   * @param format - Output format: 'html', 'pdf', or 'excel'
   * @returns Observable that emits a Blob containing the generated report file
   */
  generateReport(reportId: string, parameters: any, format: 'html' | 'pdf' | 'excel'): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/reports/${reportId}/generate`, 
      { parameters, format }, 
      { responseType: 'blob' }
    );
  }

  /**
   * Deletes a report from the server.
   * @param reportId - The ID of the report to delete
   * @returns Observable that completes when the deletion is successful
   */
  deleteReport(reportId: string) {
    return this.http.delete(`${this.apiUrl}/reports/${reportId}`);
  }

  /**
   * Retrieves the schema information for a specific data source.
   * @param dataSourceId - The ID of the data source
   * @returns Observable that emits the SchemaInfo for the data source
   */
  getSchema(dataSourceId: string): Observable<SchemaInfo> {
    return this.http.get<SchemaInfo>(`${this.apiUrl}/data-sources/${dataSourceId}/schema`);
  }

  /**
   * Introspects a database schema by connecting to it directly.
   * Discovers tables, columns, relationships, and other schema metadata.
   * @param server - Database server hostname or IP address
   * @param port - Database server port number (optional, uses default if undefined)
   * @param database - Name of the database to introspect
   * @param username - Database username for authentication
   * @param password - Database password for authentication
   * @param type - Database type (e.g., 'sqlserver', 'postgresql', 'mysql', 'oracle')
   * @param includedSchemas - Optional list of schema names to include in discovery
   * @param includedObjectTypes - Optional list of object types to include (e.g., 'table', 'view')
   * @param objectNamePattern - Optional SQL LIKE pattern to filter objects by name
   * @returns Observable that emits the discovered SchemaInfo
   */
  introspectSchema(
    server: string, 
    port: number | undefined, 
    database: string, 
    username: string, 
    password: string, 
    type: string,
    includedSchemas?: string[],
    includedObjectTypes?: string[],
    objectNamePattern?: string
  ): Observable<SchemaInfo> {
    return this.http.post<SchemaInfo>(`${this.apiUrl}/data-sources/introspect`, { 
      server, 
      port, 
      database, 
      username,
      password, 
      type,
      includedSchemas,
      includedObjectTypes,
      objectNamePattern
    });
  }

  /**
   * Creates a new data source on the server.
   * @param payload - Data source configuration including connection details and schema
   * @returns Observable that emits the created DataSourceInfo
   */
  createDataSource(payload: { name: string; type: string; server: string; port?: number; database: string; username: string; password: string; schema?: SchemaInfo }): Observable<DataSourceInfo> {
    return this.http.post<DataSourceInfo>(`${this.apiUrl}/data-sources`, payload);
  }

  /**
   * Updates an existing data source on the server.
   * @param id - The ID of the data source to update
   * @param payload - Updated data source configuration
   * @returns Observable that emits the updated DataSourceInfo
   */
  updateDataSource(id: string, payload: { name: string; type: string; server: string; port?: number; database: string; username: string; password: string; schema?: SchemaInfo }): Observable<DataSourceInfo> {
    return this.http.put<DataSourceInfo>(`${this.apiUrl}/data-sources/${id}`, payload);
  }

  /**
   * Deletes a data source from the server.
   * @param id - The ID of the data source to delete
   * @returns Observable that emits a success response object
   */
  deleteDataSource(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/data-sources/${id}`);
  }

  /**
   * Retrieves a specific data source by ID.
   * @param id - The ID of the data source to retrieve
   * @returns Observable that emits the DataSourceInfo
   */
  getDataSource(id: string): Observable<DataSourceInfo> {
    return this.http.get<DataSourceInfo>(`${this.apiUrl}/data-sources/${id}`);
  }

  /**
   * Retrieves a specific report by ID.
   * Uses cache-busting query parameters to ensure fresh data is loaded.
   * @param id - The ID of the report to retrieve
   * @returns Observable that emits the ReportDefinition
   */
  getReport(id: string): Observable<ReportDefinition> {
    // Add cache-busting to ensure fresh data is always loaded
    const timestamp = new Date().getTime();
    return this.http.get<ReportDefinition>(`${this.apiUrl}/reports/${id}?_=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }

  /**
   * Exports a report to Excel format using server-side generation.
   * Optimized for large datasets (up to 1M rows) by processing on the server.
   * @param report - The report definition to export
   * @returns Observable that emits a Blob containing the Excel file
   */
  exportToExcel(report: ReportDefinition): Observable<Blob> {
    console.log('📤 Requesting server-side Excel export...');
    return this.http.post(`${this.apiUrl}/reports/export/excel`, report, {
      responseType: 'blob'
    });
  }
}