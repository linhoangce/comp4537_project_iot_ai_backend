import dotenv from "dotenv";
import fs from "fs";
// Load environment variables
dotenv.config();
export const db_config = {
    host: process.env.MYSQL_URL,
    user: process.env.MYSQL_USER, // Note: mysql2 usually expects 'user', not 'admin'
    password: process.env.MYSQL_PASSWORD,
    database: "term_project", // Make sure to include your DB name here
    ssl: {
        ca: fs.readFileSync("./DigiCertGlobalRootG2.crt.pem")
    }
};
export const session_secret = process.env.NODE_SESSION_SECRET;
export const secure = process.env.NODE_ENV;
//# sourceMappingURL=utils.js.map