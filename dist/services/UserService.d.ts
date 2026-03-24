import DatabaseManager from "../lib/DatabaseManager.js";
export declare class UserService {
    private db;
    constructor(db: DatabaseManager);
    findUserByEmail(email: string): Promise<any>;
    createNewUser(userData: any[]): Promise<import("mysql2").QueryResult>;
}
//# sourceMappingURL=UserService.d.ts.map