import { useState } from "react";
import { Lead } from "../../data/mockData";
import { X, Plus } from "lucide-react";

interface Props {
  onClose: () => void;
  onCreate: (lead: Omit<Lead, "id" | "checked">) => void;
}

export default function CreateLeadModal({ onClose, onCreate }: Props) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    source: "Website",
    status: "New" as Lead["status"],
    statusDetails: "",
    email: "",
    address: "",
    notes: "",
    quote: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    onCreate(form);
  };

  const inputClass =
    "w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
            <Plus className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Create New Lead</h2>
          <button onClick={onClose} className="ml-auto text-slate-500 hover:text-slate-300 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Full Name *</label>
              <input
                required
                placeholder="e.g. Arjun Sharma"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Phone</label>
              <input
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Email *</label>
            <input
              required
              type="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Address</label>
            <input
              placeholder="Full address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Source</label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className={inputClass}
              >
                {["Website", "Referral", "LinkedIn", "Cold Call", "Trade Show"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Lead["status"] })}
                className={inputClass}
              >
                {["New", "Contacted", "Qualified", "Proposal", "Negotiation"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Status Details</label>
            <input
              placeholder="Brief description of current status"
              value={form.statusDetails}
              onChange={(e) => setForm({ ...form, statusDetails: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Quote Amount (₹)</label>
            <input
              type="number"
              placeholder="0"
              value={form.quote}
              onChange={(e) => setForm({ ...form, quote: Number(e.target.value) })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Notes</label>
            <textarea
              placeholder="Initial notes about this lead..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className={`${inputClass} min-h-[80px] resize-none`}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 text-slate-400 rounded-xl text-sm hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
