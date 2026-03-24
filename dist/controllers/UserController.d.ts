import { type RequestHandler } from "express";
import type { UserService } from "../services/UserService.js";
declare class UserController {
    private userService;
    router: import("express-serve-static-core").Router;
    constructor(userService: UserService);
    private setupRoutes;
    home: RequestHandler;
    user: RequestHandler;
    admin: RequestHandler;
    getProfile: RequestHandler;
}
export default UserController;
//# sourceMappingURL=UserController.d.ts.map