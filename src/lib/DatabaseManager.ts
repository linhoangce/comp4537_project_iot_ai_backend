import mysql from "mysql2/promise";

class DatabaseManager {
	private pool: mysql.Pool;

	// using 'private' in the constructor auto creates 'this.config'
	constructor(private config: any) {
		// create a pool of connections for db
		this.pool = mysql.createPool(this.config);
	}

	getPool() {
		return this.pool;
	}

	getRawPool() {
		// Returns the underlying callback-based pool that middleware libraries expect
		return (this.pool as any).pool;
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
		} catch (error: any) {
			console.error(`Error creating database: ${error.message}`);
			throw error;
		}
	}

	async initializeTable(tableName: string, columns: string[], types: string[]) {
		// ensure tableName, columns, types have only alphanumeric and underscores
		this.validateTemplateString(tableName, "table name");

		for (var i = 0; i < columns.length; i++) {
			this.validateTemplateString(columns[i]!, "column name");
			this.validateTemplateString(types[i]!, "type");
		}

		try {
			const [rows] = await this.pool.execute(`
          CREATE TABLE IF NOT EXISTS ${tableName} (
            ${columns.map((col, i) => `${col} ${types[i]}`).join(",")}
          ) ENGINE=innoDB;
        `);

			return rows;
		} catch (error: any) {
			console.error(`Error creating table: ${error.message}`);
			throw error;
		}
	}

	async insertData(tableName: string, columns: string[], values: string[]) {
		this.validateTemplateString(tableName, "table name");
		for (var i = 0; i < columns.length; i++) {
			this.validateTemplateString(columns[i]!, "column name");
		}

		try {
			const [rows] = await this.pool.execute(
				`
          INSERT INTO \`${tableName}\` 
          (${columns.map((c) => `\`${c}\``).join(",")}) 
          VALUES (${values.map(() => "?").join(",")});
        `,
				values,
			);

			return rows;
		} catch (error: any) {
			console.error(`Error inserting into ${tableName}: ${error.message}`);
			throw error;
		}
	}

	async shutdown() {
		await this.pool.end();
	}

	validateTemplateString(templateStr: string, label: string) {
		if (!/^[a-zA-Z0-9_]+$/.test(templateStr)) {
			throw new Error(`Invalid ${label}: ${templateStr}`);
		}
	}
}

export default DatabaseManager;
