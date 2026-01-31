declare module 'sql.js' {
  export type SqlValue = number | string | Uint8Array | null;

  export interface QueryExecResult {
    columns: string[];
    values: SqlValue[][];
  }

  export interface Statement {
    bind(params?: SqlValue[]): boolean;
    step(): boolean;
    getAsObject(params?: Record<string, SqlValue>): Record<string, SqlValue>;
    get(params?: SqlValue[]): SqlValue[];
    run(params?: SqlValue[]): void;
    reset(): void;
    free(): boolean;
  }

  export interface Database {
    run(sql: string, params?: SqlValue[]): Database;
    exec(sql: string, params?: SqlValue[]): QueryExecResult[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
    getRowsModified(): number;
  }

  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
  }

  export interface InitSqlJsOptions {
    locateFile?: (file: string) => string;
  }

  export default function initSqlJs(options?: InitSqlJsOptions): Promise<SqlJsStatic>;
}
