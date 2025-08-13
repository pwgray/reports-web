export interface SchemaInfo {
  // Define the properties of SchemaInfo as needed
  tables: Array<{
    name: string;
    columns: Array<{
      name: string;
      type: string;
    }>;
  }>;
}