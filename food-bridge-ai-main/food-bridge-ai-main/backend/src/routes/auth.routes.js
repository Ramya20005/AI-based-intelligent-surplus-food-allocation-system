import express from "express";
import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import { authRequired } from "../middleware/auth.js";
import { signToken } from "../utils/jwt.js";

const router = express.Router();
const allowedRoles = new Set(["donor", "ngo", "admin"]);

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  ngoName: user.ngo_name ?? user.ngoName ?? null,
});

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, role, ngoName } = req.body || {};

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "name, email, password, and role are required." });
    }

    if (!allowedRoles.has(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    const normalizedNgoName = String(ngoName || "").trim();
    if (role === "ngo" && !normalizedNgoName) {
      return res.status(400).json({ message: "ngoName is required when role is ngo." });
    }

    const [existingRows] = await pool.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (existingRows.length > 0) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password_hash, role, ngo_name) VALUES (?, ?, ?, ?, ?)",
      [name, email, passwordHash, role, role === "ngo" ? normalizedNgoName : null],
    );

    const user = {
      id: result.insertId,
      name,
      email,
      role,
      ngo_name: role === "ngo" ? normalizedNgoName : null,
    };
    const token = signToken(user);
    return res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password, role } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required." });
    }

    const [rows] = await pool.execute(
      "SELECT id, name, email, password_hash, role, ngo_name FROM users WHERE email = ? LIMIT 1",
      [email],
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const foundUser = rows[0];
    const passwordMatch = await bcrypt.compare(password, foundUser.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (role && role !== foundUser.role) {
      return res.status(403).json({ message: "Role mismatch for this account." });
    }

    const user = sanitizeUser(foundUser);
    const token = signToken(user);
    return res.json({ token, user });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", authRequired, async (req, res, next) => {
  try {
    const [rows] = await pool.execute("SELECT id, name, email, role, ngo_name FROM users WHERE id = ? LIMIT 1", [
      req.user.id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({ user: sanitizeUser(rows[0]) });
  } catch (error) {
    return next(error);
  }
});

export default router;
