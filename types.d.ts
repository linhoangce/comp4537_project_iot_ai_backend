import "express-session";

declare module "express-session" {
  interface SessionData {
    authenticated: boolean;
    userType: "admin" | "user" | "guest";
    email: string;
  }
}