// server/services/auth.service.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Company from "../models/Company.js";
import AppError from "../utils/AppError.js";

export async function login(username, password) {
  const user = await User.findOne({ username });
  if (!user) throw new AppError(401, "Invalid username or password");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError(401, "Invalid username or password");

  const token = jwt.sign(
    { userId: user._id, role: user.role, companyId: user.companyId ?? null },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  let company = null;
  if (user.companyId) {
    company = await Company.findById(user.companyId);
  }

  return {
    token,
    user: {
      _id: user._id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    },
    company,
  };
}

export async function getMe(userId) {
  const user = await User.findById(userId).select("-password");
  if (!user) throw new AppError(404, "User not found");
  return user;
}

export async function createUser({ username, password, role, companyId }) {
  const existing = await User.findOne({ username });
  if (existing) throw new AppError(400, "Username already exists");

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    username,
    password: hashedPassword,
    role,
    companyId: companyId ?? null,
  });

  return {
    _id: newUser._id,
    username: newUser.username,
    role: newUser.role,
    companyId: newUser.companyId,
    createdAt: newUser.createdAt,
  };
}

export async function listUsers(companyId) {
  const query = companyId ? { companyId } : {};
  return User.find(query).select("-password");
}

export async function getUserById(id) {
  const user = await User.findById(id).select("-password");
  if (!user) throw new AppError(404, "User not found");
  return user;
}

export async function updateUser(id, { password, ...rest }) {
  const updateData = { ...rest };
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }
  const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select("-password");
  if (!user) throw new AppError(404, "User not found");
  return user;
}

export async function deleteUser(id) {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new AppError(404, "User not found");
}
