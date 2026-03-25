// components/leads/CreateLeadModal.tsx — Create Lead Form Modal
// ============================================================
// Opens when the admin clicks "Create Lead" on the Leads page.
// Three sections:
//   1. Customer Details  — name, phone, email, address
//   2. Lead Details      — source, status, status_detail, notes
//   3. Services (optional) — quotation line items, each with
//      quantity and unit price. Admin can pick from the org's
//      service catalog OR type a custom service name. Custom
//      services are created in the same DB transaction as the
//      lead so everything commits or rolls back together.
//
// Body shape sent to POST /leads:
//   {
//     customer: { name, phone, email, address },
//     lead:     { source, status, status_detail, notes },
//     services: [                              ← optional
//       { service_id, quantity, unit_price }   ← existing catalog service
//       { service_name, quantity, unit_price } ← new custom service
//     ]
//   }
// ============================================================

import { useRef, useState } from 'react'
// useRef: creates a mutable container whose .current value persists across
// re-renders without causing a re-render when it changes.
// We use it here as a simple counter to generate unique IDs for service rows
// without adding them to state (which would trigger unnecessary re-renders).

import {
  X, User, Phone, Mail, MapPin, Tag, FileText,
  Loader2, AlertCircle, Plus, Trash2, Package,
  ChevronLeft, Clock,
} from 'lucide-react'

import { useCreateLead } from '@/hooks/useLeads'
import type { CreateLeadPayload, LeadServiceLine } from '@/hooks/useLeads'
import { useServices } from '@/hooks/useServices'

// Valid lead sources
const SOURCES = ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Trade Show', 'Other']

// Valid lead statuses — matches STATUS_COLORS in LeadsPage
const STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed']

// Sentinel value used in the <select> dropdown to represent "Other (custom)"
// Any string that can never be a valid numeric ID works here
const OTHER_VALUE = '__other__'

// ============================================================
// ServiceLine — local state shape for each row in the services section
// ============================================================
// This is separate from LeadServiceLine (the API payload type) because
// the UI needs more fields (rowId, mode, custom_name) to render the
// form controls. On submit we transform this into LeadServiceLine[].
interface ServiceLine {
  rowId: string             // unique key for React's list rendering (not sent to API)
  mode: 'existing' | 'custom'
  service_id: string | null // UUID — filled when mode === 'existing'
  custom_name: string       // filled when mode === 'custom'
  quantity: number
  unit_price: number
}

