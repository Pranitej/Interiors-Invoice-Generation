// server/routes/auth.routes.js
import express from "express";
import authenticate from "../middleware/authenticate.js";
import requireRole from "../middleware/requireRole.js";
import scopeToCompany from "../middleware/scopeToCompany.js";
import * as AuthController from "../controllers/auth.controller.js";
import config from "../config.js";

const { COMPANY_ADMIN, SUPER_ADMIN } = config.roles;
const router = express.Router();

router.post("/login", AuthController.login);
router.get("/me", authenticate, AuthController.getMe);

router.post(
  "/users",
  authenticate,
  requireRole(COMPANY_ADMIN, SUPER_ADMIN),
  scopeToCompany,
  AuthController.createUser
);
router.get(
  "/users",
  authenticate,
  requireRole(COMPANY_ADMIN, SUPER_ADMIN),
  scopeToCompany,
  AuthController.listUsers
);
router.get(
  "/users/:id",
  authenticate,
  requireRole(COMPANY_ADMIN, SUPER_ADMIN),
  AuthController.getUserById
);
router.put(
  "/users/:id",
  authenticate,
  requireRole(COMPANY_ADMIN, SUPER_ADMIN),
  AuthController.updateUser
);
router.delete(
  "/users/:id",
  authenticate,
  requireRole(COMPANY_ADMIN, SUPER_ADMIN),
  AuthController.deleteUser
);

export default router;
