// server/services/auth.service.js
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Company from "../models/Company.js";
import Invoice from "../models/Invoice.js";
import AppError from "../utils/AppError.js";
import config from "../config.js";

const { jwtSecret, jwtExpiresInDays, bcryptRounds } = config.auth;

export async function login(username, password) {
  const user = await User.findOne({ username });
  if (!user) throw new AppError(401, "Invalid username or password");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError(401, "Invalid username or password");

  const token = jwt.sign(
    { userId: user._id, role: user.role, companyId: user.companyId ?? null },
    jwtSecret,
    { expiresIn: `${jwtExpiresInDays}d` }
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

  const hashedPassword = await bcrypt.hash(password, bcryptRounds);
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
  const query = companyId
    ? { companyId, deletedAt: null }
    : { deletedAt: null };
  return User.find(query).select("-password");
}

export async function getUserById(id, companyId) {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid user ID");
  const filter = { _id: id };
  if (companyId) filter.companyId = companyId;
  const user = await User.findOne(filter).select("-password");
  if (!user) throw new AppError(404, "User not found");
  return user;
}

export async function updateUser(id, companyId, body) {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid user ID");
  const { username, password } = body;
  const updateData = {};
  if (username !== undefined) updateData.username = username;
  if (password) updateData.password = await bcrypt.hash(password, bcryptRounds);

  const filter = { _id: id };
  if (companyId) filter.companyId = companyId;

  const user = await User.findOneAndUpdate(filter, updateData, { new: true }).select("-password");
  if (!user) throw new AppError(404, "User not found");
  return user;
}

export async function deleteUser(id, companyId) {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid user ID");

  const filter = { _id: id };
  if (companyId) filter.companyId = companyId;

  const user = await User.findOne(filter);
  if (!user) throw new AppError(404, "User not found");

  const invoiceCount = await Invoice.countDocuments({ createdBy: id });

  if (invoiceCount > 0) {
    await User.findByIdAndUpdate(id, { deletedAt: new Date() });
  } else {
    await User.findOneAndDelete(filter);
  }
}
