// lib/axios.ts — Configured HTTP Client
// ============================================================
// This file creates a single axios instance used by the entire app
// to communicate with the backend API.
//
// Why a custom instance instead of using axios directly?
// axios.create() lets us set defaults once:
//   - baseURL: so every call uses /api/... automatically
//   - Interceptors: functions that run on every request/response
//
// Architecture position:
//   React component → useQuery hook → api.get('/admin/leads') → this file → backend
// ============================================================

import axios from 'axios'

// axios.create() returns a new axios instance with preset configuration.
// Any call made through this instance (api.get, api.post, etc.) will
// automatically use these defaults — you never have to repeat them.
const api = axios.create({
  // baseURL: every request is prefixed with this.
  // In development, Vite's proxy rewrites /api → http://localhost:3000
  // So api.get('/admin/leads') becomes a request to http://localhost:3000/admin/leads
  // In production, set VITE_API_URL to your real backend domain.
  baseURL: import.meta.env.VITE_API_URL || '/api',
  // import.meta.env is Vite's way of reading environment variables.
  // Variables must be prefixed with VITE_ to be accessible in the browser.
  // process.env (used in Node.js) does NOT work in Vite frontend code.
})

// ============================================================
// REQUEST INTERCEPTOR
// ============================================================
// This function runs BEFORE every request is sent out.
// Its job: attach the JWT token to the Authorization header.
//
// Without this, you'd have to manually write:
//   axios.get('/admin/leads', { headers: { Authorization: `Bearer ${token}` } })
// ...on every single API call. The interceptor does it automatically.
//
// api.interceptors.request.use() takes a function that receives
// the request config and must return it (modified or not).
// ============================================================
api.interceptors.request.use((config) => {
  // Read the token from localStorage.
  // localStorage is the browser's key-value storage — it persists across page refreshes.
  // We store the token there after login (handled in authStore.ts).
  const token = localStorage.getItem('crm_token')

  if (token) {
    // config.headers is the headers object for this request.
    // We add the Authorization header in the format the backend expects.
    // The backend's requireAuth middleware reads this exact header.
    config.headers.Authorization = `Bearer ${token}`
  }

  // We MUST return config — axios uses the returned value to send the request.
  // If you forget to return it, the request never goes out.
  return config
})

// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================
// This function runs AFTER every response comes back from the backend.
// It has two handlers:
//   1. onSuccess (res) => res        — for successful responses (2xx), just pass through
//   2. onError  (err) => handle it   — for error responses (4xx, 5xx)
//
// The key behaviour: if the backend returns 401 (Unauthorized),
// it means the token is expired or invalid. We clear the stored
// credentials and redirect to the login page.
// ============================================================
api.interceptors.response.use(
  // Success handler — response was 2xx, just return it as-is
  (response) => response,

  // Error handler — response was 4xx or 5xx, or network failed
  (error) => {
    // error.response is the HTTP response object (may be undefined for network errors)
    // error.response?.status uses optional chaining — safe even if response is undefined
    if (error.response?.status === 401) {
      // 401 = Unauthorized. Token is missing, expired, or invalid.
      // Clear everything stored at login time:
      localStorage.removeItem('crm_token') // the JWT token
      localStorage.removeItem('crm_user')  // the logged-in user object

      // Redirect to login page.
      // We use window.location.href instead of React Router's navigate()
      // because this interceptor lives outside of React — it has no access
      // to React context, so we use the raw browser navigation API.
      window.location.href = '/login'
    }

    // Re-throw the error so the calling useQuery/useMutation can
    // still catch it and show an error message to the user if needed.
    return Promise.reject(error)
  }
)

export default api
