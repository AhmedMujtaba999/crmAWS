// pages/LeadsPage.tsx — Leads List Screen
// ============================================================
// This is the main Leads screen rendered at /leads.
// It fetches all leads from GET /admin/leads via the useLeads hook,
// then renders: stat cards, search bar, selection banner, and the table.
//
// Data flow:
//   useLeads() → TanStack Query → GET /admin/leads → Lead[]
//   ↓
//   LeadsPage renders the table from that data
//   ↓
//   Local state (checkedIds, searchTerm) lives inside this component only
// ============================================================

import { useState, useMemo } from 'react'
// useState: local component state — values that React watches and re-renders on change.
// useMemo: memoization — only recomputes when its dependencies change.
//   Without useMemo, the filter would run on EVERY re-render (even when unrelated
//   state changes like typing in the search box 100 times rapidly).
//   With useMemo, the filter only re-runs when leads or searchTerm actually changes.

import {
  Plus,
  Lock,
  Handshake,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Filter,
  Download,
  Search,
  Star,
  TrendingUp,
  X,
  CheckCircle2,
  Users,
  AlertCircle,
  Clock,
  Package,
} from 'lucide-react'
// lucide-react: icon library — each named export is a React component.
// Usage: <Star className="w-5 h-5" /> renders a star icon at 20×20px.

import { useLeads, useCloseDeal } from '@/hooks/useLeads'
import type { Lead } from '@/hooks/useLeads'
import LeadDetailModal from '@/components/leads/LeadDetailModal'
import CreateLeadModal from '@/components/leads/CreateLeadModal'
// import type: TypeScript-only import — the type is erased at build time.
// This tells TypeScript: "I only need the Lead type for type-checking, not the
// runtime value." It's a minor optimization that keeps the JS bundle clean.

// ============================================================
// STATUS COLOR MAP
// ============================================================
// Each status maps to a Tailwind class string.
// Record<string, string> is a TypeScript type meaning:
//   an object where all keys are strings and all values are strings.
// We use it instead of a plain object type so TypeScript knows we can
// index into it with any string key — which we do with STATUS_COLORS[lead.status].
// The ?? fallback in the JSX handles any unknown status gracefully.
// ============================================================
const STATUS_COLORS: Record<string, string> = {
  New:         'bg-sky-500/20 text-sky-400 border border-sky-500/30',
  Contacted:   'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  Qualified:   'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  Proposal:    'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  Negotiation: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  Closed:      'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
  // After Close Deal the backend sets status = 'CLOSED' (uppercase).
  // Map it to the same indigo style so the badge still looks correct.
  CLOSED:      'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
}

// ============================================================
// STAT CARD DEFINITIONS
// ============================================================
// Defined as data (array of objects) rather than hardcoded JSX,
// so adding a new stat card only requires adding one entry here.
//
// count is typed as (leads: Lead[]) => number — a "function type":
//   takes one argument (a Lead array) and returns a number.
// We call it in JSX as: card.count(allLeads)
// ============================================================
const STAT_CARDS = [
  {
    label: 'Total Leads',
    icon: Users,
    iconBg: 'bg-indigo-500/20',
    iconText: 'text-indigo-400',
    count: (leads: Lead[]) => leads.length,
  },
  {
    label: 'Qualified',
    icon: Star,
    iconBg: 'bg-emerald-500/20',
    iconText: 'text-emerald-400',
    count: (leads: Lead[]) => leads.filter(l => l.status === 'Qualified').length,
  },
  {
    label: 'Negotiation',
    icon: TrendingUp,
    iconBg: 'bg-amber-500/20',
    iconText: 'text-amber-400',
    count: (leads: Lead[]) => leads.filter(l => l.status === 'Negotiation').length,
  },
  {
    label: 'Closed',
    icon: CheckCircle2,
    iconBg: 'bg-purple-500/20',
    iconText: 'text-purple-400',
    count: (leads: Lead[]) => leads.filter(l => l.status === 'Closed').length,
  },
]

