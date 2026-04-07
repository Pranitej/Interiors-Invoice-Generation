// server/routes/auth.js
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Company from "../models/Company.js";
import authenticate from "../middleware/authenticate.js";
import requireRole from "../middleware/requireRole.js";
import scopeToCompany from "../middleware/scopeToCompany.js";
import config from "../config.js";

const { COMPANY_ADMIN, SUPER_ADMIN } = config.roles;
const router = express.Router();

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ success: false, message: "Missing fields" });

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        companyId: user.companyId ?? null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    let company = null;
    if (user.companyId) {
      company = await Company.findById(user.companyId);
    }

    return res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      },
      company,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

/* ================= ME ================= */
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, user });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

/* ================= CREATE USER ================= */
router.post(
  "/users",
  authenticate,
  requireRole(COMPANY_ADMIN, SUPER_ADMIN),
  scopeToCompany,
  async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });

    try {
      const existing = await User.findOne({ username });
      if (existing) {
        return res
          .status(400)
          .json({ success: false, message: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // company_admin can only create company_user within their own company
      // super_admin can create company_admin (companyId must be provided in body)
      const companyId =
        req.user.role === SUPER_ADMIN ? req.body.companyId : req.companyId;

      const newUser = new User({
        username,
        password: hashedPassword,
        role,
        companyId: companyId ?? null,
      });
      await newUser.save();

      return res.json({
        success: true,
        message: "User created successfully",
        user: {
          _id: newUser._id,
          username: newUser.username,
          role: newUser.role,
          companyId: newUser.companyId,
          createdAt: newUser.createdAt,
        },
      });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }
);

/* ================= LIST USERS ================= */
router.get(
  "/users",
  authenticate,
  requireRole(COMPANY_ADMIN, SUPER_ADMIN),
  scopeToCompany,
  async (req, res) => {
    try {
      const query = req.companyId ? { companyId: req.companyId } : {};
      const users = await User.find(query).select("-password");
      return res.json({ success: true, users });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }
);

/* ================= GET SINGLE USER ================= */
router.get(
  "/users/:id",
  authenticate,
  requireRole(COMPANY_ADMIN, SUPER_ADMIN),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select("-password");
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      return res.json({ success: true, user });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }
);

/* ================= UPDATE USER ================= */
router.put(
  "/users/:id",
  authenticate,
  requireRole(COMPANY_ADMIN, SUPER_ADMIN),
  async (req, res) => {
    try {
      const { password, ...rest } = req.body;
      const updateData = { ...rest };

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      ).select("-password");

      if (!updatedUser)
        return res.status(404).json({ message: "User not found" });

      return res.json({ success: true, user: updatedUser });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error updating user", error: error.message });
    }
  }
);

/* ================= DELETE USER ================= */
router.delete(
  "/users/:id",
  authenticate,
  requireRole(COMPANY_ADMIN, SUPER_ADMIN),
  async (req, res) => {
    try {
      const deletedUser = await User.findByIdAndDelete(req.params.id);
      if (!deletedUser)
        return res.status(404).json({ message: "User not found" });
      return res.json({ message: "User deleted successfully", success: true });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error deleting user", error: error.message });
    }
  }
);

export default router;
