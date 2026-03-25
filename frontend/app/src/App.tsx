// App.tsx — Route Tree
// ============================================================
// This file defines the URL → component mapping for the entire app.
// React Router reads the current URL and renders the matching component.
//
// Route nesting works like this:
//   <Route element={<AuthGuard />}>          ← renders first, checks auth
//     <Route element={<Layout />}>           ← renders second, shows sidebar/header
//       <Route path="/leads" element={...}/> ← renders in Layout's <Outlet />
//     </Route>
//   </Route>
//
// React Router renders the full chain: AuthGuard → Layout → Page
// Each level renders its children inside its own <Outlet />.
// ============================================================

import { Routes, Route, Navigate } from 'react-router-dom'
// Routes: container for all Route definitions — only renders the first match.
// Route: maps a URL path to a component.
// Navigate: when rendered, immediately redirects to a different path.

import AuthGuard from '@/components/auth/AuthGuard'
import Layout from '@/components/layout/Layout'
import LoginPage from '@/pages/LoginPage'
import LeadsPage from '@/pages/LeadsPage'
import TasksPage from '@/pages/TasksPage'
import EmployeesPage from '@/pages/EmployeesPage'
import EmployeeDetailPage from '@/pages/EmployeeDetailPage'

// Pages will be imported here as we build them module by module.
// For now, placeholder components keep the routes valid.
function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-full text-slate-500 text-sm">
      {label} — coming soon
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* ---- PUBLIC ROUTE ---- */}
      {/* /login is accessible without a token */}
      <Route path="/login" element={<LoginPage />} />

      {/* ---- PROTECTED ROUTES ---- */}
      {/* AuthGuard wraps everything below — it checks for a token.
          If no token: redirects to /login before rendering anything inside. */}
      <Route element={<AuthGuard />}>

        {/* Layout wraps all pages — provides sidebar + header shell.
            Each page renders inside Layout's <Outlet />. */}
        <Route element={<Layout />}>

          {/* Redirect / to /leads — the default landing page after login */}
          <Route index element={<Navigate to="/leads" replace />} />

          {/* Operation Center */}
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/tasks" element={<TasksPage />} />

          {/* Finance */}
          <Route path="/finance" element={<ComingSoon label="Finance" />} />

          {/* Manage — Employee Details */}
          {/* /employees shows the full employee list */}
          <Route path="/employees" element={<EmployeesPage />} />
          {/* /employees/:id shows the detail page for one employee */}
          {/* :id is a URL parameter — useParams() reads it inside EmployeeDetailPage */}
          <Route path="/employees/:id" element={<EmployeeDetailPage />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<ComingSoon label="Dashboard" />} />

        </Route>
      </Route>

      {/* Catch-all: any unknown URL redirects to /leads */}
      <Route path="*" element={<Navigate to="/leads" replace />} />
    </Routes>
  )
}
