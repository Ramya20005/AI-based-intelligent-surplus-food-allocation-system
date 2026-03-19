# Food Bridge AI (Frontend + Backend + MySQL)

This project now contains:

- React frontend (existing UI)
- Express backend API (`backend/`)
- MySQL schema (`backend/sql/schema.sql`)

## Frontend setup

```bash
npm install
cp .env.example .env
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Create MySQL schema:

```bash
mysql -u root -p < sql/schema.sql
```

If database already exists and you need image support migration:

```bash
mysql -u root -p -D your_database_name < sql/migration_add_image_url.sql
```

If database already exists and you need NGO apply form table:

```bash
mysql -u root -p -D your_database_name < sql/migration_add_ngo_application_table.sql
```

If database already exists and you need geo-filter + notification tables/columns:

```bash
mysql -u root -p -D your_database_name < sql/migration_add_location_and_notifications.sql
```

Start backend:

```bash
npm run dev
```

Backend runs on `http://localhost:4000`.

## Real AI setup (Gemini)

In `backend/.env`, set:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
AI_STRICT=false
```

If `AI_STRICT=false`, backend falls back to rule-based scoring when AI API is unavailable.

## Useful scripts (from project root)

```bash
npm run dev          # frontend
npm run backend:dev  # backend
npm run build        # frontend production build
```

## Main API routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/donor/donations`
- `POST /api/donor/upload-image` (multipart image upload, optional before donation submit)
- `GET /api/donor/donations`
- `POST /api/donor/feedback`
- `GET /api/ngo/donations`
- `POST /api/ngo/donations/:id/apply`
  - Required body fields: applicantName, ngoName, contactPersonName, contactNumber, email, collectorName, collectorPhone
- `GET /api/ngo/profile`
- `PUT /api/ngo/profile`
- `POST /api/ngo/push-subscriptions`
- `GET /api/admin/stats`
- `GET /api/admin/donations`
- `GET /api/admin/applications`
- `GET /api/admin/report.csv`
