// core/models/data-source-info.model.ts
import { SchemaInfo } from './schema-info.model';

export interface DataSourceInfo {
  id?: string;
  name: string;
  type: string;
  server: string;
  port?: number;
  database: string;
  username: string;
  password: string;
  schema?: SchemaInfo;
  
  // Schema filtering configuration
  includedSchemas?: string[]; // Which schemas to include (e.g., ['dbo', 'custom'])
  includedObjectTypes?: string[]; // Which object types to include (e.g., ['table', 'view'])
  objectNamePattern?: string; // Pattern for filtering objects by name (e.g., 'Customer%')
}