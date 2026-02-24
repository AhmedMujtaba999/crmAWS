# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the `backend/` directory:

```bash
# Development (hot reload)
npm run dev

# Production
npm start
```

No test runner or linter is currently configured.

## Architecture

This is a Node.js/Express CRM backend using **ES6 modules** (`"type": "module"` in package.json). The architecture follows a strict 3-layer pattern:

```
Routes → Controllers → Services → Repositories → PostgreSQL (AWS RDS)
```

- **Controllers** (`src/controllers/`): Parse HTTP request, call service, return response
- **Services** (`src/services/`): Business logic, orchestration, transactions
- **Repositories** (`src/repositories/`): Raw SQL queries only, no business logic
- **Routes** (`src/routes/`): Express router definitions, JWT middleware applied here

Entry: `src/server.js` → `src/app.js` → routes

## Multi-Tenancy

Every API operation is scoped by `organization_id`. This is extracted from the JWT payload (set at login/register) and passed through the entire call chain: controller → service → repository. All SQL queries must filter by `organization_id`.

JWT payload contains: `employee_id`, `organization_id`, `role`.

## Database

PostgreSQL on AWS RDS. The `pg` pool is configured in `src/config/db.js` with SSL required, max 20 connections, 10s statement timeout.

**No migration system** — schema changes are made directly on the RDS instance. Repositories use raw SQL via the `pg` pool.

For operations touching multiple tables, services use explicit transactions:
```js
const client = await pool.connect();
await client.query('BEGIN');
// ... queries
await client.query('COMMIT');
```

## Key Integrations

- **AWS S3** (`crm-task-images-01`): File uploads via presigned URLs (5-min expiry). See `src/services/upload.service.js`.
- **AWS SES via Nodemailer**: Task completion email notifications. See `src/services/email.service.js`. This is partially implemented — email logic for worker task completion is in progress.

## API Endpoints

Auth (public): `POST /auth/register`, `POST /auth/login`

All other routes require `Authorization: Bearer <token>` header:

| Prefix | Resource |
|--------|----------|
| `/customers` | Customer management |
| `/leads` | Lead management |
| `/tasks` | Task management |
| `/employees` | Employee management |
| `/services` | Services catalog |
| `/invoices` | Invoices |
| `/lead-services` | Services linked to leads |
| `/lead-employees` | Employee-lead assignments |
| `/employee-leaves` | Leave requests |
| `/employee-schedule` | Shift scheduling |
| `/workertaskui` | Worker-facing task UI (recent focus) |
| `/workertaskinoivoicepicture` | S3 invoice image uploads |
| `/uploads` | Presigned URL generation |
| `/strictadmin/organization` | Organization CRUD |

## Required Environment Variables

Stored in `backend/.env`:

```
PORT
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
JWT_SECRET, JWT_EXPIRES_IN
AWS_REGION
S3_BUCKET_NAME
SES_SMTP_HOST, SES_SMTP_PORT, SES_SMTP_USER, SES_SMTP_PASS, SES_FROM_EMAIL
```
