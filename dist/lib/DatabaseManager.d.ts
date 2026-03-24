import mysql from "mysql2/promise";
declare class DatabaseManager {
    private config;
    private pool;
    constructor(config: any);
    getPool(): mysql.Pool;
    getRawPool(): any;
    createDatabase(): Promise<mysql.QueryResult>;
    initializeTable(tableName: string, columns: string[], types: string[]): Promise<mysql.QueryResult>;
    insertData(tableName: string, columns: string[], values: string[]): Promise<mysql.QueryResult>;
    shutdown(): Promise<void>;
    validateTemplateString(templateStr: string, label: string): void;
}
export default DatabaseManager;
//# sourceMappingURL=DatabaseManager.d.ts.map