import type { NextFunction, Request, Response } from "express";


export const validateSession = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.authenticated) {
    next();
  } else {
    res.status(403).json({ error: "Login required"})
  }
}

export const validateAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.userType === "admin") {
    next();
  } else {
    res.status(403).json({ error: "Not an admin"})
  }
}

export const validateUser = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.userType === "user") {
    next();
  } else {
    res.status(403).json({ error: "User login required"});
  }
}


