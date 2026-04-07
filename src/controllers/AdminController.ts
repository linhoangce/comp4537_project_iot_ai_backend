import express, { Router } from "express";
import type { RequestHandler } from "express";
import { CallService } from "../services/CallService.js";

export class AdminController {
	public router = Router();

	constructor(private callService: CallService) {
		// Apply admin check too all routes in this controller
		this.router.use(this.adminGuard);
		this.router.get("/usage", this.getUsageStats);
	}

	private adminGuard: RequestHandler = (req, res, next) => {
		if (req.session.authenticated && req.session.userType === "admin") {
			next();
		} else {
			res.status(403).json({ error: "Access Denied. Admin only." });
		}
	};

	private getUsageStats: RequestHandler = async (req, res) => {
		try {
			const stats = await this.callService.getAllUserUsage();
			if (!stats) {
				return res.status(404).json({ error: "No usage data found." });
			}
			res.json(stats);
		} catch (error: any) {
			res.status(500).json({ error: "Failed to retrieve usage stats. Error: " + error.message });
		}
	};
}
