// core/models/data-source-info.model.ts
import { SchemaInfo } from './schema-info.model';

export interface DataSourceInfo {
  id?: string;
  name: string;
  type: string;
  connectionString?: string;
  schema?: SchemaInfo;
}