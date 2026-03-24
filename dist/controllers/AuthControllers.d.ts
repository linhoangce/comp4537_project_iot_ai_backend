import type { RequestHandler } from "express";
import type { AuthService } from "../services/AuthService.js";
import { UserService } from "../services/UserService.js";
declare class AuthController {
    private authService;
    private userService;
    router: import("express-serve-static-core").Router;
    constructor(authService: AuthService, userService: UserService);
    signup: RequestHandler;
    login: RequestHandler;
    logout: RequestHandler;
}
export default AuthController;
//# sourceMappingURL=AuthControllers.d.ts.map