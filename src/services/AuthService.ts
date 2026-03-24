import bcrypt from "bcrypt";
import type { UserService } from "./UserService.js";

export class AuthService {
	constructor(private userService: UserService) {}

	async signup(userData: [string, string, string]) {
		const [fullname, email, password] = userData;

		// hash password
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const finalUserData = [fullname, email, hashedPassword, "user"];

		return await this.userService.createNewUser(finalUserData);
	}

	async login(email: string, password: string) {
		const user = await this.userService.findUserByEmail(email);
		if (!user) return null;

		const isMatch = await bcrypt.compare(password, user.password);
		return isMatch ? user : null;
	}
}
