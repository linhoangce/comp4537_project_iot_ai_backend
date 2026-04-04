import express from "express";
import type { RequestHandler } from "express";
import type { AuthService } from "../services/AuthService.js";
import Joi from "joi";
import { UserService } from "../services/UserService.js";

class AuthController {
	public router = express.Router();

	constructor(
		private authService: AuthService,
		private userService: UserService,
	) {
		this.router.post("/signup", this.signup);
		this.router.post("/login", this.login);
		this.router.post("/logout", this.logout);
		this.router.get("/me", this.getMe);

		this.router.get("/me", (req, res) => {
			if (req.session.authenticated) {
				res.json({
					authenticated: true,
					userType: req.session.userType,
				});
			} else {
				res.status(401).json({ authenticated: false });
			}
		});
	}

	getMe: RequestHandler = (req, res) => {
		if (req.session && req.session.authenticated) {
			return res.json({
				authenticated: true,
				userType: req.session.userType,
			});
		}
		res.status(401).json({ authenticated: false });
	};

	signup: RequestHandler = async (req, res) => {
		try {
			const { fullname, email, password } = req.body;
			if (!email) {
				return res.status(400).json({ error: "Email is required" });
			}
			if (!password) {
				return res.status(400).json({ error: "Password is required" });
			}

			// validation
			const schema = Joi.object({
				email: Joi.string().email().max(50).required(),
				password: Joi.string().max(50).required(),
			});

			const { error } = schema.validate({ email, password });
			if (error) {
				return res.status(400).json({ error: "Invalid Email or Password" });
			}

			try {
				const existingUser = await this.userService.findUserByEmail(email);
				if (existingUser) {
					return res.status(400).json({ error: "User exists" });
				}

				await this.authService.signup([fullname, email, password]);
				res.status(201).json({ message: "User created" });
			} catch (error: any) {
				console.error(error.message);
				res.status(500).json({ error: "Error fetching user" });
			}
		} catch (error: any) {
			console.error("Error creating user: ", error.message);
			res.status(400).json({ error: error.message });
		}
	};

	login: RequestHandler = async (req, res) => {
		try {
			const { email, password } = req.body;
			const user = await this.authService.login(email, password);

			if (!user) {
				return res.status(404).json({ error: "Invalid credentials" });
			}

			// 1. Set data
			req.session.authenticated = true;
			req.session.email = user.email;
			req.session.userType = user.userType;

			// 2. FORCE SAVE before responding
			req.session.save((err) => {
				if (err) {
					return res.status(500).json({ error: "Session save failed" });
				}
				// 3. Only respond once the DB write is confirmed
				res.json({
					message: "Logged in",
					userType: user.userType,
				});
			});
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	};

	logout: RequestHandler = async (req, res) => {
		req.session.destroy((error) => {
			if (error) {
				return res.status(500).json({ error: "Unable to log out" });
			}

			res.clearCookie("connect.sid");
			res.json({ message: "Logged out" });
		});
	};
}

export default AuthController;
