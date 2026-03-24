import DatabaseManager from "../lib/DatabaseManager.js";

export class UserService {
	constructor(private db: DatabaseManager) {}

	async findUserByEmail(email: string) {
		const pool = this.db.getPool();

		const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);
		return (rows as any[])[0];
	}

	async createNewUser(userData: any[]) {
		return await this.db.insertData(
			"users",
			["name", "email", "password", "userType"],
			userData,
		);
	}
}
