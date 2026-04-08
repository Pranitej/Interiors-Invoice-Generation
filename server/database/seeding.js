// server/database/seeding.js
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import config from "../config.js";

const { username, password } = config.superAdmin;
const { bcryptRounds } = config.auth;
const { SUPER_ADMIN } = config.roles;

export default async function seedDatabase() {
  try {
    const superAdminExists = await User.findOne({ role: SUPER_ADMIN });
    if (!superAdminExists) {
      const hashedPassword = await bcrypt.hash(password, bcryptRounds);
      await User.create({
        username,
        password: hashedPassword,
        role: SUPER_ADMIN,
        companyId: null,
      });
      console.log("Super admin seeded...");
    }
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}
