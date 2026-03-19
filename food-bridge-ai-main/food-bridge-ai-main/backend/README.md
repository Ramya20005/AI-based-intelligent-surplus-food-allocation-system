# Food Bridge Backend (Express + MySQL)

## 1. Install

```bash
cd backend
npm install
```

## 2. Configure environment

```bash
cp .env.example .env
```

Update `.env` with your MySQL username/password/database.
For real AI scoring, also set:

- `AI_PROVIDER=gemini`
- `GEMINI_API_KEY=<your key>`
- optional `GEMINI_MODEL` (default: `gemini-1.5-flash`)
- optional `AI_STRICT=true` to fail requests if AI API is unavailable
- optional `BACKEND_PUBLIC_URL=http://localhost:4000` for image URLs returned after upload
- optional geocoding/notification settings from `.env.example`:
  - `GEOCODING_PROVIDER`, `DEFAULT_NGO_RADIUS_KM`
  - SMTP env vars for email notifications
  - Twilio env vars for SMS notifications
  - VAPID env vars for push notifications

Donor image upload route:

- `POST /api/donor/upload-image`
- Form field name: `image`
- Max size: 5MB

Schema note:

- `donations.image_url` stores uploaded/pasted image URL for each donation.
- `ngo_food_applications` stores mandatory NGO allocation form details.

NGO apply request now requires:

- `applicantName`
- `ngoName`
- `contactPersonName`
- `contactNumber`
- `email`
- `collectorName`
- `collectorPhone`

Admin NGO application details route:

- `GET /api/admin/applications`

New NGO profile and push routes:

- `GET /api/ngo/profile`
- `PUT /api/ngo/profile`
- `POST /api/ngo/push-subscriptions`

New migration for geo + notifications:

- `sql/migration_add_location_and_notifications.sql`

## 3. Create database schema

Run `backend/sql/schema.sql` in your MySQL server:

```bash
mysql -u root -p < sql/schema.sql
```

## 4. Start backend

```bash
npm run dev
```

Server URL: `http://localhost:4000`

Health check: `GET /api/health`
