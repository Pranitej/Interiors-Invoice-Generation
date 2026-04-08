// server/controllers/company.controller.js
import * as CompanyService from "../services/company.service.js";
import AppError from "../utils/AppError.js";

export async function createCompany(req, res, next) {
  try {
    const { name, adminUsername, adminPassword } = req.body;
    if (!name || !adminUsername || !adminPassword)
      throw new AppError(400, "name, adminUsername, and adminPassword are required");

    const result = await CompanyService.createCompany(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function listCompanies(req, res, next) {
  try {
    const companies = await CompanyService.listCompanies();
    res.json({ success: true, data: companies });
  } catch (err) {
    next(err);
  }
}

export async function getCompany(req, res, next) {
  try {
    const company = await CompanyService.getCompanyById(req.params.id);
    res.json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
}

export async function updateCompany(req, res, next) {
  try {
    const company = await CompanyService.updateCompany(req.params.id, req.body);
    res.json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
}

export async function deleteCompany(req, res, next) {
  try {
    await CompanyService.deleteCompany(req.params.id);
    res.json({ success: true, message: "Company deleted successfully" });
  } catch (err) {
    next(err);
  }
}

export async function toggleActive(req, res, next) {
  try {
    const company = await CompanyService.toggleCompanyActive(req.params.id);
    res.json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
}
