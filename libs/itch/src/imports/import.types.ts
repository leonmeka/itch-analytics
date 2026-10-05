export interface ParsedImport<Row> {
  rows: Row[];
  malformed: number;
}

export interface ImportSummary {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
}
