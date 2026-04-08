// server/routes/company.routes.js
import express from "express";
import authenticate from "../middleware/authenticate.js";
import requireRole from "../middleware/requireRole.js";
import * as CompanyController from "../controllers/company.controller.js";
import config from "../config.js";

const { SUPER_ADMIN } = config.roles;
const router = express.Router();

router.use(authenticate, requireRole(SUPER_ADMIN));

router.post("/", CompanyController.createCompany);
router.get("/", CompanyController.listCompanies);
router.get("/:id", CompanyController.getCompany);
router.put("/:id", CompanyController.updateCompany);
router.delete("/:id", CompanyController.deleteCompany);
router.patch("/:id/toggle-active", CompanyController.toggleActive);

export default router;
