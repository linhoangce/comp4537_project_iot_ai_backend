import { Router } from "express";
import type { RequestHandler } from "express";
import twilio from "twilio";
import { InferenceClient } from "@huggingface/inference";
import { dbManager } from "../utils/utils.js";
import { CallService } from "../services/CallService.js";

export class CallController {
	private MODEL = "meta-llama/Meta-Llama-3-8B-Instruct";
	private MAX_TOKENS = 100;
	public router = Router();
	private twilioClient;
	private hfClient;
	private callService;

	constructor() {
		this.callService = new CallService(dbManager);
		this.twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
		this.hfClient = new InferenceClient(process.env.HF_API_TOKEN!);

		this.router.post("/make-call", this.makeCall);
		this.router.post("/twilio/voice", this.handleVoice);
		this.router.post("/twilio/gather", this.handleGather);
		this.router.get("/transcript/:sid", this.getTranscripts);
		this.router.get("/twilio/voice", this.handleVoice);
	}

	makeCall: RequestHandler = async (req, res) => {
		const { phoneNumber } = req.body;
		const userId = (req.session as any).userId;

		if (!userId) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		const callCount = await this.callService.getUserDailyCallCount(userId);
		if (callCount >= 2) {
			return res
				.status(403)
				.json({ error: "Daily call limit reached. Please try again tomorrow." });
		}

		try {
			const call = await this.twilioClient.calls.create({
				url: "https://comp4537-project-iot-ai-backend.onrender.com/api/twilio/voice",
				to: phoneNumber,
				from: process.env.TWILIO_PHONE_NUMBER!,
			});

			const systemPrompt =
				"You are a helpful front desk AI assistant. Keep your answers brief, polite and conversational since they are being spoken over the phone.";

			await this.callService.createCallSession(call.sid, userId, systemPrompt);
			await this.callService.incrementUserCallCount(userId);

			res.json({
				success: true,
				callSid: call.sid,
			});
		} catch (error: any) {
			console.log("Twilio Error: ", error.message);
			res.status(500).json({ error: error.message });
		}
	};

	handleVoice: RequestHandler = (req, res) => {
		const response = new twilio.twiml.VoiceResponse();

		response.pause({ length: 3 }); // Pause for 3 seconds to allow the call to connect

		response.say(
			"Hello! This is Linh's app front desk assistant. I can answer 5 questions. How can I help you today?",
		);

		response.gather({
			input: ["speech"],
			action: "/api/twilio/gather",
			speechTimeout: "auto",
		});

		res.type("text/xml").send(response.toString());
	};

	handleGather: RequestHandler = async (req, res) => {
		const { CallSid, SpeechResult } = req.body;
		const response = new twilio.twiml.VoiceResponse();

		const session = await this.callService.getCallSession(CallSid);
		if (!session) {
			return res.status(404).json({ error: "Call session not found" });
		}

		if (!SpeechResult) {
			response.say("I didn't quite catch that. Could you please repeat?");
			response.gather({
				input: ["speech"],
				action: "/api/twilio/gather",
			});
			return res.type("text/xml").send(response.toString());
		}

		// Increment question count
		session.turnCount += 1;
		session.history.push({
			role: "user",
			content: SpeechResult,
		});

		// Limit to 5 questions
		if (session.turnCount >= 5) {
			response.say(
				"You have reached the limit of 5 questions for this call. Thank you for calling. Goodbye!",
			);
			response.hangup();
			await this.callService.updateCallSession(CallSid, session.history, session.turnCount); // clean up memory

			return res.type("text/xml").send(response.toString());
		}

		try {
			const hfResponse: any = await this.hfClient.chatCompletion({
				model: this.MODEL,
				messages: session.history,
				max_tokens: this.MAX_TOKENS,
			});

			// catch loading error from HF model if any
			if (!hfResponse || !hfResponse.choices || hfResponse.choices.length === 0) {
				throw new Error("No response choices returned from Hugging Face");
			}

			const aiReply =
				hfResponse?.choices?.[0]?.message?.content || "Sorry, I couldn't come up with a response.";

			// If the AI naturally ends the convo, says goodbye
			if (
				aiReply.toLowerCase().includes("goodbye") ||
				aiReply.toLowerCase().includes("have a nice day")
			) {
				response.say(aiReply);
				response.hangup();
			} else {
				response.say(aiReply);
				response.gather({
					input: ["speech"],
					action: "/api/twilio/gather",
				});
			}

			session.history.push({
				role: "assistant",
				content: aiReply,
			});

			this.callService.updateCallSession(CallSid, session.history, session.turnCount);
		} catch (error: any) {
			console.error("HF Error: ", error.message);
			response.say(
				"Sorry, I'm having trouble connecting to my brain right now. Please try again later.",
			);
		}

		res.type("text/xml").send(response.toString());
	};

	getTranscripts: RequestHandler = async (req, res) => {
		const session = await this.callService.getCallSession(req.params.sid as string || "");
		session 
		? res.json({ history: session.history }) 
		: res.status(404).json({ error: "Not found!" });
	};
}
