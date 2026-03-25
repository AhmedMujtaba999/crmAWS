// pages/EmployeesPage.tsx — Employee List Page
// ============================================================
// Mounted at /employees. Shows all employees as a searchable card grid.
// Clicking a card navigates to /employees/:id for the detail view.
//
// Data: useEmployees() from the existing hook — GET /employees.
// Search: client-side filter on name, role, employment_type.
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
// useNavigate: hook that returns a function to programmatically change the URL.
// We call navigate('/employees/123') when the user clicks a card.

import {
  Search,
  Loader2,
  AlertCircle,
  Users,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Briefcase,
  Phone,
  Mail,
} from 'lucide-react'

import { useEmployees } from '@/hooks/useEmployees'

// ============================================================
// CONSTANTS
// ============================================================

// Maps role strings to display labels.
// Record<string, string> means: an object whose keys are strings and values are strings.
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  TECHNICIAN: 'Technician',
  MANAGER: 'Manager',
  SALES: 'Sales',
}

// Color classes for the role badge pill.
// Each entry is a Tailwind class string.
const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-500/20 text-purple-400',
  TECHNICIAN: 'bg-blue-500/20 text-blue-400',
  MANAGER: 'bg-amber-500/20 text-amber-400',
  SALES: 'bg-emerald-500/20 text-emerald-400',
}

// ============================================================
// HELPER — generate initials avatar background colour
// ============================================================
// We pick a colour based on the first character of the name so the
// same employee always gets the same avatar colour.
const AVATAR_COLOURS = [
  'from-indigo-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-sky-600',
]

function avatarGradient(name: string): string {
  // charCodeAt(0) returns the Unicode number of the first character.
  // Modulo (%) gives us a number in the range 0..AVATAR_COLOURS.length-1.
  const idx = name.charCodeAt(0) % AVATAR_COLOURS.length
  return AVATAR_COLOURS[idx]
}

// ============================================================
// EMPLOYEE CARD
// ============================================================
// Receives a single employee object and a click handler.
// Clicking anywhere on the card navigates to the detail page.
interface EmployeeCardProps {
  employee: {
    id: number | string
    name: string
    role: string | null
    employment_type: string | null
    hourly_rate: number | null
    is_active: boolean
    phone: string | null
    email: string | null
  }
  onClick: () => void
}

function EmployeeCard({ employee, onClick }: EmployeeCardProps) {
  // Derive initials: split name by spaces, take first letter of each word,
  // join, uppercase, then slice to max 2 characters.
  // e.g. "Ravi Kumar Singh" → "RK"
  const initials = employee.name
    .split(' ')
    .map(w => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const roleLabel = employee.role
    ? (ROLE_LABELS[employee.role] ?? employee.role)
    : null

  const roleColor = employee.role
    ? (ROLE_COLORS[employee.role] ?? 'bg-slate-500/20 text-slate-400')
    : 'bg-slate-500/20 text-slate-400'

  return (
    <button
      onClick={onClick}
      // group: Tailwind's group modifier — lets child elements respond to
      // hover state on this parent using group-hover: prefix.
      className="group w-full text-left bg-slate-900 border border-slate-800
        hover:border-indigo-500/50 hover:bg-slate-900/80
        rounded-2xl p-5 transition-all duration-200
        flex flex-col gap-4"
    >
      {/* Top row: avatar + name + status */}
      <div className="flex items-start gap-3">
        {/* Initials avatar — circular gradient */}
        <div
          className={`flex-shrink-0 w-11 h-11 rounded-xl
            bg-gradient-to-br ${avatarGradient(employee.name)}
            flex items-center justify-center shadow-lg`}
        >
          <span className="text-white text-sm font-bold">{initials}</span>
        </div>

        {/* Name + employment type */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-100 truncate leading-tight">
            {employee.name}
          </p>
          {employee.employment_type && (
            <p className="text-xs text-slate-500 mt-0.5">{employee.employment_type}</p>
          )}
        </div>

        {/* Active / inactive status dot — top-right corner */}
        <div className="flex-shrink-0">
          {employee.is_active ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400" />
          )}
        </div>
      </div>

      {/* Role badge */}
      {roleLabel && (
        <span
          className={`self-start text-xs font-medium px-2.5 py-1 rounded-lg ${roleColor}`}
        >
          {roleLabel}
        </span>
      )}

      {/* Contact info row */}
      <div className="flex flex-col gap-1.5">
        {employee.phone && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Phone className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{employee.phone}</span>
          </div>
        )}
        {employee.email && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Mail className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{employee.email}</span>
          </div>
        )}
        {employee.hourly_rate != null && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Briefcase className="w-3 h-3 flex-shrink-0" />
            <span>₹{employee.hourly_rate}/hr</span>
          </div>
        )}
      </div>

      {/* "View details" footer row — visible on hover */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-3 mt-auto">
        <span className="text-xs text-slate-600 group-hover:text-indigo-400 transition-colors">
          View details
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-indigo-400
          group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  )
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export default function EmployeesPage() {
  const navigate = useNavigate()

  // Local search state — filters the displayed cards
  const [search, setSearch] = useState('')

  const { data: employees, isLoading, isError } = useEmployees()

  // ---- LOADING STATE ----
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Loading employees…</p>
        </div>
      </div>
    )
  }

  // ---- ERROR STATE ----
  if (isError || !employees) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <AlertCircle className="w-8 h-8 text-rose-400" />
          <p className="text-sm">Failed to load employees. Please refresh.</p>
        </div>
      </div>
    )
  }

  // ---- FILTER ----
  // Case-insensitive match on name, role, or employment_type
  const filtered = search.trim() === ''
    ? employees
    : employees.filter(e => {
        const q = search.toLowerCase()
        return (
          e.name.toLowerCase().includes(q) ||
          (e.role?.toLowerCase().includes(q) ?? false) ||
          (e.employment_type?.toLowerCase().includes(q) ?? false)
        )
      })

  // Counts for the subtitle
  const activeCount = employees.filter(e => e.is_active).length

  return (
    <div className="p-6 max-w-7xl">

      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">Employee Details</h1>
        </div>
        <p className="text-xs text-slate-500 ml-11">
          {employees.length} employees total · {activeCount} active
        </p>
      </div>

      {/* Search bar + result count */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          {/* The icon is positioned inside the input using CSS absolute positioning.
              The parent div has position:relative, so the absolute child positions
              itself relative to the parent, not the whole page. */}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, role or type…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl
              pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500
              focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        {search && (
          <span className="text-xs text-slate-500">
            {filtered.length} of {employees.length} shown
          </span>
        )}
      </div>

      {/* Employee grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-600">
          <Users className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm">No employees match your search</p>
        </div>
      ) : (
        // Responsive grid:
        // - 1 column on small screens
        // - 2 columns on medium (≥768px)
        // - 3 columns on large (≥1024px)
        // - 4 columns on extra-large (≥1280px)
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(emp => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              // When clicked, navigate to the detail page with this employee's ID
              onClick={() => navigate(`/employees/${emp.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
