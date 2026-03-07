# CRM Project Plan

## Tech Stack Plan

### Language
- **TypeScript** — API shapes (Employee, Task, Lead, etc.) are well-defined. TS catches type errors at compile time and provides autocomplete across the whole app. Essential as AI/marketing features are added later.

### Framework
- **React + Vite** — Fast dev server, simple SPA build. Admin UIs don't need SSR or SEO so Next.js adds complexity for no benefit.

### UI Components
- **Ant Design (antd)** — Full component library purpose-built for enterprise admin/CRM systems. Ships production-ready `Table` (with pagination, sorting, filtering), `Form`, `Modal`, `DatePicker`, `Select`, `Layout/Sider`. No need to build these from scratch.
- **No Tailwind CSS (for now)** — Ant Design's built-in theming system handles customisation (colours, fonts, border radius, spacing). Tailwind can be added later if more design control is needed, with preflight disabled to avoid conflicts with Ant Design styles.

### Routing
- **React Router v6** — Maps URLs to page components within the single-page app. Each role's routes are lazy-loaded, meaning admin code is never downloaded by a sales user and vice versa.

### App Structure — single app, role-based features
- One React app at `frontend/app/` instead of separate apps per role.
- Each role (admin, sales, etc.) is a feature folder inside `src/features/`.
- Role-based route guards control access per role.
- **Why not separate apps:** shared auth, shared API client, shared design system, one deployment. Splitting into multiple apps only makes sense when different teams own different roles.

```
frontend/
└── app/                    ← single React TS app
    └── src/
        ├── features/
        │   ├── admin/      ← current focus
        │   ├── sales/      ← future
        │   └── shared/     ← common components, types, API client
        └── routes/         ← role-based lazy-loaded route guards
```

### Server State
- **TanStack Query (React Query)** — Manages all data fetched from the backend (employees, tasks, customers). Handles caching, loading/error states, and cache invalidation after mutations automatically.
- **No Redux Toolkit** — Redux manages both server and client state with heavy boilerplate. TanStack Query handles server state specifically and eliminates 80% of what Redux would be needed for in a data-heavy CRM app.

### Client State
- **Zustand** — Minimal store for browser-only state: logged-in user, JWT token, UI toggles (sidebar open/closed). Simple `create()` call, no actions/reducers/dispatch boilerplate needed.

### HTTP Client
- **Axios** — Makes HTTP requests from the browser to the Node.js backend API. Request interceptors automatically attach `Authorization: Bearer <token>` to every request. Response interceptors redirect to `/login` on any 401.

### Real-time Updates (future)
- **Server-Sent Events (SSE)** — When real-time updates are needed (e.g. worker completes a task on Flutter → admin sees it live), SSE lets Node.js push events to the browser. The browser receives the event and calls `queryClient.invalidateQueries()` to trigger a refetch.
- **Start with TanStack Query polling** (`refetchInterval`), add SSE when real-time becomes a priority.
- No need for full WebSockets — SSE is one-way (server → client) which is all a CRM dashboard needs.
