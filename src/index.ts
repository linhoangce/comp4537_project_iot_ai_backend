"use strict";

import express from "express";
import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";
import cors from "cors";

import { db_config, session_secret, secure } from "./utils/utils.js";
import DatabaseManager from "./lib/DatabaseManager.js";
import { UserService } from "./services/UserService.js";
import { AuthService } from "./services/AuthService.js";
import AuthController from "./controllers/AuthControllers.js";
import UserController from "./controllers/UserController.js";
import { CallController } from "./controllers/CallController.js";
import twilio from "twilio";
import { InferenceClient } from "@huggingface/inference";

const app = express();
app.set("trust proxy", 1); // Allow Express to trust Render's proxy

// Temporary in-memory database to store call transcripts
const activeCalls = new Map<string, { role: "user" | "assistant" | "system"; content: string }[]>();

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
const client = new InferenceClient(process.env.HF_API_TOKEN!);

const dbManager = new DatabaseManager(db_config);
const MySQLStore = MySQLStoreFactory(session as any);
const sessionStore = new MySQLStore({}, dbManager.getRawPool());
const MAX_AGE = 7 * 60 * 60 * 1000;
const PORT = 3000;

app.use(express.json());

app.use(
	cors({
		origin: (origin, callback) => {
			const allowedOrigins = [
				"https://comp4537-project-iot-ai.vercel.app",
				"http://localhost:3000",
			];

			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error("Not allowed by CORS"));
			}
		},
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
		exposedHeaders: ["Set-Cookie"],
	}),
);

app.use((req, res, next) => {
	console.log(`${req.method} ${req.path} from ${req.get("origin")}`);
	next();
});

app.use(
	session({
		secret: session_secret!,
		resave: false,
		saveUninitialized: false,
		proxy: true, // Add this to work with app.set("trust proxy", 1)
		store: sessionStore,
		cookie: {
			maxAge: MAX_AGE,
			httpOnly: true,
			secure: true,
			sameSite: "none",
		},
	}),
);

app.get("/health", (req, res) => {
	res.json({ status: "ok" });
});

// services
const userService = new UserService(dbManager);
const authService = new AuthService(userService);

// controllers
const authController = new AuthController(authService, userService);
const userController = new UserController(userService);
const callController = new CallController();

app.use("/auth", authController.router);
app.use("/api", userController.router);
app.use("/api", callController.router);

app.listen(PORT, () => {
	console.log("Running on port ", PORT);
});
