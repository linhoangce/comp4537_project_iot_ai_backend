import DatabaseManager from "../lib/DatabaseManager.js";

export class CallService {
	constructor(private db: DatabaseManager) {}

	/**
	 * Retrieves the current daily call count for a specific user.
	 */
	async getUserDailyCallCount(userId: number): Promise<number> {
		const today = new Date().toISOString().slice(0, 10);

		try {
			const results = await this.db.selectData("user_calls", ["call_count"], {
				user_id: userId,
				call_date: today,
			});

			// If a row exists, return the count. Otherwise, return 0.
			return results.length > 0 ? results[0].call_count : 0;
		} catch (error: any) {
			console.error("Error getting user daily call count:", error.message);
			throw error;
		}
	}

	/**
	 * Safely increments the user's call count or creates today's record if missing.
	 */
	async incrementUserCallCount(userId: number): Promise<void> {
		const today = new Date().toISOString().slice(0, 10);

		try {
			// Check if a record exists for today
			const results = await this.db.selectData("user_calls", ["id"], {
				user_id: userId,
				call_date: today,
			});

			if (results.length === 0) {
				// No record for today, create one with count = 1
				await this.db.insertData(
					"user_calls",
					["user_id", "call_date", "call_count"],
					[userId, today, 1],
				);
			} else {
				// record exists, increment the count
				await this.db.incrementData(
					"user_calls",
					"call_count",
					{ user_id: userId, call_date: today },
					1,
				);
			}
		} catch (error: any) {
			console.error("Error incrementing user call count:", error.message);
			throw error;
		}
	}

	/**
	 * Initializes a new call session in the database.
	 */
	async createCallSession(callSid: string, userId: number, systemPrompt: string): Promise<void> {
		const initialHistory = [{ role: "system", content: systemPrompt }];

		try {
			await this.db.insertData(
				"call_sessions",
				["call_sid", "user_id", "history", "turn_count"],
				[callSid, userId, JSON.stringify(initialHistory), 0],
			);
		} catch (error) {
			console.error("Error creating call session:", error);
			throw error;
		}
	}

	/**
	 * Retrievs an active call session.
	 */
	async getCallSession(callSid: string): Promise<{ history: any[]; turnCount: number } | null> {
		try {
			const results = await this.db.selectData("call_sessions", ["history", "turn_count"], {
				call_sid: callSid,
			});

			if (results.length === 0) return null;

			return {
				// MySQL sometimes returns the JSON field as a parsed object or as a string depending on driver settings
				history:
					typeof results[0].history === "string"
						? JSON.parse(results[0].history)
						: results[0].history,
				turnCount: results[0].turn_count,
			};
		} catch (error) {
			console.error("Error fetching call session:", error);
			throw error;
		}
	}

	/**
	 * Updates the call session history and turn count.
	 */
	async updateCallSession(callSid: string, history: any[], turnCount: number): Promise<void> {
		this.db.validateTemplateString("call_sessions", "table name");

		try {
			const sql = `
      UPDATE \`call_sessions\` 
      SET \`history\` = ?, \`turn_count\` = ? 
      WHERE \`call_sid\` = ?
    `;

			// We drop down to the pool directly here to handle complex JSON updates easily
			await this.db.getPool().execute(sql, [JSON.stringify(history), turnCount, callSid]);
		} catch (error) {
			console.error("Error updating call session:", error);
			throw error;
		}
	}

	/**
	 * Retrieves a summary of all users and their call activity for the admin.
	 */
	async getAllUserUsage(): Promise<any[]> {
		try {
			// Joins users table and user_calls table to get names and totals
			const sql = `
				SELECT
					u.id,
					u.name,
					u.email,
					SUM(uc.call_count) as total_calls,
					MAX(uc.call_date) as last_call_date
				FROM users u
				LEFT JOIN user_calls uc ON u.id = uc.user_id
				GROUP BY u.id
			`;
			const [rows] = await this.db.getPool().execute(sql);
			return rows as any[];
		} catch (error: any) {
			console.error("Error fetching user usage summary:", error.message);
			throw error;
		}
	}
}


