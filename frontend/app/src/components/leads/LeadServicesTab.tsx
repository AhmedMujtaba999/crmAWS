// components/leads/LeadServicesTab.tsx — Services Tab for Lead Detail Modal
// ============================================================
// Renders the list of services attached to a lead, with:
//   - Remove button on each row  (DELETE /lead-services/:leadId/:serviceId)
//   - Inline add form            (POST /lead-services, optional POST /services)
//
// The add form supports two modes:
//   'existing' — pick from the org's service catalog (GET /services)
//   'custom'   — type a new service name; it's created in the catalog
//               via POST /services, then linked to the lead
//
// Data comes from the parent (LeadFullDetail) — no extra fetch needed.
// Mutations invalidate ['lead', leadId] on success so TanStack Query
// re-fetches the detail and the list updates automatically.
// ============================================================

import { useState } from 'react'
import {
  Wrench,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronLeft,
  Package,
} from 'lucide-react'

import type { LeadFullDetail } from '@/hooks/useLeadDetail'
import { useServices } from '@/hooks/useServices'
import { useAddLeadService, useRemoveLeadService } from '@/hooks/useLeadServices'

// ---- Shared classes (same style as CreateLeadModal) ----
const inputClass =
  'w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors'

// Sentinel value for the "Other (new service)" option in the dropdown
const OTHER_VALUE = '__other__'

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return 'N/A'
  return `₹${Number(amount).toLocaleString('en-IN')}`
}

// ============================================================
// PROPS
// ============================================================
interface Props {
  detail: LeadFullDetail  // full lead detail, contains detail.services[]
  leadId: string          // UUID of the lead — passed to mutations
}

