import express from "express";
import pool from "../config/db.js";
import { authRequired, authorize } from "../middleware/auth.js";
import { geocodeAddress } from "../services/geocoding.service.js";

const router = express.Router();

router.use(authRequired, authorize("ngo"));

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9+\-\s]{7,20}$/;

const normalizeText = (value) => String(value || "").trim();
const toBool = (value) => value === true || value === "true" || value === 1 || value === "1";

const loadNgoProfile = async (ngoUserId) => {
  const [rows] = await pool.execute(
    `
      SELECT
        p.ngo_user_id AS ngoUserId,
        p.organization_name AS organizationName,
        p.address,
        p.latitude,
        p.longitude,
        p.service_radius_km AS serviceRadiusKm,
        p.contact_email AS contactEmail,
        p.contact_phone AS contactPhone,
        p.notify_email AS notifyEmail,
        p.notify_sms AS notifySms,
        p.notify_push AS notifyPush,
        p.is_active AS isActive
      FROM ngo_profiles p
      WHERE p.ngo_user_id = ?
      LIMIT 1
    `,
    [ngoUserId],
  );

  return rows[0] || null;
};

router.get("/profile", async (req, res, next) => {
  try {
    const profile = await loadNgoProfile(req.user.id);
    return res.json({ profile });
  } catch (error) {
    return next(error);
  }
});

router.put("/profile", async (req, res, next) => {
  try {
    const organizationName = normalizeText(req.body?.organizationName);
    const address = normalizeText(req.body?.address);
    const contactEmail = normalizeText(req.body?.contactEmail);
    const contactPhone = normalizeText(req.body?.contactPhone);
    const serviceRadiusKm = Number(req.body?.serviceRadiusKm);
    const notifyEmail = toBool(req.body?.notifyEmail);
    const notifySms = toBool(req.body?.notifySms);
    const notifyPush = toBool(req.body?.notifyPush);

    if (!organizationName || !address || !contactEmail || !contactPhone || !Number.isFinite(serviceRadiusKm)) {
      return res.status(400).json({
        message:
          "organizationName, address, contactEmail, contactPhone, and serviceRadiusKm are required.",
      });
    }

    if (!emailRegex.test(contactEmail)) {
      return res.status(400).json({ message: "Invalid contact email format." });
    }

    if (!phoneRegex.test(contactPhone)) {
      return res.status(400).json({ message: "Invalid contact phone format." });
    }

    if (serviceRadiusKm <= 0 || serviceRadiusKm > 100) {
      return res.status(400).json({ message: "serviceRadiusKm must be between 1 and 100." });
    }

    const { latitude, longitude } = await geocodeAddress(address);

    await pool.execute(
      `
        INSERT INTO ngo_profiles
          (ngo_user_id, organization_name, address, latitude, longitude, service_radius_km, contact_email, contact_phone, notify_email, notify_sms, notify_push, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE
          organization_name = VALUES(organization_name),
          address = VALUES(address),
          latitude = VALUES(latitude),
          longitude = VALUES(longitude),
          service_radius_km = VALUES(service_radius_km),
          contact_email = VALUES(contact_email),
          contact_phone = VALUES(contact_phone),
          notify_email = VALUES(notify_email),
          notify_sms = VALUES(notify_sms),
          notify_push = VALUES(notify_push),
          is_active = 1
      `,
      [
        req.user.id,
        organizationName,
        address,
        latitude,
        longitude,
        serviceRadiusKm,
        contactEmail,
        contactPhone,
        notifyEmail ? 1 : 0,
        notifySms ? 1 : 0,
        notifyPush ? 1 : 0,
      ],
    );

    const profile = await loadNgoProfile(req.user.id);
    return res.json({ message: "NGO profile saved.", profile });
  } catch (error) {
    return next(error);
  }
});

router.post("/push-subscriptions", async (req, res, next) => {
  try {
    const endpoint = normalizeText(req.body?.endpoint);
    const p256dh = normalizeText(req.body?.keys?.p256dh);
    const auth = normalizeText(req.body?.keys?.auth);

    if (!endpoint || !p256dh || !auth) {
      return res.status(400).json({ message: "Push subscription endpoint and keys are required." });
    }

    await pool.execute(
      `
        INSERT INTO push_subscriptions (ngo_user_id, endpoint, p256dh, auth)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          p256dh = VALUES(p256dh),
          auth = VALUES(auth),
          updated_at = CURRENT_TIMESTAMP
      `,
      [req.user.id, endpoint, p256dh, auth],
    );

    return res.status(201).json({ message: "Push subscription saved." });
  } catch (error) {
    return next(error);
  }
});