const emptyLine = (rowId: string): ServiceLine => ({
  rowId,
  mode: 'existing',
  service_id: null,
  custom_name: '',
  quantity: 1,
  unit_price: 0,
})

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateLeadModal({ onClose, onSuccess }: Props) {

  // ---- Form state ----
  const [form, setForm] = useState<Omit<CreateLeadPayload, 'services'>>({
    customer: { name: '', phone: '', email: '', address: '' },
    lead: { source: 'Website', status: 'New', status_detail: '', notes: '' },
  })

  // Service rows — starts empty, user adds rows with "Add Service" button
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([])

  // Auto-incrementing counter for unique row IDs.
  // useRef because we want it to survive re-renders without triggering them.
  // String(nextRowId.current++) gives "0", "1", "2", ... as IDs.
  const nextRowId = useRef(0)

  const { mutate: createLead, isPending, error } = useCreateLead()

  // services catalog from GET /services
  const { data: catalog = [] } = useServices()
  // data: catalog = []  →  destructure 'data', rename it to 'catalog',
  // with a default of [] so we never have to null-check it

  // ---- Patch helpers ----
  const updateCustomer = (patch: Partial<CreateLeadPayload['customer']>) =>
    setForm(prev => ({ ...prev, customer: { ...prev.customer, ...patch } }))

  const updateLead = (patch: Partial<CreateLeadPayload['lead']>) =>
    setForm(prev => ({ ...prev, lead: { ...prev.lead, ...patch } }))

  // ---- Service row helpers ----
  const addServiceLine = () => {
    const rowId = String(nextRowId.current++)
    // Spread into a new array — React requires a new reference to detect the change
    setServiceLines(prev => [...prev, emptyLine(rowId)])
  }

  const removeServiceLine = (rowId: string) => {
    // filter returns a new array that excludes the removed row
    setServiceLines(prev => prev.filter(l => l.rowId !== rowId))
  }

  // updateServiceLine: patches one field on one row by rowId.
  // Partial<ServiceLine> means any subset of ServiceLine's fields.
  const updateServiceLine = (rowId: string, patch: Partial<ServiceLine>) => {
    setServiceLines(prev =>
      prev.map(line =>
        // Only apply the patch to the row that matches rowId
        line.rowId === rowId ? { ...line, ...patch } : line
      )
    )
  }

  // ---- Derived values ----

  // Subtotal: sum of (quantity × unit_price) for all service rows
  const subtotal = serviceLines.reduce(
    (sum, l) => sum + l.quantity * l.unit_price,
    0  // starting accumulator value
  )

  // ---- Submit ----
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Transform ServiceLine[] → LeadServiceLine[] (the API payload shape).
    // Filter out any incomplete rows:
    //   - 'existing' mode rows where no service was selected (service_id still null)
    //   - 'custom' mode rows where the name was left blank
    const servicesPayload: LeadServiceLine[] = serviceLines
      .filter(l =>
        l.mode === 'existing' ? l.service_id !== null : l.custom_name.trim() !== ''
      )
      .map(l =>
        l.mode === 'existing'
          ? { service_id: l.service_id!, quantity: l.quantity, unit_price: l.unit_price }
          : { service_name: l.custom_name.trim(), quantity: l.quantity, unit_price: l.unit_price }
      )

    const payload: CreateLeadPayload = {
      ...form,
      // Only include services array if there are valid lines.
      // Sending an empty array is fine but sending undefined keeps the payload clean.
      services: servicesPayload.length > 0 ? servicesPayload : undefined,
    }

    createLead(payload, {
      onSuccess: () => {
        onSuccess()
        onClose()
      },
    })
  }

  const errorMessage = error
    ? (error as any)?.response?.data?.error ?? 'Failed to create lead. Please try again.'
    : null

  // Shared input class
  const inputClass =
    'w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors'

  const labelClass = 'text-xs text-slate-400 mb-1.5 block font-medium'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal — wider than before to accommodate service rows */}
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Create Lead</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Creates a customer record and an associated lead
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <p className="text-sm text-rose-400">{errorMessage}</p>
          </div>
        )}

        {/* Scrollable form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 overflow-y-auto max-h-[75vh]">

          {/* ================================================
              SECTION 1 — Customer Details
              ================================================ */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                Customer Details
              </span>
            </div>
            <div className="space-y-3">

              <div>
                <label className={labelClass}>
                  Customer Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text" required placeholder="e.g. Ahmed Ali"
                  value={form.customer.name}
                  onChange={e => updateCustomer({ name: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`${labelClass} flex items-center gap-1`}>
                    <Phone className="w-3 h-3" /> Phone
                  </label>
                  <input
                    type="tel" placeholder="+91 98765 43210"
                    value={form.customer.phone}
                    onChange={e => updateCustomer({ phone: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={`${labelClass} flex items-center gap-1`}>
                    <Mail className="w-3 h-3" /> Email
                  </label>
                  <input
                    type="email" placeholder="customer@example.com"
                    value={form.customer.email}
                    onChange={e => updateCustomer({ email: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={`${labelClass} flex items-center gap-1`}>
                  <MapPin className="w-3 h-3" /> Address
                </label>
                <input
                  type="text" placeholder="Street, City, State"
                  value={form.customer.address}
                  onChange={e => updateCustomer({ address: e.target.value })}
                  className={inputClass}
                />
              </div>

            </div>
          </div>

          <div className="border-t border-slate-800" />

          {/* ================================================
              SECTION 2 — Lead Details
              ================================================ */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                Lead Details
              </span>
            </div>
            <div className="space-y-3">

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Source</label>
                  <select
                    value={form.lead.source}
                    onChange={e => updateLead({ source: e.target.value })}
                    className={inputClass}
                  >
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select
                    value={form.lead.status}
                    onChange={e => updateLead({ status: e.target.value })}
                    className={inputClass}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Status Detail</label>
                <input
                  type="text" placeholder="e.g. Waiting for site survey confirmation"
                  value={form.lead.status_detail}
                  onChange={e => updateLead({ status_detail: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={`${labelClass} flex items-center gap-1`}>
                  <FileText className="w-3 h-3" /> Notes
                </label>
                <textarea
                  rows={2} placeholder="Any initial notes about this lead..."
                  value={form.lead.notes}
                  onChange={e => updateLead({ notes: e.target.value })}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Estimated duration — optional, pre-fills the AssignModal when scheduling */}
              <div>
                <label className={`${labelClass} flex items-center gap-1`}>
                  <Clock className="w-3 h-3" /> Estimated Duration (minutes)
                </label>
                <input
                  type="number"
                  min={15}
                  max={480}
                  step={15}
                  placeholder="e.g. 60"
                  // ?? '' converts undefined (field not set) to an empty string so the
                  // input shows a placeholder instead of displaying the number "0"
                  value={form.lead.estimated_minutes ?? ''}
                  onChange={e =>
                    // Number(e.target.value) converts the string to a number.
                    // If the field is cleared (empty string → NaN), we pass undefined
                    // so the field is simply omitted from the payload.
                    updateLead({ estimated_minutes: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className={inputClass}
                />
                <p className="text-[10px] text-slate-600 mt-1">
                  Optional — pre-fills the job duration when assigning this lead to a worker
                </p>
              </div>

            </div>
          </div>

          <div className="border-t border-slate-800" />

          {/* ================================================
              SECTION 3 — Services (optional quotation)
              ================================================ */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Services
                </span>
                {/* Visual cue that the whole section is optional */}
                <span className="text-xs text-slate-600 font-normal normal-case tracking-normal">
                  — optional quotation
                </span>
              </div>

              {/* "Add Service" button — adds an empty row to serviceLines */}
              <button
                type="button"
                onClick={addServiceLine}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-xs font-medium transition-all"
              >
                <Plus className="w-3 h-3" />
                Add Service
              </button>
            </div>

            {/* Column headers — only show when there are rows */}
            {serviceLines.length > 0 && (
              <div className="grid grid-cols-[1fr_64px_88px_32px] gap-2 mb-1.5 px-1">
                <span className="text-xs text-slate-600">Service</span>
                <span className="text-xs text-slate-600">Qty</span>
                <span className="text-xs text-slate-600">Unit Price</span>
                <span />
              </div>
            )}

            {/* Service rows */}
            <div className="space-y-2">
              {serviceLines.map(line => (
                <div key={line.rowId} className="space-y-1.5">

                  {/* Main row: [service picker] [qty] [price] [delete] */}
                  <div className="grid grid-cols-[1fr_64px_88px_32px] gap-2 items-start">

                    {/* ---- Service picker ---- */}
                    {line.mode === 'existing' ? (
                      // Show the dropdown when mode is 'existing'
                      <select
                        value={line.service_id ?? ''}
                        onChange={e => {
                          const val = e.target.value
                          if (val === OTHER_VALUE) {
                            // Switch this row to custom mode
                            updateServiceLine(line.rowId, { mode: 'custom', service_id: null })
                          } else {
                            // val is already the UUID string from the option's value —
                            // do NOT parseInt() it; that would strip the UUID to just its
                            // leading digits and cause a DB type error on the server
                            updateServiceLine(line.rowId, { service_id: val || null })
                          }
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                      >
                        {/* Placeholder option — shown when nothing is selected yet */}
                        <option value="">Select service…</option>

                        {/* Catalog services — fetched from GET /services */}
                        {catalog.map(svc => (
                          <option key={svc.id} value={svc.id}>{svc.name}</option>
                        ))}

                        {/* Divider + "Other" option at the bottom of the list */}
                        <option disabled>──────────────</option>
                        <option value={OTHER_VALUE}>Other (new service)</option>
                      </select>
                    ) : (
                      // Show text input when mode is 'custom'
                      // The input is styled to look the same as the select above
                      <div className="flex items-center gap-1">
                        {/* Back button — switches row back to 'existing' mode */}
                        <button
                          type="button"
                          onClick={() => updateServiceLine(line.rowId, { mode: 'existing', custom_name: '', service_id: null })}
                          className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors p-1"
                          title="Back to catalog"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="text"
                          autoFocus
                          placeholder="Type service name…"
                          value={line.custom_name}
                          onChange={e => updateServiceLine(line.rowId, { custom_name: e.target.value })}
                          className="w-full bg-slate-800 border border-emerald-500/50 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>
                    )}

                    {/* Quantity */}
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={line.quantity}
                      onChange={e => updateServiceLine(line.rowId, { quantity: Math.max(1, Number(e.target.value)) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-2.5 text-sm text-slate-200 text-center focus:outline-none focus:border-indigo-500 transition-colors"
                    />

                    {/* Unit price */}
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0"
                      value={line.unit_price === 0 ? '' : line.unit_price}
                      onChange={e => updateServiceLine(line.rowId, { unit_price: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-2.5 text-sm text-slate-200 text-right focus:outline-none focus:border-indigo-500 transition-colors"
                    />

                    {/* Remove row button */}
                    <button
                      type="button"
                      onClick={() => removeServiceLine(line.rowId)}
                      className="flex items-center justify-center w-8 h-[42px] text-slate-600 hover:text-rose-400 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Row subtotal — shown per line so the admin can see the line total */}
                  {(line.quantity > 0 && line.unit_price > 0) && (
                    <p className="text-xs text-slate-600 text-right pr-10">
                      Line total: ₹{(line.quantity * line.unit_price).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Subtotal footer — only shown when at least one valid row exists */}
            {serviceLines.length > 0 && (
              <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3">
                <span className="text-xs text-slate-500">Quotation subtotal</span>
                <span className="text-sm font-semibold text-white">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {/* Empty state — shown when section is collapsed (no rows added yet) */}
            {serviceLines.length === 0 && (
              <p className="text-xs text-slate-600 py-2">
                No services added. Click "Add Service" to build a quotation.
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 rounded-xl text-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isPending}
              className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
              ) : (
                'Create Lead'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
