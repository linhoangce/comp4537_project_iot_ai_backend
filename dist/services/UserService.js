import DatabaseManager from "../lib/DatabaseManager.js";
export class UserService {
    db;
    constructor(db) {
        this.db = db;
    }
    async findUserByEmail(email) {
        const pool = this.db.getPool();
        const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);
        return rows[0];
    }
    async createNewUser(userData) {
        return await this.db.insertData("users", ["name", "email", "password", "userType"], userData);
    }
}
//# sourceMappingURL=UserService.js.map