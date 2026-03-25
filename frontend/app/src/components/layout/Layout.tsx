// components/layout/Layout.tsx — App Shell
// ============================================================
// This is the persistent shell rendered around every protected page.
// It contains the sidebar (left) and header (top). Page content
// renders inside it via <Outlet />.
//
// In App.tsx routing:
//   <Route element={<AuthGuard />}>
//     <Route element={<Layout />}>          ← this wraps all pages
//       <Route path="/leads" element={...} />
//     </Route>
//   </Route>
//
// React Router renders: AuthGuard → Layout → (current page)
// ============================================================

import { useState } from 'react'
// useState: React's built-in hook for local component state.
// const [value, setValue] = useState(initial)
//   - value: the current value
//   - setValue: call this to update value AND trigger a re-render
// Array destructuring syntax: React returns [currentValue, setter] as an array,
// and we name them whatever we want using [name1, name2].

import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
// NavLink: like a regular <a> tag but React Router aware.
//   It receives a function as className — React Router calls it with { isActive }
//   so you can apply different styles when the link matches the current URL.
// Outlet: placeholder where the current page's content renders.
// useLocation: hook that returns the current URL path, search, hash.
// useNavigate: hook that returns a function to programmatically change the URL.

import {
  Users,
  DollarSign,
  Settings,
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  Zap,
  Menu,
  X,
  Bell,
  Search,
  UserCircle,
  LogOut,
} from 'lucide-react'
// lucide-react: icon library. Each icon is a React component.
// Usage: <Bell className="w-5 h-5" /> renders a bell icon sized 20x20px.

import { useAuthStore } from '@/store/authStore'

// ============================================================
// NAV ITEMS CONFIGURATION
// ============================================================
// Defining the sidebar navigation structure as a data array rather than
// hardcoded JSX keeps the sidebar rendering logic clean.
// Each item can have children (a collapsible group) or be a direct link.
// ============================================================
const navItems = [
  {
    label: 'Overview',
    icon: LayoutDashboard,  // the icon component itself (not rendered yet — used as <Icon />)
    path: '/dashboard',
    exact: true,            // exact: only highlight when URL is exactly /dashboard
    children: null,
  },
  {
    label: 'Operation Center',
    icon: Users,
    path: '/leads',
    exact: false,
    children: [
      { label: 'Leads', path: '/leads' },
      { label: 'Tasks & Scheduling', path: '/tasks' },
    ],
  },
  {
    label: 'Finance',
    icon: DollarSign,
    path: '/finance',
    exact: false,
    children: [
      { label: 'Dashboard', path: '/finance' },
    ],
  },
  {
    label: 'Manage',
    icon: Settings,
    // path is used only to determine whether the group header is highlighted —
    // Layout checks location.pathname.startsWith(item.path).
    // Setting this to '/employees' means the "Manage" header lights up whenever
    // you're on any /employees/* URL.
    path: '/employees',
    exact: false,
    children: [
      { label: 'Employee Details', path: '/employees' },
    ],
  },
]

