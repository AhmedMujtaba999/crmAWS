# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication Rules (always follow these)

- **Before every file change:** explain out loud — what the file is, why this change is needed, where it sits in the architecture, how the change works, and what the result will be.
- **Be thorough, never brief.** Every file gets its own full explanation, not a collapsed summary.
- **Explain syntax and internals:** The user knows JavaScript but not TypeScript, React, or other libraries in this stack. For every piece of code written or changed, explain:
  - The syntax — what each keyword, symbol, or pattern means (especially TypeScript-specific syntax like generics `<T>`, interfaces, type annotations)
  - Internal workings — how the library manages things under the hood (e.g. how React re-renders, how TanStack Query caches data, how Zustand notifies subscribers)
  - The rules — constraints of the technology (e.g. React rules of hooks, TypeScript type enforcement)
  - Concrete examples where helpful
- **Never make a silent change.**
- **Development workflow — module by module:** For each feature/module, complete the full backend first (repo → service → controller → routes → register in app.js), then build the frontend. Never build frontend ahead of its backend.
- **Figma first for frontend (mandatory for now):** Never build frontend UI without first reviewing the Figma wireframe shared by the user. Study the layout, components, and data displayed before writing a single line of frontend code. Later this may become optional, but until the user says otherwise, Figma review comes before every frontend module.
- **Push back when needed:** If the user suggests something that conflicts with industry standards, has a better alternative, or could cause problems down the line — say so clearly before proceeding. Don't silently implement something suboptimal. Suggest the better way, explain why, then let the user decide.
- **No comments inside SQL queries:** Comments go before or after the SQL backtick string, never inside it. SQL queries must be clean.
- **Comment the code thoroughly:** Every file written must have comments that explain:
  - The purpose of each block/function
  - What the syntax means (especially TypeScript-specific syntax)
  - How the library handles it internally (e.g. "Zustand calls all subscribers when set() is called")
  - Why this approach was chosen
  - Place comments above a block for multi-line explanations, or inline (after the code on the same line) for short clarifications. Use whichever placement makes the explanation clearest.

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
