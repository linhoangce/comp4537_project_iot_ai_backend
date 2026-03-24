import mysql from "mysql2/promise";
class DatabaseManager {
    config;
    pool;
    // using 'private' in the constructor auto creates 'this.config'
    constructor(config) {
        this.config = config;
        // create a pool of connections for db
        this.pool = mysql.createPool(this.config);
    }
    getPool() {
        return this.pool;
    }
    getRawPool() {
        // Returns the underlying callback-based pool that middleware libraries expect
        return this.pool.pool;
    }
    async createDatabase() {
        // Security Fix: SQL parameters do not work for Identifiers (DB/Table names)
        // must manually ensure database name is safe
        const dbName = this.config.database;
        // ensure database name has only alphanumeric and underscores
        this.validateTemplateString(dbName, "database name");
        try {
            // backticks for escaping identifier in SQL string
            const [rows] = await this.pool.execute(`
        CREATE DATABASE IF NOT EXISTS \`${dbName}\`
        CHARACTER SET utf8mb4 
        COLLATE utf8mb4_unicode_ci;
      `);
            return rows;
        }
        catch (error) {
            console.error(`Error creating database: ${error.message}`);
            throw error;
        }
    }
    async initializeTable(tableName, columns, types) {
        // ensure tableName, columns, types have only alphanumeric and underscores
        this.validateTemplateString(tableName, "table name");
        for (var i = 0; i < columns.length; i++) {
            this.validateTemplateString(columns[i], "column name");
            this.validateTemplateString(types[i], "type");
        }
        try {
            const [rows] = await this.pool.execute(`
          CREATE TABLE IF NOT EXISTS ${tableName} (
            ${columns.map((col, i) => `${col} ${types[i]}`).join(",")}
          ) ENGINE=innoDB;
        `);
            return rows;
        }
        catch (error) {
            console.error(`Error creating table: ${error.message}`);
            throw error;
        }
    }
    async insertData(tableName, columns, values) {
        this.validateTemplateString(tableName, "table name");
        for (var i = 0; i < columns.length; i++) {
            this.validateTemplateString(columns[i], "column name");
        }
        try {
            const [rows] = await this.pool.execute(`
          INSERT INTO \`${tableName}\` 
          (${columns.map((c) => `\`${c}\``).join(",")}) 
          VALUES (${values.map(() => "?").join(",")});
        `, values);
            return rows;
        }
        catch (error) {
            console.error(`Error inserting into ${tableName}: ${error.message}`);
            throw error;
        }
    }
    async shutdown() {
        await this.pool.end();
    }
    validateTemplateString(templateStr, label) {
        if (!/^[a-zA-Z0-9_]+$/.test(templateStr)) {
            throw new Error(`Invalid ${label}: ${templateStr}`);
        }
    }
}
export default DatabaseManager;
//# sourceMappingURL=DatabaseManager.js.map