router.get("/donations", async (req, res, next) => {
  try {
    const profile = await loadNgoProfile(req.user.id);
    if (!profile || profile.latitude === null || profile.longitude === null) {
      return res.json({
        donations: [],
        profileWarning: "Set your NGO location profile to receive nearby donations.",
      });
    }

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
          d.created_at AS createdAt,
          d.locked_at AS lockedAt,
          donor.name AS donorName,
          ngo.name AS lockedBy,
          d.safe_time_hours AS safeTimeHours,
          GREATEST(
            TIMESTAMPDIFF(
              SECOND,
              NOW(),
              DATE_ADD(d.created_at, INTERVAL CAST(d.safe_time_hours * 3600 AS SIGNED) SECOND)
            ),
            0
          ) AS remainingSeconds,
          (
            6371 * ACOS(
              COS(RADIANS(?)) * COS(RADIANS(d.location_latitude)) *
              COS(RADIANS(d.location_longitude) - RADIANS(?)) +
              SIN(RADIANS(?)) * SIN(RADIANS(d.location_latitude))
            )
          ) AS distanceKm
        FROM donations d
        INNER JOIN users donor ON donor.id = d.donor_id
        LEFT JOIN users ngo ON ngo.id = d.locked_by_ngo_id
        WHERE d.status IN ('safe', 'moderate')
          AND (
            d.locked_by_ngo_id = ?
            OR (
              d.locked_by_ngo_id IS NULL
              AND DATE_ADD(d.created_at, INTERVAL CAST(d.safe_time_hours * 3600 AS SIGNED) SECOND) > NOW()
            )
          )
        HAVING distanceKm <= ? OR distanceKm IS NULL
        ORDER BY d.created_at DESC
      `,
      [
        Number(profile.latitude),
        Number(profile.longitude),
        Number(profile.latitude),
        req.user.id,
        Number(profile.serviceRadiusKm || process.env.DEFAULT_NGO_RADIUS_KM || 15),
      ],
    );

    return res.json({ donations: rows });
  } catch (error) {
    return next(error);
  }
});

router.post("/donations/:id/apply", async (req, res, next) => {
  let connection;
  try {
    const donationId = Number(req.params.id);
    if (!Number.isInteger(donationId)) {
      return res.status(400).json({ message: "Invalid donation id." });
    }

    const collectorName = normalizeText(req.body?.collectorName);
    const collectorPhone = normalizeText(req.body?.collectorPhone);

    if (!collectorName || !collectorPhone) {
      return res.status(400).json({ message: "collectorName and collectorPhone are required." });
    }

    if (!phoneRegex.test(collectorPhone)) {
      return res.status(400).json({ message: "Invalid collector phone number format." });
    }

    const profile = await loadNgoProfile(req.user.id);
    if (!profile) {
      return res.status(400).json({ message: "Save NGO profile before applying for food." });
    }

    const [ngoUserRows] = await pool.execute(
      `
        SELECT name, email, ngo_name AS ngoName
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [req.user.id],
    );
    const ngoUser = ngoUserRows[0] || {};

    const applicantName = normalizeText(ngoUser.name);
    const ngoName = normalizeText(profile.organizationName || ngoUser.ngoName || ngoUser.name);
    const contactPersonName = normalizeText(ngoUser.name);
    const contactNumber = normalizeText(profile.contactPhone);
    const email = normalizeText(profile.contactEmail || ngoUser.email);

    if (!applicantName || !ngoName || !contactPersonName || !contactNumber || !email) {
      return res.status(400).json({
        message: "Incomplete NGO profile. Save NGO name, contact phone, and contact email in profile.",
      });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid NGO contact email format in profile." });
    }

    if (!phoneRegex.test(contactNumber)) {
      return res.status(400).json({ message: "Invalid NGO contact phone format in profile." });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [updateResult] = await connection.execute(
      `
        UPDATE donations
        SET locked_by_ngo_id = ?, locked_at = NOW()
        WHERE id = ?
          AND status IN ('safe', 'moderate')
          AND locked_by_ngo_id IS NULL
          AND DATE_ADD(created_at, INTERVAL CAST(safe_time_hours * 3600 AS SIGNED) SECOND) > NOW()
      `,
      [req.user.id, donationId],
    );

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(409).json({ message: "This food item is already locked or expired." });
    }

    await connection.execute(
      `
        INSERT INTO ngo_food_applications
          (donation_id, ngo_user_id, applicant_name, ngo_name, contact_person_name, contact_number, email, collector_name, collector_phone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        donationId,
        req.user.id,
        applicantName,
        ngoName,
        contactPersonName,
        contactNumber,
        email,
        collectorName,
        collectorPhone,
      ],
    );

    await connection.commit();
    return res.json({ message: "Food allocation locked successfully." });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {
        // ignore rollback failures
      }
    }
    return next(error);
  } finally {
    if (connection) connection.release();
  }
});

export default router;
