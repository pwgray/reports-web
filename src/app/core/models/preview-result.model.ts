/**
 * Represents the result of a query preview operation.
 * Contains a subset of data returned by a query along with metadata.
 */
export interface PreviewResult {
  /** Array of data rows returned by the query. Each row is represented as an object with column names as keys. */
  data: any[];
  
  /** Total number of records that match the query (may be greater than the length of data array if paginated) */
  totalCount: number;
  
  /** 
   * Additional dynamic properties that may be included in the preview result.
   * Allows for extensibility without modifying the interface.
   */
  [key: string]: any;
}