import express, { type RequestHandler } from "express";
import { validateSession, validateAdmin, validateUser } from "../middleware/validate.js";
import type { UserService } from "../services/UserService.js";

class UserController {
	public router = express.Router();

	constructor(private userService: UserService) {
		this.setupRoutes();
	}

	private setupRoutes() {
		this.router.use(validateSession);
		this.router.get("/", this.home);
		this.router.get("/user", validateUser, this.user);
		this.router.get("/admin", validateAdmin, this.admin);
		this.router.get("/profile", this.getProfile);
	}

	home: RequestHandler = (req, res) => {
		res.json({ message: "WELCOME" });
	};

	user: RequestHandler = (req, res) => {
		res.json({ user: "User Dashboard" });
	};

	admin: RequestHandler = (req, res) => {
		res.json({ admin: "Admin Dashboard" });
	};

	getProfile: RequestHandler = async (req, res) => {
		try {
			const user = await this.userService.findUserByEmail(req.session.email!);
			res.json(user);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	};
}

export default UserController;
