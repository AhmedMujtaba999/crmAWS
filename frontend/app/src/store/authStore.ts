// store/authStore.ts — Authentication State
// ============================================================
// This file creates a Zustand store to hold the logged-in user and JWT token.
//
// Why Zustand and not useState?
// useState only works inside one component. If LoginPage sets the user,
// the Sidebar component can't see it — they're separate components.
// Zustand's store lives OUTSIDE React's component tree, making it
// globally accessible to any component without prop drilling.
//
// Why not just use a global variable?
// A plain JS variable (let user = null) won't trigger React re-renders.
// When you update it, the UI stays stale. Zustand's set() notifies all
// subscribed components to re-render with the new value automatically.
//
// Why localStorage?
// localStorage persists across page refreshes. Without it, refreshing
// the browser would log the user out because React state resets on refresh.
// On app start, we re-hydrate (reload) the store from localStorage.
// ============================================================

import { create } from 'zustand'
// create() is Zustand's main function. It takes a setup function and
// returns a React hook (useAuthStore) that components call to read/write state.

// ============================================================
// TYPE DEFINITIONS (TypeScript)
// ============================================================
// TypeScript requires us to describe the shape of data before using it.
// An "interface" is a TypeScript blueprint — it says "any object of this
// type must have exactly these fields with these types."
// If you try to set a field that doesn't match, TypeScript errors before runtime.
// ============================================================

// User shape — matches what the backend returns in the login response
interface User {
  id: number           // the employee's database id
  name: string         // e.g. "Ahmed Ali"
  email: string        // e.g. "ahmed@company.com"
  role: string | null  // e.g. "ADMIN" — can be null if not set
  organization_id: number // which org this user belongs to (multi-tenancy)
}

// AuthState describes the ENTIRE store — both data and actions.
// Actions are functions — they're part of the store object too.
interface AuthState {
  user: User | null    // null means no one is logged in
  token: string | null // null means no token (not logged in)

  // login() is called after a successful API login response.
  // It stores the user and token both in Zustand and in localStorage.
  login: (user: User, token: string) => void

  // logout() clears everything — called when user clicks logout or gets a 401.
  logout: () => void
}

// create<AuthState>() — the <AuthState> in angle brackets is a TypeScript generic.
// It tells Zustand: "this store must match the AuthState interface."
// If we try to store or return something that doesn't match, TypeScript will error.
//
// The function receives (set) — Zustand's state setter.
// set() merges new values into the store AND notifies all subscribed components.
export const useAuthStore = create<AuthState>((set) => ({

  // ---- Initial state — re-hydrated from localStorage on page load ----
  // JSON.parse() converts the stored string back into a JS object.
  // || null means: if localStorage has nothing, start as null.
  // This runs once when the module loads (on page refresh/first visit).
  user: JSON.parse(localStorage.getItem('crm_user') || 'null'),
  token: localStorage.getItem('crm_token') || null,

  // ---- login action ----
  // Called by LoginPage after the backend returns a successful response.
  // Parameters: user object and JWT token string.
  login: (user: User, token: string) => {
    // Persist to localStorage so the session survives page refresh.
    // JSON.stringify() converts the object to a string (localStorage only stores strings).
    localStorage.setItem('crm_token', token)
    localStorage.setItem('crm_user', JSON.stringify(user))

    // set() merges { user, token } into the store.
    // Any component using useAuthStore() will re-render with the new values.
    // { user, token } is JS shorthand for { user: user, token: token }
    set({ user, token })
  },

  // ---- logout action ----
  // Called when the user clicks logout or when the axios interceptor
  // detects a 401 (expired/invalid token).
  logout: () => {
    // Remove from localStorage first so refresh doesn't restore the session
    localStorage.removeItem('crm_token')
    localStorage.removeItem('crm_user')

    // Reset store back to "not logged in" state.
    // set() notifies all components — e.g. AuthGuard will redirect to /login.
    set({ user: null, token: null })
  },
}))