// ============================================================
// COMPONENT
// ============================================================
export default function LeadServicesTab({ detail, leadId }: Props) {

  // ---- mutations ----
  const addMutation    = useAddLeadService(leadId)
  const removeMutation = useRemoveLeadService(leadId)

  // ---- catalog from GET /services ----
  const { data: catalog = [] } = useServices()

  // ---- local form state ----

  // showAddForm: controls whether the inline add form is visible
  const [showAddForm, setShowAddForm] = useState(false)

  // mode: 'existing' = dropdown picker, 'custom' = text input
  const [mode, setMode] = useState<'existing' | 'custom'>('existing')
  const [serviceId, setServiceId] = useState<string | null>(null)
  const [customName, setCustomName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState<number>(0)

  // Tracks which service is currently being removed (for per-row loading state)
  // We store the service_id string as the key
  const [removingId, setRemovingId] = useState<string | null>(null)

  // ---- helpers ----

  // Reset form to initial state (called when form is opened or cancelled)
  const resetForm = () => {
    setMode('existing')
    setServiceId(null)
    setCustomName('')
    setQuantity(1)
    setUnitPrice(0)
    addMutation.reset()  // clears any previous error from the mutation
  }

  const openAddForm = () => {
    resetForm()
    setShowAddForm(true)
  }

  const cancelAddForm = () => {
    setShowAddForm(false)
    resetForm()
  }

  // ---- submit: add service ----
  const handleAdd = () => {
    // Validate: must have either a selected catalog service or a typed name
    if (mode === 'existing' && !serviceId) return
    if (mode === 'custom' && !customName.trim()) return

    addMutation.mutate(
      {
        lead_id: leadId,
        ...(mode === 'existing'
          ? { service_id: serviceId! }
          : { service_name: customName.trim() }),
        quantity,
        unit_price: unitPrice,
      },
      {
        onSuccess: () => {
          setShowAddForm(false)
          resetForm()
        },
      }
    )
  }

  // ---- submit: remove service ----
  const handleRemove = (svcId: string | number) => {
    const key = String(svcId)
    setRemovingId(key)
    removeMutation.mutate(
      { serviceId: svcId },
      {
        // Clear the removingId marker once the operation finishes (success or error)
        onSettled: () => setRemovingId(null),
      }
    )
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="bg-slate-800/50 rounded-2xl p-5">

      {/* ---- Section header ---- */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-indigo-400" />
          Services attached to this lead
        </h3>

        {/* Only show the "Add Service" button when the form is not already open */}
        {!showAddForm && (
          <button
            onClick={openAddForm}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-xs font-medium transition-all"
          >
            <Plus className="w-3 h-3" />
            Add Service
          </button>
        )}
      </div>

      {/* ---- Service list ---- */}
      {detail.services.length === 0 && !showAddForm ? (
        // Empty state — no services yet
        <div className="py-10 text-center">
          <Package className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No services added to this lead yet</p>
          <p className="text-slate-600 text-xs mt-1">
            Click "Add Service" to start building a quotation
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {detail.services.map(service => {
            const key = String(service.service_id)
            const isBeingRemoved = removingId === key

            return (
              <div
                key={key}
                className={`bg-slate-800 border rounded-xl p-4 transition-all ${
                  isBeingRemoved
                    ? 'opacity-50 border-slate-700'
                    : 'border-indigo-500/30 bg-indigo-500/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Status icon */}
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />

                  {/* Service info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-slate-200">
                        {service.service_name ?? 'Unknown service'}
                      </h4>
                      <span className="text-sm font-bold text-emerald-400 flex-shrink-0">
                        {formatCurrency(service.total_price)}
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span>Qty: {service.quantity ?? 1}</span>
                      <span>Unit price: {formatCurrency(service.unit_price)}</span>
                      {service.type && (
                        <span className="px-2 py-0.5 bg-slate-700 rounded-lg capitalize">
                          {service.type}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(service.service_id)}
                    disabled={isBeingRemoved || removeMutation.isPending}
                    className="flex-shrink-0 p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Remove service from lead"
                  >
                    {isBeingRemoved ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ---- Total row — shown when there are services ---- */}
      {detail.services.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-400">Total estimate</span>
          <span className="text-lg font-bold text-emerald-400">
            {formatCurrency(detail.total_estimate)}
          </span>
        </div>
      )}

      {/* ---- Remove error ---- */}
      {removeMutation.isError && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <p className="text-xs text-rose-400">
            {(removeMutation.error as any)?.response?.data?.error ?? 'Failed to remove service'}
          </p>
        </div>
      )}

      {/* ============================================================
          INLINE ADD FORM
          Shown below the list when "Add Service" is clicked.
          ============================================================ */}
      {showAddForm && (
        <div className="mt-4 pt-4 border-t border-slate-700">

          <p className="text-xs font-semibold text-slate-400 mb-3">Add a service</p>

          {/* ---- Service picker (dropdown or custom text input) ---- */}
          <div className="space-y-2 mb-3">

            {mode === 'existing' ? (
              // Catalog dropdown
              <select
                value={serviceId ?? ''}
                onChange={e => {
                  const val = e.target.value
                  if (val === OTHER_VALUE) {
                    // Switch to custom text input mode
                    setMode('custom')
                    setServiceId(null)
                  } else {
                    // val is already the UUID string from the option's value attribute —
                    // do NOT parseInt() it, that would strip the UUID down to just
                    // its leading digits (e.g. "3fa8..." → 3) and cause a DB type error
                    setServiceId(val || null)
                  }
                }}
                className={inputClass}
              >
                <option value="">Select a service from catalog…</option>
                {catalog.map(svc => (
                  <option key={svc.id} value={svc.id}>{svc.name}</option>
                ))}
                <option disabled>──────────────</option>
                <option value={OTHER_VALUE}>Other (new service)</option>
              </select>
            ) : (
              // Custom service name text input
              // Shows a "← Back to catalog" link above it to switch modes
              <div>
                <button
                  type="button"
                  onClick={() => { setMode('existing'); setCustomName('') }}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 mb-1.5 transition-colors"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Back to catalog
                </button>
                <input
                  type="text"
                  autoFocus
                  placeholder="Type new service name…"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full bg-slate-800 border border-emerald-500/50 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <p className="text-xs text-slate-600 mt-1">
                  This will create a new entry in your services catalog
                </p>
              </div>
            )}

            {/* Quantity + unit price side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Quantity</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Unit Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0"
                  value={unitPrice === 0 ? '' : unitPrice}
                  onChange={e => setUnitPrice(Number(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Line total preview */}
            {quantity > 0 && unitPrice > 0 && (
              <p className="text-xs text-slate-500 text-right">
                Line total: <span className="text-slate-300 font-medium">
                  ₹{(quantity * unitPrice).toLocaleString('en-IN')}
                </span>
              </p>
            )}
          </div>

          {/* Add mutation error banner */}
          {addMutation.isError && (
            <div className="mb-3 flex items-center gap-2 px-3 py-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <p className="text-xs text-rose-400">
                {(addMutation.error as any)?.response?.data?.error ?? 'Failed to add service'}
              </p>
            </div>
          )}

          {/* Cancel + Add buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={cancelAddForm}
              disabled={addMutation.isPending}
              className="flex-1 py-2 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 rounded-xl text-sm transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={
                addMutation.isPending ||
                (mode === 'existing' ? !serviceId : !customName.trim())
              }
              className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              {addMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Adding…</>
              ) : (
                'Add Service'
              )}
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
