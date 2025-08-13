// core/models/data-source-info.model.ts
export interface DataSourceInfo {
  id: string;
  name: string;
  type: string;
  connectionString?: string;
}