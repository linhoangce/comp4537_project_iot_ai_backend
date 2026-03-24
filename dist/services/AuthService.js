import bcrypt from "bcrypt";
export class AuthService {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    async signup(userData) {
        const [fullname, email, password] = userData;
        // hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const finalUserData = [fullname, email, hashedPassword, "user"];
        return await this.userService.createNewUser(finalUserData);
    }
    async login(email, password) {
        const user = await this.userService.findUserByEmail(email);
        if (!user)
            return null;
        const isMatch = await bcrypt.compare(password, user.password);
        return isMatch ? user : null;
    }
}
//# sourceMappingURL=AuthService.js.map