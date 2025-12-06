// core/models/data-source-info.model.ts
import { SchemaInfo } from './schema-info.model';

/**
 * Represents configuration information for a database data source connection.
 * Contains connection details and schema filtering options.
 */
export interface DataSourceInfo {
  /** Unique identifier for the data source (optional, typically assigned by the system) */
  id?: string;
  
  /** Display name for the data source */
  name: string;
  
  /** Database type (e.g., 'sqlserver', 'postgresql', 'mysql', 'oracle') */
  type: string;
  
  /** Database server hostname or IP address */
  server: string;
  
  /** Database server port number (optional, uses default if not specified) */
  port?: number;
  
  /** Name of the database to connect to */
  database: string;
  
  /** Username for database authentication */
  username: string;
  
  /** Password for database authentication */
  password: string;
  
  /** Cached schema information retrieved from the database (optional) */
  schema?: SchemaInfo;
  
  /** Schema filtering configuration */
  
  /** 
   * List of database schema names to include when discovering objects.
   * If not specified, all schemas are included.
   * @example ['dbo', 'custom', 'staging']
   */
  includedSchemas?: string[];
  
  /** 
   * List of object types to include when discovering database objects.
   * Common values: 'table', 'view', 'function', 'procedure'
   * If not specified, all object types are included.
   * @example ['table', 'view']
   */
  includedObjectTypes?: string[];
  
  /** 
   * SQL LIKE pattern for filtering objects by name.
   * Supports wildcards: % (any sequence) and _ (single character)
   * @example 'Customer%' matches all objects starting with 'Customer'
   */
  objectNamePattern?: string;
}