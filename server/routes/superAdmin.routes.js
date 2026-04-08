// server/routes/superAdmin.routes.js
import express from "express";
import authenticate from "../middleware/authenticate.js";
import requireRole from "../middleware/requireRole.js";
import * as SuperAdminController from "../controllers/superAdmin.controller.js";
import config from "../config.js";

const { SUPER_ADMIN } = config.roles;
const router = express.Router();

router.use(authenticate, requireRole(SUPER_ADMIN));

router.get("/stats", SuperAdminController.getPlatformStats);
router.get("/companies/:id/invoices", SuperAdminController.getCompanyInvoices);
router.get("/companies/:id/users", SuperAdminController.getCompanyUsers);

export default router;
