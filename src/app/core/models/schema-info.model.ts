export interface SchemaInfo {
  // Define the properties of SchemaInfo as needed
  tables: Array<{
    name: string;
    displayName?: string;
    description?: string;
    category?: string;
    columns: Array<{
      name: string;
      displayName?: string;
      dataType: string;
      normalizedType?: string;
      isPrimaryKey?: boolean;
      isForeignKey?: boolean;
      foreignKeyReference?: {
        referencedTable: string;
        referencedColumn: string;
        constraintName: string;
      };
    }>;
  }>;
  relationships?: Array<{
    id: string;
    name: string;
    parentTable: string;
    childTable: string;
    columnMappings: Array<{
      parentColumn: string;
      childColumn: string;
    }>;
    type: string;
    cardinality: string;
    displayName?: string;
    description?: string;
  }>;
}