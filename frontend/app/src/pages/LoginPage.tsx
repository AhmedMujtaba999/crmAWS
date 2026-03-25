// pages/LoginPage.tsx — Login Screen
// ============================================================
// This is the only public page — no token required to view it.
// It renders a form, calls POST /auth/login, and on success:
//   1. Stores the user + token in Zustand (authStore)
//   2. Redirects to /leads (the first protected page)
//
// If the user is already logged in and visits /login,
// App.tsx will redirect them away before this page renders.
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
// useMutation: TanStack Query's hook for write operations (POST, PUT, DELETE).
// Unlike useQuery (which auto-fetches), useMutation only fires when you
// explicitly call mutate() — because you don't want a form submitted on page load.

import { Zap, Mail, Lock, Building2, AlertCircle } from 'lucide-react'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'

// ============================================================
// TYPE DEFINITIONS
// ============================================================

// Shape of the form fields — TypeScript enforces these types as you type
interface LoginForm {
  email: string
  password: string
  organization_id: string // string because HTML inputs always return strings
}

// Shape of the backend's successful login response
// Must match what backend/src/controllers/auth.controller.js returns
interface LoginResponse {
  employee: {
    id: number
    name: string
    email: string
    role: string | null
    organization_id: number
  }
  token: string
}

// ============================================================
// COMPONENT
// ============================================================
export default function LoginPage() {
  const navigate = useNavigate()
  // useNavigate() returns a function. Calling navigate('/leads') changes the URL
  // and React Router renders the matching page — no full page reload.

  const login = useAuthStore((s) => s.login)
  // Pulls only the login action from the auth store.
  // (s) => s.login is a selector — extracts just what we need.

  // Form state — one object holding all three field values.
  // useState<LoginForm> tells TypeScript the shape of this state.
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
    organization_id: '',
  })

  // ============================================================
  // useMutation setup
  // ============================================================
  // mutationFn: the async function that makes the API call.
  //   It receives whatever you pass to mutate() as its argument.
  //   It must return a Promise — axios calls return Promises automatically.
  //
  // onSuccess: called when mutationFn resolves successfully.
  //   'data' is the resolved value — what mutationFn returned.
  //
  // onError: called when mutationFn throws or rejects.
  //   'error' is the error — we cast it to any to access .response.data.error
  //   (TypeScript doesn't know the shape of unknown errors by default).
  //
  // isPending: boolean — true while the request is in-flight.
  //   We use it to show a loading spinner and disable the button.
  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: LoginForm) =>
      api
        .post<LoginResponse>('/auth/login', {
          email: data.email,
          password: data.password,
          // organization_id is a UUID string — send it as-is, no conversion needed.
          organization_id: data.organization_id,
        })
        .then((res) => res.data),
    // .then((res) => res.data) unwraps the axios response wrapper.
    // axios returns { data, status, headers, ... } — we only want data.

    onSuccess: (data) => {
      // Store the user and token in Zustand + localStorage
      login(data.employee, data.token)
      // Redirect to the leads page — the first page after login
      navigate('/leads')
    },
  })

  // Extract the error message from the axios error object for display.
  // Optional chaining (?.) safely navigates nested properties that might be undefined.
  // The 'as any' cast tells TypeScript: "trust me, I know the shape of this error".
  const errorMessage = error
    ? (error as any).response?.data?.error || 'Login failed. Please check your credentials.'
    : null

  // handleSubmit is called when the form is submitted.
  // e.preventDefault() stops the browser's default form submission behaviour
  // (which would reload the page) so we can handle it with JavaScript instead.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutate(form) // triggers the useMutation — calls mutationFn with current form data
  }

  // Shared input class string — defined once to avoid repeating the same long string
  const inputClass =
    'w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors'

  return (
    // Full screen centered layout — flex column to stack logo above card
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo + title above the card */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 mb-4">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Operations Centre</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your admin account</p>
        </div>

        {/* Login card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">

          {/* Error message banner — only shown when useMutation's error is set */}
          {errorMessage && (
            <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <p className="text-sm text-rose-400">{errorMessage}</p>
            </div>
          )}

          {/* onSubmit on the <form> tag calls handleSubmit when the user
              clicks the submit button or presses Enter in any field */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email field */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={form.email}
                  // onChange fires on every keystroke.
                  // e.target.value is the current input value.
                  // Spread (...form) copies all existing fields, then overrides just 'email'.
                  // This is the standard React pattern for updating one field in a form object.
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={`${inputClass} pl-10`} // pl-10 makes room for the icon on the left
                />
              </div>
            </div>

            {/* Organization ID field */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                Organization ID
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 3dc3498b-7565-465f-bcbd-18b49f7762ec"
                  value={form.organization_id}
                  onChange={(e) => setForm({ ...form, organization_id: e.target.value })}
                  className={`${inputClass} pl-10`}
                />
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Your organization's numeric ID from the system
              </p>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isPending}
              // disabled attribute prevents clicks and form submission while loading.
              // opacity-50 + cursor-not-allowed give visual feedback that it's disabled.
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/30 mt-2 flex items-center justify-center gap-2"
            >
              {isPending ? (
                // Simple spinner using a border trick — the border spins via CSS animation
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
