import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import authRoutes from "./routes/auth.routes.js";
import donorRoutes from "./routes/donor.routes.js";
import ngoRoutes from "./routes/ngo.routes.js";
import adminRoutes from "./routes/admin.routes.js";

dotenv.config({ override: true });

const app = express();
const configuredOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map((origin) => origin.trim())
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: configuredOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "Food Bridge backend is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/donor", donorRoutes);
app.use("/api/ngo", ngoRoutes);
app.use("/api/admin", adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((error, _req, res, _next) => {
  // Keep server logs detailed while returning a safe client-facing message.
  console.error(error);
  res.status(error.status || 500).json({ message: error.message || "Internal server error." });
});

export default app;
