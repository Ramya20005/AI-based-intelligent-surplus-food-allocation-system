import nodemailer from "nodemailer";
import webpush from "web-push";
import pool from "../config/db.js";

const boolEnv = (value) => String(value || "false").toLowerCase() === "true";
const notificationsEnabled = boolEnv(process.env.NOTIFICATIONS_ENABLED);

let transporter = null;

const getMailer = () => {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_FROM) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: boolEnv(process.env.SMTP_SECURE),
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });

  return transporter;
};

let pushConfigured = false;
const configurePush = () => {
  if (pushConfigured) return;
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    pushConfigured = true;
    return;
  }
  webpush.setVapidDetails(
    process.env.VAPID_CONTACT || "mailto:admin@foodbridge.local",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
  pushConfigured = true;
};

const logNotification = async ({
  ngoUserId,
  donationId,
  channel,
  status,
  recipient,
  distanceKm,
  message,
}) => {
  await pool.execute(
    `
      INSERT INTO notification_logs
        (ngo_user_id, donation_id, channel, status, recipient, distance_km, message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [ngoUserId, donationId, channel, status, recipient || null, distanceKm ?? null, message || null],
  );
};

const composeMessage = ({ donation, distanceKm }) => ({
  subject: `Nearby food available: ${donation.name}`,
  text: [
    `A nearby donation is available.`,
    `Food: ${donation.name}`,
    `Category: ${donation.category}`,
    `Quantity: ${donation.quantity} servings`,
    `Risk: ${donation.status.toUpperCase()} (${donation.riskScore}%)`,
    `Location: ${donation.location}`,
    `Distance: ${distanceKm.toFixed(2)} km`,
    `Open your NGO dashboard to apply.`,
  ].join("\n"),
});

const sendEmailNotification = async ({ ngoProfile, donation, distanceKm }) => {
  const mailer = getMailer();
  if (!mailer) {
    throw new Error("SMTP is not configured.");
  }

  const recipient = ngoProfile.contact_email || ngoProfile.user_email;
  if (!recipient) {
    throw new Error("Recipient email is not available.");
  }

  const message = composeMessage({ donation, distanceKm });

  await mailer.sendMail({
    from: process.env.SMTP_FROM,
    to: recipient,
    subject: message.subject,
    text: message.text,
  });

  return recipient;
};

const sendSmsNotification = async ({ ngoProfile, donation, distanceKm }) => {
  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_FROM_NUMBER
  ) {
    throw new Error("Twilio is not configured.");
  }

  const recipient = ngoProfile.contact_phone;
  if (!recipient) {
    throw new Error("Recipient phone number is not available.");
  }

  const body = composeMessage({ donation, distanceKm }).text;
  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");

  const form = new URLSearchParams();
  form.set("To", recipient);
  form.set("From", process.env.TWILIO_FROM_NUMBER);
  form.set("Body", body);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Twilio send failed (${response.status}): ${text.slice(0, 200)}`);
  }

  return recipient;
};

const sendPushNotification = async ({ ngoProfile, donation, distanceKm }) => {
  configurePush();
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    throw new Error("Web push is not configured.");
  }

  const [rows] = await pool.execute(
    "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE ngo_user_id = ?",
    [ngoProfile.ngo_user_id],
  );

  if (rows.length === 0) {
    throw new Error("No push subscriptions registered.");
  }

  const payload = JSON.stringify({
    title: "Food Bridge: Nearby donation",
    body: `${donation.name} (${donation.quantity} servings) is available ${distanceKm.toFixed(2)} km away.`,
    url: "/ngo-dashboard",
  });

  let delivered = 0;
  for (const row of rows) {
    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: {
            p256dh: row.p256dh,
            auth: row.auth,
          },
        },
        payload,
      );
      delivered += 1;
    } catch {
      // Keep looping for other subscriptions.
    }
  }

  if (delivered === 0) {
    throw new Error("Push delivery failed for all subscriptions.");
  }

  return `${delivered} device(s)`;
};

export const notifyNearbyNgo = async ({ ngoProfile, donation, distanceKm }) => {
  if (!notificationsEnabled) {
    return [{ channel: "all", status: "skipped", reason: "Notifications are disabled by config." }];
  }

  const channels = [];
  if (ngoProfile.notify_email) channels.push("email");
  if (ngoProfile.notify_sms) channels.push("sms");
  if (ngoProfile.notify_push) channels.push("push");

  const results = [];
  for (const channel of channels) {
    try {
      let recipient = "";
      if (channel === "email") {
        recipient = await sendEmailNotification({ ngoProfile, donation, distanceKm });
      } else if (channel === "sms") {
        recipient = await sendSmsNotification({ ngoProfile, donation, distanceKm });
      } else if (channel === "push") {
        recipient = await sendPushNotification({ ngoProfile, donation, distanceKm });
      }

      await logNotification({
        ngoUserId: ngoProfile.ngo_user_id,
        donationId: donation.id,
        channel,
        status: "sent",
        recipient,
        distanceKm,
        message: "Notification sent successfully.",
      });
      results.push({ channel, status: "sent" });
    } catch (error) {
      await logNotification({
        ngoUserId: ngoProfile.ngo_user_id,
        donationId: donation.id,
        channel,
        status: "failed",
        recipient: "",
        distanceKm,
        message: error instanceof Error ? error.message : "Unknown notification error",
      });
      results.push({
        channel,
        status: "failed",
        reason: error instanceof Error ? error.message : "Unknown notification error",
      });
    }
  }

  return results;
};
