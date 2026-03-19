import express from "express";
import pool from "../config/db.js";
import { authRequired, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(authRequired, authorize("admin"));

const toCsvRow = (values) =>
  values
    .map((value) => {
      if (value === null || value === undefined) return "";
      const normalized = String(value).replaceAll('"', '""');
      return `"${normalized}"`;
    })
    .join(",");

router.get("/stats", async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'safe' THEN 1 ELSE 0 END) AS safe,
        SUM(CASE WHEN status = 'moderate' THEN 1 ELSE 0 END) AS moderate,
        SUM(CASE WHEN status = 'unsafe' THEN 1 ELSE 0 END) AS unsafe,
        SUM(CASE WHEN locked_by_ngo_id IS NOT NULL THEN 1 ELSE 0 END) AS locked
      FROM donations
    `);

    return res.json({ stats: rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.get("/donations", async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        d.id,
        d.name,
        d.category,
        d.quantity,
        d.image_url AS imageUrl,
        d.status,
        d.risk_score AS riskScore,
        d.created_at AS createdAt,
        donor.name AS donorName,
        ngo.name AS lockedBy,
        d.locked_at AS lockTime
      FROM donations d
      INNER JOIN users donor ON donor.id = d.donor_id
      LEFT JOIN users ngo ON ngo.id = d.locked_by_ngo_id
      ORDER BY d.created_at DESC
    `);

    return res.json({ donations: rows });
  } catch (error) {
    return next(error);
  }
});

router.get("/applications", async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        a.id,
        a.donation_id AS donationId,
        d.name AS foodName,
        d.image_url AS imageUrl,
        a.applicant_name AS applicantName,
        a.ngo_name AS ngoName,
        a.contact_person_name AS contactPersonName,
        a.contact_number AS contactNumber,
        a.email,
        a.collector_name AS collectorName,
        a.collector_phone AS collectorPhone,
        COALESCE(np.organization_name, ngo_user.ngo_name, a.ngo_name) AS trustName,
        np.address AS ngoAddress,
        a.created_at AS appliedAt,
        ngo_user.name AS ngoUserName
      FROM ngo_food_applications a
      INNER JOIN donations d ON d.id = a.donation_id
      INNER JOIN users ngo_user ON ngo_user.id = a.ngo_user_id
      LEFT JOIN ngo_profiles np ON np.ngo_user_id = a.ngo_user_id
      ORDER BY a.created_at DESC
    `);

    return res.json({ applications: rows });
  } catch (error) {
    if (error?.code === "ER_NO_SUCH_TABLE") {
      return res.json({ applications: [] });
    }
    return next(error);
  }
});

router.get("/report.csv", async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        d.name AS foodName,
        d.risk_score AS riskScore,
        d.image_url AS imageUrl,
        d.status,
        donor.name AS donorName,
        ngo.name AS lockedBy,
        d.locked_at AS lockTime
      FROM donations d
      INNER JOIN users donor ON donor.id = d.donor_id
      LEFT JOIN users ngo ON ngo.id = d.locked_by_ngo_id
      ORDER BY d.created_at DESC
    `);

    const lines = [
      toCsvRow(["Food Name", "Image URL", "Risk Score", "Status", "Donor", "Locked By", "Lock Time"]),
      ...rows.map((row) =>
        toCsvRow([
          row.foodName,
          row.imageUrl || "-",
          `${row.riskScore}%`,
          row.status,
          row.donorName,
          row.lockedBy || "-",
          row.lockTime || "-",
        ]),
      ),
    ];

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=food_allocation_report.csv");
    return res.send(lines.join("\n"));
  } catch (error) {
    return next(error);
  }
});

export default router;
