// server/database/seeding.js
import bcrypt from "bcryptjs";
import User from "../models/User.js";

export default async function seedDatabase() {
  try {
    const superAdminExists = await User.findOne({ role: "super_admin" });
    if (!superAdminExists) {
      const hashedPassword = await bcrypt.hash(
        process.env.SUPER_ADMIN_PASSWORD,
        10
      );
      await User.create({
        username: process.env.SUPER_ADMIN_USERNAME,
        password: hashedPassword,
        role: "super_admin",
        companyId: null,
      });
      console.log("Super admin seeded...");
    }
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}