// ============================================================
// LAYOUT COMPONENT
// ============================================================
export default function Layout() {
  // sidebarOpen: controls whether the sidebar is full width (true) or icon-only (false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // expandedItems: array of nav group labels that are currently expanded.
  // Starting with all groups open so the user sees the full nav on first load.
  // string[] means: an array where every item is a string.
  const [expandedItems, setExpandedItems] = useState<string[]>([
    'Operation Center',
    'Finance',
    'Manage',
  ])

  // Read current URL path to highlight the active nav item
  const location = useLocation()

  const navigate = useNavigate()

  // Read user from auth store to display their name in the sidebar footer
  const { user, logout } = useAuthStore()

  // toggleExpand: adds or removes a label from the expandedItems array.
  // prev is the current array value — React passes it automatically.
  // The ternary (? :) is JS shorthand for if/else:
  //   condition ? valueIfTrue : valueIfFalse
  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((i) => i !== label)  // remove it — .filter() returns a new array without this item
        : [...prev, label]                  // add it — spread operator copies the array, then adds label
    )
  }

  const handleLogout = () => {
    logout()           // clears Zustand store + localStorage
    navigate('/login') // sends user to login page
  }

  return (
    // The outer div is a flex row that fills the full screen height.
    // overflow-hidden prevents the whole page from scrolling — only the content area scrolls.
    <div className="flex h-screen bg-slate-950 overflow-hidden">

      {/* ======================================================
          SIDEBAR
          transition-all duration-300: smoothly animates width change
          when sidebar collapses from w-64 to w-16
          ====================================================== */}
      <aside
        className={`
          ${sidebarOpen ? 'w-64' : 'w-16'}
          transition-all duration-300
          flex flex-col
          bg-gradient-to-b from-slate-900 to-slate-950
          border-r border-slate-800
          shadow-2xl
          flex-shrink-0
        `}
      >
        {/* Logo + collapse button */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
          {/* App logo icon */}
          <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap className="w-5 h-5 text-white" />
          </div>

          {/* App name — only visible when sidebar is open */}
          {sidebarOpen && (
            <div>
              <p className="text-white text-sm font-semibold tracking-wide">Operations</p>
              <p className="text-indigo-400 text-xs">Centre</p>
            </div>
          )}

          {/* Collapse/expand toggle button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            // ml-auto pushes the button to the far right of the flex row
            className="ml-auto text-slate-400 hover:text-white transition-colors"
          >
            {/* Show X when open (to collapse), Menu when closed (to expand) */}
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation items — flex-1 makes this section take all remaining vertical space */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            // Each icon stored in navItems is a component reference (e.g. LayoutDashboard).
            // We assign it to Icon (capitalised) so JSX knows to treat it as a component.
            // <item.icon /> would not work — JSX requires capitalised component names.
            const Icon = item.icon

            // Is this group expanded? Check if its label is in the expandedItems array.
            const isExpanded = expandedItems.includes(item.label)

            // Is this nav item active? Check if current URL starts with this item's path.
            // Special case for exact items (like Dashboard): only active on exact match.
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path)

            return (
              <div key={item.label}>
                {item.children ? (
                  // ---- GROUP ITEM (has children, so it's a collapsible button) ----
                  <>
                    <button
                      onClick={() => toggleExpand(item.label)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                        transition-all duration-200
                        ${isActive
                          ? 'bg-indigo-500/20 text-indigo-400'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && (
                        <>
                          <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                          {/* Chevron indicates open/closed state */}
                          {isExpanded
                            ? <ChevronDown className="w-4 h-4" />
                            : <ChevronRight className="w-4 h-4" />
                          }
                        </>
                      )}
                    </button>

                    {/* Child links — only shown when sidebar is open AND group is expanded */}
                    {sidebarOpen && isExpanded && (
                      <div className="ml-4 mt-1 space-y-1 border-l border-slate-800 pl-3">
                        {item.children.map((child) => (
                          // NavLink's className prop accepts a function — React Router
                          // calls it with { isActive: boolean } so we can style accordingly.
                          <NavLink
                            key={child.path}
                            to={child.path}
                            className={({ isActive }) =>
                              `block px-3 py-2 rounded-lg text-xs transition-all duration-200 ${
                                isActive
                                  ? 'text-indigo-400 bg-indigo-500/10'
                                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                              }`
                            }
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  // ---- DIRECT LINK ITEM (no children) ----
                  <NavLink
                    to={item.path}
                    end={item.exact} // end={true} means only active on exact URL match
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-indigo-500/20 text-indigo-400 shadow-sm'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </NavLink>
                )}
              </div>
            )
          })}
        </nav>

        {/* Sidebar footer — logged-in user info + logout */}
        <div className="border-t border-slate-800 px-3 py-4">
          <div className="flex items-center gap-3">
            {/* User avatar — initials inside a coloured circle */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <UserCircle className="w-5 h-5 text-white" />
            </div>

            {/* User name + role — only visible when sidebar is expanded */}
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                {/* user?.name — optional chaining: safe if user is null */}
                <p className="text-slate-200 text-xs font-medium truncate">{user?.name || 'Admin'}</p>
                <p className="text-slate-500 text-xs truncate">{user?.role || 'Administrator'}</p>
              </div>
            )}

            {/* Logout button */}
            {sidebarOpen && (
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-rose-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ======================================================
          MAIN CONTENT AREA (header + page content)
          flex-1: takes all remaining horizontal space after sidebar
          ====================================================== */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* TOP HEADER */}
        <header className="flex items-center gap-4 px-6 py-4 bg-slate-900 border-b border-slate-800 flex-shrink-0">
          {/* Search bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              {/* absolute positioning places the icon inside the input field */}
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Right side: notifications + avatar */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Bell notification icon with unread dot */}
            <button className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all">
              <Bell className="w-5 h-5" />
              {/* Red dot indicator for unread notifications */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full" />
            </button>

            {/* User avatar with initials */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center cursor-pointer">
              <span className="text-white text-xs font-semibold">
                {/* Take first letter of each word in the name, join, show max 2 chars */}
                {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AU'}
              </span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT — Outlet renders the currently matched child route */}
        {/* overflow-y-auto: only this area scrolls, sidebar and header stay fixed */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