// ============================================================
// LOADING SKELETON
// ============================================================
// Rendered while TanStack Query is fetching on first load.
// animate-pulse: Tailwind class that repeatedly fades the element
// in and out (opacity 0.5 → 1 → 0.5) to suggest content is loading.
// This matches the shape of the real page so there's no layout shift
// when data arrives.
// ============================================================
function LoadingSkeleton() {
  return (
    <div className="p-6">
      {/* Header area */}
      <div className="mb-6">
        <div className="h-8 w-20 bg-slate-800 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-44 bg-slate-800 rounded-lg animate-pulse" />

        {/* Stat card skeletons */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-20 animate-pulse" />
          ))}
        </div>
      </div>

      {/* Search bar skeleton */}
      <div className="h-10 w-80 bg-slate-900 border border-slate-800 rounded-xl animate-pulse mb-4" />

      {/* Table skeleton */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {/* Header row */}
        <div className="flex gap-4 px-4 py-3 border-b border-slate-800">
          {[40, 160, 100, 80, 80, 120, 140, 140].map((w, i) => (
            <div key={i} className={`h-3 bg-slate-800 rounded animate-pulse`} style={{ width: w }} />
          ))}
        </div>
        {/* Data rows */}
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-slate-800/50">
            <div className="w-4 h-4 bg-slate-800 rounded animate-pulse" />
            <div className="w-8 h-8 bg-slate-800 rounded-full animate-pulse flex-shrink-0" />
            <div className="flex-1 h-3 bg-slate-800 rounded animate-pulse" />
            <div className="w-28 h-3 bg-slate-800 rounded animate-pulse" />
            <div className="w-20 h-3 bg-slate-800 rounded animate-pulse" />
            <div className="w-20 h-5 bg-slate-800 rounded-lg animate-pulse" />
            <div className="w-32 h-3 bg-slate-800 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export default function LeadsPage() {

  // ---- Server state ----
  // useLeads() subscribes this component to the leads cache in TanStack Query.
  // When leads data changes (e.g. after a mutation), this component re-renders.
  //
  // Destructuring the return value and renaming with `as`:
  //   data: leads  →  renames 'data' to 'leads' for clarity
  //   isLoading    →  true only on first load (no cached data exists yet)
  //   isError      →  true if the query threw an error
  //   error        →  the Error object (or null if no error)
  const { data: leads, isLoading, isError, error } = useLeads()

  // Mutation that calls POST /tasks/close/:leadId on the backend.
  // Returns { isPending, isError, error, mutate } from TanStack Query.
  const closeDeal = useCloseDeal()

  // ---- Local UI state ----

  // selectedLead: which lead the user clicked to view details.
  // null = no modal open. Set to a Lead object to open the modal.
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  // showCreateModal: controls whether the Create Lead modal is visible.
  // true = modal open, false = closed. Toggled by the "Create Lead" button.
  const [showCreateModal, setShowCreateModal] = useState(false)

  // checkedIds: Set<string> — the set of lead_id values for checked rows.
  // We use a Set (not an array) because:
  //   - has(id) is O(1) vs array's includes() which is O(n)
  //   - Set automatically prevents duplicates
  //   - We often need to add/remove individual IDs without caring about order
  //
  // useState<Set<string>>(new Set()) means:
  //   - initial value: an empty Set
  //   - TypeScript knows it's always a Set<string>
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())

  // searchTerm: string — what the user has typed in the search input.
  // Empty string by default = no filter applied.
  const [searchTerm, setSearchTerm] = useState('')

  // ---- Derived/computed values ----

  // filteredLeads: the leads array after applying the search filter.
  // useMemo wraps this so it only recomputes when leads or searchTerm changes.
  // The second argument [leads, searchTerm] is the "dependency array" —
  // React will only call the function if one of these values changed since last render.
  const filteredLeads = useMemo(() => {
    if (!leads) return []               // still loading — return empty array
    if (!searchTerm.trim()) return leads // no search term — return everything

    const term = searchTerm.toLowerCase()
    return leads.filter(lead =>
      // ?. is "optional chaining" — safe property access when value might be null.
      // Without it: lead.name.toLowerCase() would throw if name is null.
      // With it: lead.name?.toLowerCase() returns undefined if name is null, so
      // undefined.includes(term) becomes false rather than throwing an error.
      lead.name?.toLowerCase().includes(term) ||
      lead.email?.toLowerCase().includes(term) ||
      lead.phone?.includes(term)
    )
  }, [leads, searchTerm])

  const anyChecked = checkedIds.size > 0   // boolean: at least one row is checked
  const checkedCount = checkedIds.size     // how many rows are checked

  // When exactly 1 lead is checked, find it so we can inspect its fields.
  // Array.from(checkedIds)[0] gets the first (only) item in the Set.
  const singleSelectedLead = checkedIds.size === 1
    ? filteredLeads.find(l => l.lead_id === Array.from(checkedIds)[0]) ?? null
    : null

  // Blocking reasons for Close Deal — both must pass before the button activates.
  // We check these on the lightweight list data so there's no extra API call.
  const missingServices  = singleSelectedLead !== null && singleSelectedLead.services_count === 0
  const missingDuration  = singleSelectedLead !== null && singleSelectedLead.estimated_minutes == null

  // The button is only active when 1 lead is checked AND both conditions pass
  const canCloseDeal = checkedIds.size === 1 && !missingServices && !missingDuration

  // ---- Handlers ----

  // Toggle one row's checkbox on/off
  const toggleCheck = (id: string) => {
    setCheckedIds(prev => {
      // React requires you to create a NEW Set rather than mutating the existing one.
      // Why: React tracks state changes by checking if the reference changed
      //   (same object in memory = no change detected → no re-render).
      //   Mutating prev directly doesn't change the reference, so React wouldn't
      //   know to re-render.
      // Solution: new Set(prev) copies all values into a fresh Set, then we modify it.
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Toggle all visible (filtered) rows
  const toggleAll = () => {
    // "All checked" means every filtered row is in checkedIds.
    const allChecked = filteredLeads.every(l => checkedIds.has(l.lead_id))

    setCheckedIds(prev => {
      const next = new Set(prev)
      if (allChecked) {
        // All were checked — uncheck all filtered rows
        filteredLeads.forEach(l => next.delete(l.lead_id))
      } else {
        // Some/none were checked — check all filtered rows
        filteredLeads.forEach(l => next.add(l.lead_id))
      }
      return next
    })
  }

  // Clear all checked rows (used by the X button on the selection banner)
  const clearChecked = () => setCheckedIds(new Set())

  // Close Deal handler — calls POST /tasks/close/:leadId for the single selected lead.
  // The button is only rendered active when canCloseDeal is true, so by the time
  // this handler runs both conditions (services + duration) are guaranteed to pass.
  const handleCloseDeal = () => {
    if (!canCloseDeal) return
    const leadId = Array.from(checkedIds)[0]
    closeDeal.mutate(leadId, {
      onSuccess: () => clearChecked(),
    })
  }

  // Avatar initials helper
  // Takes "Ahmed Ali" → "AA", null/empty → "?"
  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  // ---- Render: Loading ----
  if (isLoading) return <LoadingSkeleton />

  // ---- Render: Error ----
  if (isError) {
    // error is typed as Error | null by TanStack Query.
    // We cast to any to access .response.data.error (the Axios error shape).
    const message = (error as any)?.response?.data?.error
      ?? 'Could not load leads. Please refresh the page.'

    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="flex items-center gap-3 px-6 py-4 bg-rose-500/10 border border-rose-500/30 rounded-xl">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <div>
            <p className="text-rose-400 font-medium text-sm">Failed to load leads</p>
            <p className="text-rose-400/70 text-xs mt-0.5">{message}</p>
          </div>
        </div>
      </div>
    )
  }

  // At this point: isLoading is false, isError is false.
  // data is guaranteed to be Lead[] (not undefined).
  // ?? [] is a fallback just to satisfy TypeScript's strictness.
  const allLeads = leads ?? []

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="p-6 min-h-full">

      {/* ======================================================
          HEADER — title, subtitle, action buttons
          ====================================================== */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Leads</h1>
            {/* Shows live counts from the server data */}
            <p className="text-slate-400 text-sm mt-1">
              {allLeads.length} total leads · {checkedCount} selected
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Close Deal — only active when 1 lead is selected AND it has both
                services attached AND an estimated_minutes value set.
                canCloseDeal encodes all three conditions. */}
            <button
              onClick={handleCloseDeal}
              disabled={!canCloseDeal || closeDeal.isPending}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                canCloseDeal && !closeDeal.isPending
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/30 cursor-pointer'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-40 border border-slate-700'
              }`}
            >
              {closeDeal.isPending
                ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                : canCloseDeal
                  ? <Handshake className="w-4 h-4" />
                  : <Lock className="w-4 h-4" />
              }
              <span>{closeDeal.isPending ? 'Closing…' : 'Close Deal'}</span>
              {checkedIds.size === 0 && (
                <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 ml-1">
                  Select lead first
                </span>
              )}
              {checkedIds.size > 1 && (
                <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 ml-1">
                  Select 1 only
                </span>
              )}
            </button>

            {/* Create Lead — opens the CreateLeadModal */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/30"
            >
              <Plus className="w-4 h-4" />
              <span>Create Lead</span>
            </button>
          </div>
        </div>

        {/* ---- Stat Cards ---- */}
        {/* grid-cols-4: 4 equal columns side by side */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          {STAT_CARDS.map(card => {
            // Card's icon is stored as a component reference (e.g. Star).
            // Assigning to Icon (capital letter) lets JSX treat it as a component.
            // <card.icon /> would NOT work — JSX only recognises capital-letter components.
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3"
              >
                {/* Icon box */}
                <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${card.iconText}`} />
                </div>
                {/* Count + label */}
                <div>
                  {/* card.count(allLeads) calls the function — e.g. leads.filter(...).length */}
                  <p className="text-2xl font-bold text-white">{card.count(allLeads)}</p>
                  <p className="text-xs text-slate-500">{card.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ======================================================
          SEARCH & FILTER BAR
          ====================================================== */}
      <div className="flex items-center gap-3 mb-4">
        {/* Search input — client-side filter, no API call on each keystroke */}
        <div className="relative flex-1 max-w-sm">
          {/* absolute: positions the icon relative to the nearest positioned parent */}
          {/* top-1/2 -translate-y-1/2: vertically centers the icon inside the input */}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchTerm}
            // e.target.value: the current text inside the input field
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter and Export buttons — placeholder, not wired up yet */}
        <button className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 rounded-xl text-sm transition-all">
          <Filter className="w-4 h-4" />
          Filter
        </button>
        <button className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 rounded-xl text-sm transition-all">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* ======================================================
          SELECTION BANNER
          Only rendered when at least one row is checked.
          The && operator: condition && <JSX> only renders the JSX
          when condition is true. It's React's inline if-statement.
          ====================================================== */}
      {anyChecked && (
        <div className="mb-3 space-y-2">
          {/* Selection count banner */}
          <div className="flex items-center gap-3 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span className="text-indigo-300 text-sm">
              {checkedCount} lead{checkedCount > 1 ? 's' : ''} selected
              {checkedCount === 1 && canCloseDeal && ' — click "Close Deal" to proceed'}
              {checkedCount > 1 && ' — select only 1 to close a deal'}
            </span>
            <button
              onClick={clearChecked}
              className="ml-auto text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Blocking reason banners — shown when 1 lead is selected but conditions aren't met.
              Each banner identifies exactly what needs to be fixed.
              The admin can open the lead detail modal (click the name) to resolve these. */}
          {checkedIds.size === 1 && missingServices && (
            <div className="flex items-center gap-3 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <Package className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-amber-300 text-sm">
                No services attached — open the lead and add at least one service before closing
              </span>
            </div>
          )}
          {checkedIds.size === 1 && missingDuration && (
            <div className="flex items-center gap-3 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-amber-300 text-sm">
                Estimated job duration not set — open the lead and set a duration before closing
              </span>
            </div>
          )}

          {/* API error banner (e.g. unexpected server-side rejection) */}
          {closeDeal.isError && (
            <div className="flex items-center gap-3 px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-xl">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span className="text-rose-300 text-sm">
                {(closeDeal.error as any)?.response?.data?.error ?? 'Failed to close deal. Please try again.'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ======================================================
          LEADS TABLE
          overflow-x-auto: enables horizontal scrolling on small
          screens so the table never breaks the layout.
          ====================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">

            {/* ---- Column headers ---- */}
            <thead>
              <tr className="border-b border-slate-800">

                {/* Select-all checkbox */}
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    // Checked when every visible row is in checkedIds.
                    // filteredLeads.every() returns true only if the callback
                    // returns true for every element in the array.
                    checked={
                      filteredLeads.length > 0 &&
                      filteredLeads.every(l => checkedIds.has(l.lead_id))
                    }
                    onChange={toggleAll}
                    className="w-4 h-4 accent-indigo-500 cursor-pointer"
                  />
                </th>

                {/* Column header labels */}
                {['Name', 'Phone', 'Source', 'Status', 'Status Details', 'Email', 'Address'].map(col => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}

                {/* Empty header for the detail-button column */}
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>

            {/* ---- Data rows ---- */}
            <tbody className="divide-y divide-slate-800">
              {filteredLeads.map(lead => (
                <tr
                  key={lead.lead_id}
                  // Highlight the row in indigo if it's checked, else subtle hover
                  className={`transition-all duration-150 ${
                    checkedIds.has(lead.lead_id) ? 'bg-indigo-500/5' : 'hover:bg-slate-800/50'
                  }`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={checkedIds.has(lead.lead_id)}
                      onChange={() => toggleCheck(lead.lead_id)}
                      className="w-4 h-4 accent-indigo-500 cursor-pointer"
                    />
                  </td>

                  {/* Name + avatar — clicking opens the detail modal */}
                  <td
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <div className="flex items-center gap-2">
                      {/* Gradient circle with initials */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {getInitials(lead.name)}
                      </div>
                      {/* ?? '—' is the nullish coalescing operator:
                          returns the right side only if the left side is null or undefined.
                          So lead.name ?? '—' shows the name if it exists, else a dash. */}
                      <span className="text-slate-200 text-sm font-medium whitespace-nowrap hover:text-indigo-400 transition-colors">
                        {lead.name ?? '—'}
                      </span>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-slate-400 text-sm whitespace-nowrap">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      {lead.phone ?? '—'}
                    </div>
                  </td>

                  {/* Source */}
                  <td className="px-4 py-3 text-slate-400 text-sm whitespace-nowrap">
                    {lead.source ?? '—'}
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-3">
                    {/* STATUS_COLORS[lead.status] looks up the class string for this status.
                        If status is unknown (not in the map), the ?? fallback applies. */}
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                      STATUS_COLORS[lead.status] ?? 'bg-slate-700 text-slate-300 border border-slate-600'
                    }`}>
                      {lead.status ?? '—'}
                    </span>
                  </td>

                  {/* Status details — truncated with tooltip via title attribute */}
                  <td
                    className="px-4 py-3 text-slate-400 text-sm max-w-[180px] truncate"
                    title={lead.status_detail ?? ''}
                  >
                    {lead.status_detail ?? '—'}
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate max-w-[140px]" title={lead.email ?? ''}>
                        {lead.email ?? '—'}
                      </span>
                    </div>
                  </td>

                  {/* Address */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate max-w-[140px]" title={lead.address ?? ''}>
                        {lead.address ?? '—'}
                      </span>
                    </div>
                  </td>

                  {/* Detail button — opens the full detail modal */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedLead(lead)}
                      className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all hover:scale-110"
                      title="View lead details"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ---- Empty state ---- */}
          {/* Shown when the array is empty — either no leads exist or none match the search */}
          {filteredLeads.length === 0 && (
            <div className="py-16 text-center">
              <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">
                {searchTerm ? 'No leads match your search' : 'No leads yet'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-indigo-400 text-xs hover:text-indigo-300 transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================
          LEAD DETAIL MODAL
          Rendered on top of everything when a lead is selected.
          selectedLead && <...> — only renders the modal when selectedLead
          is a non-null Lead object. When onClose is called, setSelectedLead(null)
          removes the modal from the DOM. TanStack Query keeps the cache so
          re-opening the same lead is instant — no second network request.
          ====================================================== */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}

      {/* ======================================================
          CREATE LEAD MODAL
          showCreateModal && <...> renders the modal only when the
          "Create Lead" button has been clicked. onClose sets it back
          to false. onSuccess is called by the modal after a successful
          POST — TanStack Query auto-refreshes the list via invalidateQueries.
          ====================================================== */}
      {showCreateModal && (
        <CreateLeadModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}

    </div>
  )
}
