// server/database/seeding.js
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Invoice from "../models/Invoice.js";
import config from "../config.js";

const { username, password } = config.superAdmin;
const { bcryptRounds } = config.auth;
const { SUPER_ADMIN } = config.roles;

if (!username || !password) {
  throw new Error("SUPER_ADMIN_USERNAME and SUPER_ADMIN_PASSWORD must be set in .env");
}

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

    // Backfill deletedAt: null on invoices created before soft-delete was added
    const { modifiedCount } = await Invoice.updateMany(
      { deletedAt: { $exists: false } },
      { $set: { deletedAt: null } }
    );
    if (modifiedCount > 0)
      console.log(`Backfilled deletedAt on ${modifiedCount} invoice(s).`);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}
