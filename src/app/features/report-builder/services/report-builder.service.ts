import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { ReportDefinition } from "../../../core/models/report.models";
import { environment } from "../../../../environments/environment";
import { DataSourceInfo } from "../../../core/models/data-source-info.model";
import { SchemaInfo } from "../../../core/models/schema-info.model";
import { PreviewResult } from "../../../core/models/preview-result.model";

// core/services/report-builder.service.ts
@Injectable({
  providedIn: 'root'
})
export class ReportBuilderService {

  private readonly apiUrl = environment.apiUrl;
  private currentReport$ = new BehaviorSubject<ReportDefinition | null>(null);

  constructor(private http: HttpClient) {}
  getReports(): Observable<ReportDefinition[]> {
    return this.http.get<ReportDefinition[]>(`${this.apiUrl}/reports`);
  }


  getCurrentReport(): Observable<ReportDefinition | null> {
    return this.currentReport$.asObservable();
  }

  updateCurrentReport(report: ReportDefinition): void {
    this.currentReport$.next(report);
  }

  getDataSources(): Observable<DataSourceInfo[]> {
    return this.http.get<DataSourceInfo[]>(`${this.apiUrl}/data-sources`);
  }

  getSchema(dataSourceId: string): Observable<SchemaInfo> {
    return this.http.get<SchemaInfo>(`${this.apiUrl}/data-sources/${dataSourceId}/schema`);
  }

  getReport(id: string): Observable<ReportDefinition> {
    return this.http.get<ReportDefinition>(`${this.apiUrl}/reports/${id}`);
  }

  previewReport(report: ReportDefinition, limit = 100): Observable<PreviewResult> {
    return this.http.post<PreviewResult>(`${this.apiUrl}/reports/preview`, {
      ...report,
      limit
    });
  }

  saveReport(report: ReportDefinition): Observable<ReportDefinition> {
    // Transform ReportDefinition to API Report structure
    const apiReport = {
      id: report.id,
      name: report.name,
      description: report.description,
      dataSource: report.dataSource,
      selectedFields: report.selectedFields,
      // Map layout to layoutConfig for API
      layoutConfig: report.layout,
      // Map other fields to queryConfig
      queryConfig: {
        fields: report.selectedFields,
        filters: report.filters,
        groupBy: report.groupBy,
        orderBy: report.sorting
      },
      parameters: report.parameters || []
    };

    if (report.id) {
      return this.http.put<ReportDefinition>(`${this.apiUrl}/reports/${report.id}`, apiReport);
    }
    return this.http.post<ReportDefinition>(`${this.apiUrl}/reports`, apiReport);
  }

  generateReport(reportId: string, parameters: any, format: 'html' | 'pdf' | 'excel'): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/reports/${reportId}/generate`, 
      { parameters, format }, 
      { responseType: 'blob' }
    );
  }

  deleteReport(reportId: string) {
    return this.http.delete(`${this.apiUrl}/reports/${reportId}`);
  }
}