import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// defineConfig is a helper that gives you TypeScript autocomplete for Vite config options.
// It doesn't change any runtime behaviour — it's purely for editor support.
export default defineConfig({
  plugins: [
    react(),       // enables React JSX transform and Fast Refresh (hot reload)
    tailwindcss(), // Tailwind v4 runs as a Vite plugin — no tailwind.config.js needed
  ],
  resolve: {
    alias: {
      // "@" is an alias for the "src" directory.
      // Instead of writing: import Button from "../../components/ui/button"
      // You write:          import Button from "@/components/ui/button"
      // path.resolve(__dirname, "./src") turns the relative path into an absolute one.
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    // Proxy: in development, any request to /api/* gets forwarded to the backend on port 3000.
    // Vite rewrites the path — /api/admin/leads becomes /admin/leads on the backend.
    // This means no CORS issues in development since the browser thinks it's talking to itself.
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
})
