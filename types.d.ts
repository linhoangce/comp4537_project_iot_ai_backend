import "express-session";

declare module "express-session" {
  interface SessionData {
    userId: number; // or string, depending on your DB
    authenticated: boolean;
    email: string;
    userType: "admin" | "user" | "guest";
  }
}