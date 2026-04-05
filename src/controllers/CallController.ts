import { Router } from "express";
import type { RequestHandler } from "express";
import twilio from "twilio";
import { InferenceClient } from "@huggingface/inference";

export class CallController {
	public router = Router();
	private twilioClient;
	private hfClient;
	// In-memory store for transcripts
	// TODO: Use Database instead of in-memory store for production
	private activeCalls = new Map<
		string,
		{ role: "user" | "assistant" | "system"; content: string }[]
	>();

	constructor() {
		this.twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
		this.hfClient = new InferenceClient(process.env.HF_API_TOKEN!);

		this.router.post("/make-call", this.makeCall);
		this.router.post("/twilio/voice", this.handleVoice);
		this.router.post("/twilio/gather", this.handleGather);
		this.router.post("/transcripts/:sid", this.getTranscripts);
	}

	makeCall: RequestHandler = async (req, res) => {
		const { phoneNumber } = req.body;

		try {
			const call = await this.twilioClient.calls.create({
				url: "https://comp4537-project-iot-ai-backend.onrender.com/api/twilio/voice",
				to: phoneNumber,
				from: process.env.TWILIO_PHONE_NUMBER!,
			});

			this.activeCalls.set(call.sid, [
				{
					role: "system",
					content:
						"You are a helpful front desk AI assistant. Keep your answers brief, polite and conversational since they are being spoken over the phone.",
				},
			]);

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
		response.say("Hello! This is Linh's app front desk assistant. How can I help you today?");

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

		if (!SpeechResult) {
			response.say("I didn't quite catch that. Could you please repeat?");
			response.gather({
				input: ["speech"],
				action: "/api/twilio/gather",
			});
			return res.type("text/xml").send(response.toString());
		}

		const history = this.activeCalls.get(CallSid) || [];
		history.push({
			role: "user",
			content: SpeechResult,
		});

		try {
			const hfResponse: any = await this.hfClient.chatCompletion({
				model: "microsoft/Phi-3.5-mini-instruct",
				messages: history,
				max_tokens: 100,
			});

			// catch loading error from HF model if any
			if (!hfResponse || !hfResponse.choices || hfResponse.choices.length === 0) {
				throw new Error("No response choices returned from Hugging Face");
			}

			const aiReply =
				hfResponse?.choices?.[0]?.message?.content || "Sorry, I couldn't come up with a response.";

      response.say(aiReply);
      response.gather({
        input: ["speech"],
        action: "/api/twilio/gather",
      });

			history.push({
				role: "assistant",
				content: aiReply,
			});
			this.activeCalls.set(CallSid, history);
		} catch (error: any) {
			console.error("HF Error: ", error.message);
			response.say(
				"Sorry, I'm having trouble connecting to my brain right now. Please try again later.",
			);
		}

		res.type("text/xml").send(response.toString());
	};

	getTranscripts: RequestHandler = (req, res) => {
		const history = this.activeCalls.get(req.params.sid?.toString() || "") || [];
		history ? res.json({ history }) : res.status(404).json({ error: "Not found!" });
	};
}
