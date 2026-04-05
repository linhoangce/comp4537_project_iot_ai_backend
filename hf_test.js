import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";

// Load your .env file variables
dotenv.config();

const hfToken = process.env.HF_API_TOKEN;
const modelId = "meta-llama/Meta-Llama-3-8B-Instruct";

if (!hfToken) {
	console.error("❌ ERROR: HF_API_TOKEN not found in .env file.");
	process.exit(1);
}

const hf = new InferenceClient(hfToken, {
	headers: {
		"X-Wait-For-Model": "true",
	},
});

async function testConnection() {
	console.log(`Testing connection to Hugging Face...`);
	console.log(`Using Model: ${modelId}`);

	try {
		const response = await hf.chatCompletion({
			model: modelId,
			messages: [
				{ role: "user", content: "Say 'The connection is successful!' if you can hear me." },
			],
			max_tokens: 50,
		});

		const reply = response.choices[0].message.content;
		console.log("------------------------------------------");
		console.log("✅ SUCCESS! AI Response:");
		console.log(reply);
		console.log("------------------------------------------");
	} catch (error) {
		console.error("------------------------------------------");
		console.error("❌ CONNECTION FAILED");

		if (error.message.includes("401")) {
			console.error(
				"Reason: Invalid API Token (Unauthorized). Check your Fine-Grained token scopes.",
			);
		} else if (error.message.includes("503") || error.message.includes("loading")) {
			console.error(
				"Reason: Model is currently loading/starting up. Try running the script again in 20 seconds.",
			);
		} else if (error.message.includes("provider")) {
			console.error(
				"Reason: Provider error. This model might be temporarily offline on the free tier.",
			);
		} else {
			console.error(`Error Message: ${error.message}`);
		}
		console.error("------------------------------------------");
	}
}

testConnection();
