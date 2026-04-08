// server/controllers/auth.controller.js
import * as AuthService from "../services/auth.service.js";
import AppError from "../utils/AppError.js";
import { sendSuccess } from "../utils/response.js";
import config from "../config.js";

const { SUPER_ADMIN } = config.roles;

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      throw new AppError(400, "username and password are required");

    const result = await AuthService.login(username, password);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await AuthService.getMe(req.user.userId);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function createUser(req, res, next) {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role)
      throw new AppError(400, "username, password, and role are required");

    const companyId =
      req.user.role === SUPER_ADMIN ? req.body.companyId : req.companyId;

    const user = await AuthService.createUser({ username, password, role, companyId });
    sendSuccess(res, user, 201, "User created successfully");
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req, res, next) {
  try {
    const users = await AuthService.listUsers(req.companyId);
    sendSuccess(res, users);
  } catch (err) {
    next(err);
  }
}

export async function getUserById(req, res, next) {
  try {
    const user = await AuthService.getUserById(req.params.id, req.companyId);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const user = await AuthService.updateUser(req.params.id, req.companyId, req.body);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    await AuthService.deleteUser(req.params.id, req.companyId);
    sendSuccess(res, null, 200, "User deleted successfully");
  } catch (err) {
    next(err);
  }
}
