import express, {} from "express";
import { validateSession, validateAdmin, validateUser } from "../middleware/validate.js";
class UserController {
    userService;
    router = express.Router();
    constructor(userService) {
        this.userService = userService;
        this.setupRoutes();
    }
    setupRoutes() {
        this.router.use(validateSession);
        this.router.get("/", this.home);
        this.router.get("/user", validateUser, this.user);
        this.router.get("/admin", validateAdmin, this.admin);
        this.router.get("/profile", this.getProfile);
    }
    home = (req, res) => {
        res.json({ message: "WELCOME" });
    };
    user = (req, res) => {
        res.json({ user: "User Dashboard" });
    };
    admin = (req, res) => {
        res.json({ admin: "Admin Dashboard" });
    };
    getProfile = async (req, res) => {
        try {
            const user = await this.userService.findUserByEmail(req.session.email);
            res.json(user);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
}
export default UserController;
//# sourceMappingURL=UserController.js.map