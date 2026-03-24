export const validateSession = (req, res, next) => {
    if (req.session.authenticated) {
        next();
    }
    else {
        res.status(403).json({ error: "Login required" });
    }
};
export const validateAdmin = (req, res, next) => {
    if (req.session.userType === "admin") {
        next();
    }
    else {
        res.status(403).json({ error: "Not an admin" });
    }
};
export const validateUser = (req, res, next) => {
    if (req.session.userType === "user") {
        next();
    }
    else {
        res.status(403).json({ error: "User login required" });
    }
};
//# sourceMappingURL=validate.js.map