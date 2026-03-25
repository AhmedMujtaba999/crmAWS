// components/auth/AuthGuard.tsx — Route Protection
// ============================================================
// AuthGuard is a "wrapper route" — it sits in front of all protected pages.
// Before any protected page renders, React Router renders AuthGuard first.
// AuthGuard either lets the user through or sends them to /login.
//
// In App.tsx, the routing structure looks like this:
//
//   <Route element={<AuthGuard />}>           ← this runs first
//     <Route path="/leads" element={...} />   ← only shown if auth passes
//     <Route path="/tasks" element={...} />
//   </Route>
//
// This means we only write the auth check ONCE here, instead of
// copy-pasting it into every single page component.
// ============================================================

import { Navigate, Outlet } from 'react-router-dom'
// Navigate — when rendered, immediately redirects to the given path.
//   replace={true} replaces the current history entry instead of adding one.
//   Without replace, pressing Back would return to the blocked page,
//   which would immediately redirect again — an infinite loop feeling.
//
// Outlet — React Router's placeholder for child routes.
//   When the URL is /leads, <Outlet /> renders <LeadsPage />.
//   When the URL is /tasks, <Outlet /> renders <TasksPage />.
//   AuthGuard doesn't need to know which page — it just decides: show or redirect.

import { useAuthStore } from '@/store/authStore'
// useAuthStore is our Zustand hook. Calling it subscribes this component
// to the store — if the user logs out and token becomes null, this component
// automatically re-renders and redirects to /login.
//
// @/ is the path alias we configured in vite.config.ts and tsconfig.json.
// @/store/authStore resolves to src/store/authStore.ts

export default function AuthGuard() {
  // Read only the token from the store.
  // The (s) => s.token is a "selector" — it tells Zustand to only re-render
  // this component when the token changes, not when any other part of the
  // store changes. This is a performance optimisation.
  const token = useAuthStore((s) => s.token)

  // If there's no token, the user is not logged in.
  // Render <Navigate /> which immediately redirects to /login.
  // replace={true} prevents the protected URL from appearing in browser history.
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Token exists — user is authenticated.
  // <Outlet /> renders the matching child route (LeadsPage, TasksPage, etc.)
  return <Outlet />
}
