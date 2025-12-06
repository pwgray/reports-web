/**
 * Represents complete schema information for a database, including tables,
 * columns, relationships, and metadata. This model describes the structure
 * and relationships of database objects that can be used in report building.
 */
export interface SchemaInfo {
  /** 
   * Array of table definitions, including base tables and views.
   * Each table contains column definitions and metadata.
   */
  tables: Array<{
    /** Name of the table or view */
    name: string;
    
    /** Database schema name containing this table (e.g., 'dbo', 'public', 'sales') */
    schema?: string;
    
    /** Object type (e.g., 'base_table', 'view', 'materialized_view') */
    type?: string;
    
    /** Human-readable display name for the table */
    displayName?: string;
    
    /** Description or documentation for the table */
    description?: string;
    
    /** Category or grouping for organizing tables in the UI */
    category?: string;
    
    /** Array of column definitions for this table */
    columns: Array<{
      /** Name of the column */
      name: string;
      
      /** Human-readable display name for the column */
      displayName?: string;
      
      /** Database-specific data type (e.g., 'varchar(50)', 'int', 'timestamp') */
      dataType: string;
      
      /** Normalized data type across different database systems (e.g., 'string', 'number', 'date') */
      normalizedType?: string;
      
      /** Whether this column is part of the primary key */
      isPrimaryKey?: boolean;
      
      /** Whether this column is a foreign key */
      isForeignKey?: boolean;
      
      /** Foreign key reference information (only present if isForeignKey is true) */
      foreignKeyReference?: {
        /** Name of the table referenced by this foreign key */
        referencedTable: string;
        
        /** Name of the column in the referenced table */
        referencedColumn: string;
        
        /** Name of the foreign key constraint */
        constraintName: string;
      };
    }>;
  }>;
  
  /** 
   * Array of relationship definitions between tables.
   * Relationships define how tables are related to each other for join operations.
   */
  relationships?: Array<{
    /** Unique identifier for the relationship */
    id: string;
    
    /** Name of the relationship */
    name: string;
    
    /** Name of the parent table (typically the table with the primary key) */
    parentTable: string;
    
    /** Name of the child table (typically the table with the foreign key) */
    childTable: string;
    
    /** Array of column mappings defining which columns link the tables */
    columnMappings: Array<{
      /** Column name in the parent table */
      parentColumn: string;
      
      /** Column name in the child table */
      childColumn: string;
    }>;
    
    /** Type of relationship (e.g., 'one-to-many', 'many-to-one', 'many-to-many') */
    type: string;
    
    /** Cardinality of the relationship (e.g., '1:1', '1:N', 'N:M') */
    cardinality: string;
    
    /** Human-readable display name for the relationship */
    displayName?: string;
    
    /** Description or documentation for the relationship */
    description?: string;
  }>;
}
