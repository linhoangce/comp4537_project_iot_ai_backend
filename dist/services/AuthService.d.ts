import type { UserService } from "./UserService.js";
export declare class AuthService {
    private userService;
    constructor(userService: UserService);
    signup(userData: [string, string, string]): Promise<import("mysql2").QueryResult>;
    login(email: string, password: string): Promise<any>;
}
//# sourceMappingURL=AuthService.d.ts.map