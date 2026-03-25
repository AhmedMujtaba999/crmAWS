// components/leads/LeadDetailModal.tsx — Lead Detail Full-Screen Modal
// ============================================================
// Opened when the user clicks a lead row or its detail button.
//
// Props it receives:
//   lead    — the lightweight Lead object from the list (name, phone, email,
//             address, source, status). Used for the header immediately.
//   onClose — called when the user clicks the backdrop or the X button.
//
// Internal data flow:
//   1. Modal opens instantly — header shows from `lead` prop (no API wait).
//   2. useLeadDetail(lead.lead_id) fires in the background.
//   3. Tab content shows a spinner until the detail loads, then renders.
//
// Tabs: Overview · Services · Finances · Notes
// (Email tab is a placeholder — email history is a future feature)
// ============================================================

import { useState, useEffect } from 'react'
// useEffect: runs a side-effect after render.
// We use it to listen for the Escape key so the user can close the modal
// by pressing Esc, which is standard behaviour for overlays.

import {
  X,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  Activity,
  User,
  Loader2,
  AlertCircle,
  CalendarClock,
  ReceiptText,
  Clock,
} from 'lucide-react'

import type { Lead } from '@/hooks/useLeads'
// import type: TypeScript-only import that is erased at compile time.
// We only need the Lead shape for type-checking — no runtime value needed.

import { useLeadDetail } from '@/hooks/useLeadDetail'
import LeadServicesTab from '@/components/leads/LeadServicesTab'

// ============================================================
// STATUS COLOR MAP — same as LeadsPage, duplicated here to keep
// the component self-contained (no shared constants file yet).
// ============================================================
const STATUS_COLORS: Record<string, string> = {
  New:         'bg-sky-500/20 text-sky-400 border border-sky-500/30',
  Contacted:   'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  Qualified:   'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  Proposal:    'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  Negotiation: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  Closed:      'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
}

// Tab names as a readonly tuple — `as const` tells TypeScript these are
// literal types ("Overview", "Services", etc.) not just generic strings.
// This lets us type `activeTab` as Tab instead of just string.
const TABS = ['Overview', 'Services', 'Finances', 'Notes', 'Email'] as const
type Tab = (typeof TABS)[number]
// (typeof TABS)[number] extracts the union type of all elements:
// "Overview" | "Services" | "Finances" | "Notes" | "Email"

// ============================================================
// PROPS INTERFACE
// ============================================================
interface Props {
  lead: Lead           // basic info from the list
  onClose: () => void  // called when user dismisses the modal
}

// ============================================================
// HELPER FUNCTIONS (defined outside component — they don't use
// any React state so they don't need to be inside the component)
// ============================================================

// Returns initials: "Ahmed Ali" → "AA", null → "?"
function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

// Formats a number as Indian Rupees: 85000 → "₹85,000" | null → "N/A"
// en-IN locale formats numbers with Indian comma placement (e.g. 1,00,000).
function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return 'N/A'
  return `₹${Number(amount).toLocaleString('en-IN')}`
}

