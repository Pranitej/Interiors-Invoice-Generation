import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ success: false, message: "Missing fields" });

  try {
    const user = await User.findOne({ username });

    if (!user || user.password !== password) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }

    return res.json({
      success: true,
      message: "Logged in successfully",
      user: {
        _id: user._id,
        username: user.username,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

router.post("/users", async (req, res) => {
  const { username, password, isAdmin } = req.body;

  if (!username || !password)
    return res.status(400).json({ success: false, message: "Missing fields" });

  try {
    const user = await User.findOne({ username });

    if (!!user) {
      return res
        .status(400)
        .json({ success: false, message: "Username already exists" });
    }

    const newUser = new User({ username, password, isAdmin });
    await newUser.save();

    return res.json({
      success: true,
      message: "User created successfully",
      user: {
        _id: newUser._id,
        username: newUser.username,
        isAdmin: newUser.isAdmin,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    return res.json({ success: true, user });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

router.get("/users", async (_, res) => {
  try {
    const users = (await User.find()) || [];
    return res.json({ success: true, users });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

// BASIC VERSION - Just CRUD operations

// PUT /api/users/:id - Update user
router.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      isAdmin: updatedUser.isAdmin,
      createdAt: updatedUser.createdAt,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating user", error: error.message });
  }
});

// DELETE /api/users/:id - Delete user
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully", success: true });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
});

export default router;
