import { Lead } from "../../data/mockData";
import { X, CheckCircle2, Handshake, DollarSign } from "lucide-react";

interface Props {
  leads: Lead[];
  onClose: () => void;
  onConfirm: () => void;
}

export default function CloseDealModal({ leads, onClose, onConfirm }: Props) {
  const totalValue = leads.reduce((sum, l) => sum + (l.quote || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900/40 to-slate-900 border-b border-slate-800 px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <Handshake className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Close Deal</h2>
            <p className="text-slate-400 text-sm">{leads.length} lead{leads.length > 1 ? "s" : ""} selected</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-500 hover:text-slate-300 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Leads List */}
          <div className="space-y-2">
            {leads.map((lead) => (
              <div key={lead.id} className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                  {lead.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-slate-200 text-sm font-medium">{lead.name}</p>
                  <p className="text-slate-500 text-xs">{lead.status} → Closed</p>
                </div>
                <span className="text-emerald-400 text-sm font-semibold">
                  ₹{lead.quote?.toLocaleString() || "0"}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 text-sm font-medium">Total Deal Value</span>
            </div>
            <span className="text-emerald-400 text-xl font-bold">₹{totalValue.toLocaleString()}</span>
          </div>

          <p className="text-slate-500 text-sm text-center">
            This will mark the selected leads as "Closed". This action cannot be undone.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 text-slate-400 rounded-xl text-sm hover:bg-slate-700 hover:text-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirm Close
          </button>
        </div>
      </div>
    </div>
  );
}
