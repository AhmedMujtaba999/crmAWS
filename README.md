# CRM Platform

A full-stack, multi-tenant CRM built for service businesses to manage leads, schedule and dispatch field workers, track tasks to completion, and handle invoicing — all from one dashboard.

Built solo end-to-end: schema design, REST API, authentication, and a React admin dashboard.

## What it does

- **Lead Management** — Capture leads, attach services/quotes, move them through a pipeline, and convert won deals into scheduled work.
- **Task Scheduling & Dispatch** — Assign jobs to employees with a Kanban-style board and a calendar/shift scheduling view.
- **Worker-Facing Task UI** — A lightweight interface for field workers to view assigned jobs, mark them complete, and upload proof-of-work/invoice photos.
- **Employee Management** — Onboarding, working hours, leave requests, and company holiday calendars.
- **Invoicing** — Generate invoices tied to completed work and uploaded job photos.
- **Multi-Tenant by Design** — Every organization's data is fully isolated; the platform can serve many companies from one deployment.

## Tech Stack

**Backend**
- Node.js / Express (ES modules)
- PostgreSQL on AWS RDS
- JWT authentication
- AWS S3 for image uploads (presigned URLs)
- AWS SES for transactional email

**Frontend**
- React + TypeScript + Vite
- TanStack Query for server-state/data caching
- Zustand for client-side state
- Tailwind CSS + shadcn/ui components
- Axios with interceptor-based auth

**Architecture**
- Clean layered backend: `Routes → Controllers → Services → Repositories → PostgreSQL`
- Organization-scoped (multi-tenant) data access on every endpoint
- Deployed on AWS

## About Me

**Ahmed Mujtaba Ali** — Software Development Engineer
AWS Certified Cloud Practitioner | M.S. Information Systems, Trine University

- [LinkedIn](https://www.linkedin.com/in/ahmedmujtabaali)
- [GitHub](https://github.com/AhmedMujtaba999)
- mujtabaaliahmed559@gmail.com
