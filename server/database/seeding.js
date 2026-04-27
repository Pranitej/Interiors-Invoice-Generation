// server/database/seeding.js
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Invoice from "../models/Invoice.js";
import config from "../config.js";
import logger from "../utils/logger.js";

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
      logger.info("Super admin seeded");
    }

    // Backfill deletedAt: null on invoices created before soft-delete was added
    const { modifiedCount } = await Invoice.updateMany(
      { deletedAt: { $exists: false } },
      { $set: { deletedAt: null } }
    );
    if (modifiedCount > 0)
      logger.info(`Backfilled deletedAt on ${modifiedCount} invoice(s)`);
  } catch (error) {
    logger.error(`Seeding error — ${error.message}`);
    process.exit(1);
  }
}