// Formats an ISO timestamp into a readable date: "2024-03-07T10:30:00Z" → "7 Mar 2024"
// Returns '—' if the value is null/undefined.
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function LeadDetailModal({ lead, onClose }: Props) {

  // activeTab: which tab is currently selected
  const [activeTab, setActiveTab] = useState<Tab>('Overview')

  // ---- Fetch the rich detail data ----
  // useLeadDetail fires GET /admin/leads/:leadId immediately on mount.
  // The header renders from the `lead` prop while this is in flight.
  const { data: detail, isLoading, isError } = useLeadDetail(lead.lead_id)

  // ---- Close on Escape key ----
  // useEffect takes a function and a dependency array.
  //   - The function runs after every render where dependencies changed.
  //   - [] (empty array) means: run once after first render, never again.
  // We add a keydown listener and clean it up when the component unmounts.
  // The returned function is the "cleanup" — React calls it before the next
  // effect run or when the component is removed from the DOM.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])
  // [onClose] in the dependency array: re-register the listener if onClose changes
  // (it won't in practice since it's a stable function from the parent, but it's
  // correct to list it here per React's exhaustive-deps rule).

  // ============================================================
  // RENDER
  // ============================================================
  return (
    // fixed inset-0: covers the entire viewport (top/right/bottom/left all 0).
    // z-50: renders on top of all other content.
    // flex items-center justify-center: centers the modal card.
    // p-4: padding so the modal doesn't touch the viewport edge on small screens.
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* ---- Backdrop ---- */}
      {/* bg-slate-950/80: dark semi-transparent overlay */}
      {/* backdrop-blur-sm: blurs the page content behind the overlay */}
      {/* Clicking it calls onClose — standard overlay dismissal pattern */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* ---- Modal card ---- */}
      {/* relative: needed so the absolute backdrop doesn't cover the card */}
      {/* max-w-5xl: caps the card width on wide screens */}
      {/* h-[90vh]: 90% of the viewport height — leaves a gap at top and bottom */}
      {/* flex flex-col: stacks header → tabs → content vertically */}
      {/* overflow-hidden: clips children to the rounded corners */}
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden">

        {/* ============================================================
            HEADER — profile info shown immediately from the `lead` prop.
            No loading state here — we already have this data from the list.
            ============================================================ */}
        <div className="bg-gradient-to-r from-indigo-900/50 to-slate-900 border-b border-slate-800 px-6 py-5 flex-shrink-0">
          {/* flex-shrink-0: prevents this section from shrinking when the modal
              is short — only the tab content area should scroll/shrink. */}

          <div className="flex items-start gap-4">

            {/* Avatar — gradient circle with initials */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/30 flex-shrink-0">
              {getInitials(lead.name)}
            </div>

            {/* Name, status badge, contact info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white">{lead.name ?? '—'}</h2>
                {/* Status badge — color depends on the status string */}
                <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                  STATUS_COLORS[lead.status] ?? 'bg-slate-700 text-slate-300 border border-slate-600'
                }`}>
                  {lead.status}
                </span>
              </div>

              {/* Contact row */}
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {lead.phone && (
                  <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    {lead.phone}
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    {lead.email}
                  </div>
                )}
              </div>

              {/* Address */}
              {lead.address && (
                <div className="flex items-start gap-1.5 mt-1 text-slate-400 text-sm">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  {lead.address}
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 text-slate-400 rounded-xl hover:text-slate-200 hover:bg-slate-700 transition-all flex-shrink-0"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ---- Quick info bar (4 summary cards) ---- */}
          {/* Shows '...' while the detail API is loading */}
          <div className="mt-4 grid grid-cols-4 gap-3">
            {[
              {
                label: 'Linked Task',
                // detail?. is optional chaining — safe when detail is still null/undefined
                value: isLoading ? '…' : (detail?.task_title ?? 'No task yet'),
                icon: FileText,
              },
              {
                label: 'Source',
                value: lead.source ?? '—',
                icon: User,
              },
              {
                label: 'Total Estimate',
                value: isLoading ? '…' : formatCurrency(detail?.total_estimate),
                icon: DollarSign,
              },
              {
                // estimated_minutes comes from the lightweight lead prop (list data).
                // Format: "90 min" or "Not set" — "Not set" is a warning that the
                // admin needs to fill this before they can close the deal.
                label: 'Job Duration',
                value: lead.estimated_minutes != null ? `${lead.estimated_minutes} min` : 'Not set',
                icon: Clock,
              },
            ].map(item => (
              <div
                key={item.label}
                className="bg-slate-800/60 rounded-xl p-3 flex items-center gap-2.5"
              >
                <item.icon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-sm font-medium text-slate-200 truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================
            TAB BAR
            overflow-x-auto: allows horizontal scroll on very small screens
            so no tab is hidden.
            ============================================================ */}
        <div className="flex border-b border-slate-800 px-6 flex-shrink-0 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              // -mb-px: pulls the active border-b up by 1px so it sits on top
              // of the container's border-b, giving a connected "tab" look.
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ============================================================
            TAB CONTENT
            flex-1: takes all remaining vertical space after header + tabs.
            overflow-y-auto: only this area scrolls — header and tabs stay fixed.
            ============================================================ */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ---- Loading spinner ---- */}
          {isLoading && (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              <span className="ml-2.5 text-slate-400 text-sm">Loading details…</span>
            </div>
          )}

          {/* ---- Error state ---- */}
          {isError && (
            <div className="flex items-center gap-3 px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <p className="text-rose-400 text-sm">Could not load lead details. Please try again.</p>
            </div>
          )}

          {/* ---- Tab content — only rendered once data has loaded ---- */}
          {/* !isLoading && !isError && detail: all three must be true */}
          {!isLoading && !isError && detail && (
            <>

              {/* ================================================
                  OVERVIEW TAB
                  ================================================ */}
              {activeTab === 'Overview' && (
                <div className="space-y-4">

                  {/* Lead status card */}
                  <div className="bg-slate-800/50 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-4">
                      <Activity className="w-4 h-4 text-indigo-400" />
                      Lead Details
                    </h3>
                    <div>
                      {[
                        { label: 'Status',            value: lead.status },
                        { label: 'Status Details',    value: lead.status_detail ?? '—' },
                        { label: 'Source',            value: lead.source ?? '—' },
                        {
                          label: 'Job Duration',
                          // lead.estimated_minutes from the list data — not in detail API
                          value: lead.estimated_minutes != null
                            ? `${lead.estimated_minutes} minutes`
                            : 'Not set — required before closing',
                        },
                        { label: 'Created',           value: formatDate(detail.lead_created_at) },
                      ].map(item => (
                        <div
                          key={item.label}
                          className="flex items-start justify-between py-3 border-b border-slate-700/50 last:border-0"
                        >
                          <span className="text-sm text-slate-500 flex-shrink-0">{item.label}</span>
                          <span className="text-sm text-slate-200 text-right ml-4 max-w-[320px]">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Linked task card — only shown if a task exists */}
                  {detail.task_id && (
                    <div className="bg-slate-800/50 rounded-2xl p-5">
                      <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-4">
                        <CalendarClock className="w-4 h-4 text-amber-400" />
                        Linked Task
                      </h3>
                      <div>
                        {[
                          { label: 'Title',       value: detail.task_title ?? '—' },
                          { label: 'Status',      value: detail.task_status ?? '—' },
                          { label: 'Due Date',    value: formatDate(detail.due_date) },
                          { label: 'Description', value: detail.task_description ?? '—' },
                        ].map(item => (
                          <div
                            key={item.label}
                            className="flex items-start justify-between py-3 border-b border-slate-700/50 last:border-0"
                          >
                            <span className="text-sm text-slate-500 flex-shrink-0">{item.label}</span>
                            <span className="text-sm text-slate-200 text-right ml-4 max-w-[320px]">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quote summary card */}
                  <div className="bg-slate-800/50 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      Estimate
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Total from services</span>
                      <span className="text-2xl font-bold text-emerald-400">
                        {formatCurrency(detail.total_estimate)}
                      </span>
                    </div>
                  </div>

                </div>
              )}

              {/* ================================================
                  SERVICES TAB
                  ================================================ */}
              {activeTab === 'Services' && (
                <LeadServicesTab detail={detail} leadId={lead.lead_id} />
              )}

              {/* ================================================
                  FINANCES TAB
                  ================================================ */}
              {activeTab === 'Finances' && (
                <div className="space-y-4">
                  <div className="bg-slate-800/50 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-4">
                      <ReceiptText className="w-4 h-4 text-emerald-400" />
                      Financial Summary
                    </h3>

                    {/* Always-shown row: total estimate from services */}
                    <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                      <span className="text-sm text-slate-500">Total Estimate</span>
                      <span className="text-sm font-semibold text-emerald-400">
                        {formatCurrency(detail.total_estimate)}
                      </span>
                    </div>

                    {/* Invoice rows — only shown if an invoice has been raised */}
                    {detail.invoice_id ? (
                      <>
                        <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                          <span className="text-sm text-slate-500">Invoice Number</span>
                          <span className="text-sm text-slate-200">{detail.invoice_number ?? '—'}</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                          <span className="text-sm text-slate-500">Invoice Amount</span>
                          <span className="text-sm font-semibold text-slate-200">
                            {formatCurrency(detail.total_amount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                          <span className="text-sm text-slate-500">Invoice Status</span>
                          <span className="text-sm capitalize text-slate-200">
                            {detail.invoice_status ?? '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                          <span className="text-sm text-slate-500">Issued</span>
                          <span className="text-sm text-slate-200">
                            {formatDate(detail.invoice_issued_at)}
                          </span>
                        </div>
                        {detail.paid_at && (
                          <div className="flex items-center justify-between py-3">
                            <span className="text-sm text-slate-500">Paid</span>
                            <span className="text-sm font-medium text-emerald-400">
                              {formatDate(detail.paid_at)}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="py-10 text-center">
                        <ReceiptText className="w-9 h-9 text-slate-700 mx-auto mb-2" />
                        <p className="text-slate-500 text-sm">No invoice raised yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ================================================
                  NOTES TAB
                  ================================================ */}
              {activeTab === 'Notes' && (
                <div>
                  <div className="bg-slate-800/50 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-4">
                      <FileText className="w-4 h-4 text-amber-400" />
                      Notes
                    </h3>
                    {detail.notes ? (
                      // Pre-wrap preserves line breaks entered in the original notes field
                      <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-300 whitespace-pre-wrap min-h-[120px] leading-relaxed">
                        {detail.notes}
                      </div>
                    ) : (
                      <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 min-h-[120px] flex items-center justify-center">
                        <p className="text-slate-600 text-sm">No notes for this lead</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ================================================
                  EMAIL TAB — placeholder (future feature)
                  ================================================ */}
              {activeTab === 'Email' && (
                <div>
                  <div className="bg-slate-800/50 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-4">
                      <Mail className="w-4 h-4 text-indigo-400" />
                      Email Communication
                    </h3>
                    <div className="py-12 text-center">
                      <Mail className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">No emails yet</p>
                      <p className="text-slate-600 text-xs mt-1">
                        Email history with this lead will appear here
                      </p>
                    </div>
                    <button className="w-full py-2.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-sm hover:bg-indigo-500/30 transition-all">
                      Compose Email
                    </button>
                  </div>
                </div>
              )}

            </>
          )}
        </div>
      </div>
    </div>
  )
}
