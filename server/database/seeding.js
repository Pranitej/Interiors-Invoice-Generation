import User from "../models/User.js";

export default async function seedDatabase() {
  try {
    if ((await User.countDocuments()) === 0) {
      console.log("No users found...");
      await User.create([
        {
          username: "admin",
          password: "12345",
          isAdmin: true,
        },
        {
          username: "user",
          password: "12345",
          isAdmin: false,
        },
      ]);
      console.log("Users seeded...");
    }
    // process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}
