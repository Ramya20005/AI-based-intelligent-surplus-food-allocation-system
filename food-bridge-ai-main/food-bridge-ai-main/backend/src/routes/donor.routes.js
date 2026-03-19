import express from "express";
import pool from "../config/db.js";
import { authRequired, authorize } from "../middleware/auth.js";
import { donationImageUpload } from "../middleware/upload.js";
import { analyzeDonationWithAI } from "../services/aiAnalysis.service.js";
import { geocodeAddress } from "../services/geocoding.service.js";

const router = express.Router();

router.use(authRequired, authorize("donor"));

router.post("/upload-image", (req, res, next) => {
  donationImageUpload.single("image")(req, res, (error) => {
    if (error) {
      return res.status(400).json({ message: error.message || "Image upload failed." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No image file received." });
    }

    const baseUrl = (process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

    return res.status(201).json({
      message: "Image uploaded successfully.",
      imageUrl,
      fileName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
  });
});

router.post("/donations", async (req, res, next) => {
  try {
    const { category, foodName, quantity, prepTime, freshness, location, imageUrl } = req.body || {};

    if (!category || !foodName || !quantity || !freshness || !location) {
      return res.status(400).json({
        message: "category, foodName, quantity, freshness, and location are required.",
      });
    }

    const numericQuantity = Number(quantity);
    const numericFreshness = Number(freshness);

    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
      return res.status(400).json({ message: "Quantity should be a positive number." });
    }

    if (!Number.isFinite(numericFreshness) || numericFreshness <= 0) {
      return res.status(400).json({ message: "Freshness should be a positive number." });
    }

    const { analysis, meta } = await analyzeDonationWithAI({
      category,
      foodName,
      quantity: numericQuantity,
      prepTime,
      freshnessHours: numericFreshness,
      location,
      imageUrl,
    });

    let locationLatitude = null;
    let locationLongitude = null;
    let geocodingNote = "";
    try {
      const geo = await geocodeAddress(location);
      locationLatitude = geo.latitude;
      locationLongitude = geo.longitude;
    } catch (error) {
      geocodingNote = error instanceof Error ? error.message : "Geocoding failed.";
    }

    const [result] = await pool.execute(
      `
        INSERT INTO donations
          (donor_id, name, category, quantity, prep_time_note, freshness_hours, location, location_latitude, location_longitude, image_url, status, risk_score, safe_time_hours, analysis_explanation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        req.user.id,
        foodName,
        category,
        numericQuantity,
        prepTime || null,
        numericFreshness,
        location,
        locationLatitude,
        locationLongitude,
        imageUrl || null,
        analysis.status,
        analysis.riskScore,
        analysis.safeTimeHours,
        analysis.explanation,
      ],
    );

    return res.status(201).json({
      message: "Donation submitted successfully.",
      donation: {
        id: result.insertId,
        name: foodName,
        category,
        quantity: numericQuantity,
        imageUrl: imageUrl || undefined,
        locationLatitude: locationLatitude ?? undefined,
        locationLongitude: locationLongitude ?? undefined,
        status: analysis.status,
        riskScore: analysis.riskScore,
      },
      analysis,
      analysisMeta: meta,
      allocationMeta: {
        geocodingNote: geocodingNote || undefined,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/donations", async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `
        SELECT
          d.id,
          d.name,
          d.category,
          d.quantity,
          d.image_url AS imageUrl,
          d.status,
          d.risk_score AS riskScore,
          d.location,
          d.freshness_hours AS freshnessHours,
          d.prep_time_note AS prepTime,
          d.created_at AS createdAt,
          d.safe_time_hours AS safeTimeHours,
          d.locked_at AS lockedAt,
          ngo.name AS lockedBy
        FROM donations d
        LEFT JOIN users ngo ON ngo.id = d.locked_by_ngo_id
        WHERE d.donor_id = ?
        ORDER BY d.created_at DESC
      `,
      [req.user.id],
    );

    return res.json({ donations: rows });
  } catch (error) {
    return next(error);
  }
});

router.post("/feedback", async (req, res, next) => {
  try {
    const { rating, comment } = req.body || {};
    const numericRating = Number(rating);

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "Rating should be an integer from 1 to 5." });
    }

    if (comment && String(comment).length > 1000) {
      return res.status(400).json({ message: "Comment is too long." });
    }

    await pool.execute("INSERT INTO feedback (donor_id, rating, comment) VALUES (?, ?, ?)", [
      req.user.id,
      numericRating,
      comment || null,
    ]);

    return res.status(201).json({ message: "Feedback submitted successfully." });
  } catch (error) {
    return next(error);
  }
});

export default router;
