// main.tsx — Application Entry Point
// ============================================================
// This is the first file the browser runs. Vite's index.html has one div:
//   <div id="root"></div>
// This file finds that div and renders the entire React app inside it.
// Think of it as the "ignition" — everything starts here.
// ============================================================

import { StrictMode } from 'react'
// StrictMode is a React development tool. It runs your components twice
// (in dev only, not production) to help catch bugs like stale state or
// side effects that run unexpectedly. No visual change — just extra checks.

import { createRoot } from 'react-dom/client'
// createRoot is React 18's way to mount a React app into a real DOM element.
// Older React used ReactDOM.render() — createRoot is the modern replacement.

import { BrowserRouter } from 'react-router-dom'
// BrowserRouter watches the browser's URL bar using the HTML5 History API.
// It puts the current URL into React context so any component inside can:
//   - Read the current path with useLocation()
//   - Navigate programmatically with useNavigate()
//   - Match routes with <Route />
// Without this wrapper, none of React Router's features work.

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// QueryClient is TanStack Query's central "brain". It holds:
//   - A cache of all fetched data (so you don't refetch unnecessarily)
//   - Configuration like how long data stays fresh, how many retries on error
// QueryClientProvider puts this cache into React context so any component
// inside can call useQuery() or useMutation() to read/write server data.

import App from './App.tsx'
import './index.css' // Tailwind v4 + shadcn theme variables

// Create ONE QueryClient instance for the entire app.
// This is intentionally outside the component — if it were inside, it would
// be recreated on every render, wiping the cache each time. Outside = stable.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // staleTime: how long (ms) fetched data is considered "fresh".
      // During this window, TanStack Query won't refetch even if you
      // remount the component. 2 minutes is a good default for CRM data.
      staleTime: 1000 * 60 * 2, // 2 minutes

      // retry: if a request fails, how many times to retry before showing error.
      // 1 retry means: try once, if it fails try once more, then give up.
      retry: 1,

      // refetchOnWindowFocus: when the user switches back to this browser tab,
      // should TanStack Query automatically refetch data? false keeps it calm.
      refetchOnWindowFocus: false,
    },
  },
})

// document.getElementById('root')! — the ! at the end is TypeScript syntax.
// getElementById returns HTMLElement | null (it might not find the element).
// The ! tells TypeScript: "I guarantee this won't be null — trust me."
// This is called a "non-null assertion". Safe here because index.html always has <div id="root">.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/*
      Provider order matters. Outer providers are available to inner ones.
      BrowserRouter is inside QueryClientProvider — both are available to App.
      We could swap the order here, it doesn't matter for our use case.
    */}
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
