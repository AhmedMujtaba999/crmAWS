import { useState } from "react";
import { Employee } from "../../data/mockData";
import { X, Plus, UserPlus } from "lucide-react";

interface Props {
  onClose: () => void;
  onAdd: (emp: Omit<Employee, "id" | "tasks" | "performance">) => void;
}

export default function AddEmployeeModal({ onClose, onAdd }: Props) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    empType: "Full-Time" as Employee["empType"],
    workingHours: { from: "9:00 AM", to: "6:00 PM" },
    pay: 40000,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    onAdd(form);
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
            <UserPlus className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Add New Employee</h2>
          <button onClick={onClose} className="ml-auto text-slate-500 hover:text-slate-300 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Full Name *</label>
            <input
              required
              placeholder="e.g. Kiran Kumar"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Phone</label>
              <input
                placeholder="+91 91234 56789"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Employee Type</label>
              <select
                value={form.empType}
                onChange={(e) => setForm({ ...form, empType: e.target.value as Employee["empType"] })}
                className={inputClass}
              >
                {["Full-Time", "Part-Time", "Contractor", "Manager"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Email *</label>
            <input
              required
              type="email"
              placeholder="name@opscentre.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Working From</label>
              <input
                placeholder="9:00 AM"
                value={form.workingHours.from}
                onChange={(e) => setForm({ ...form, workingHours: { ...form.workingHours, from: e.target.value } })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Working To</label>
              <input
                placeholder="6:00 PM"
                value={form.workingHours.to}
                onChange={(e) => setForm({ ...form, workingHours: { ...form.workingHours, to: e.target.value } })}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Monthly Pay (₹)</label>
            <input
              type="number"
              placeholder="40000"
              value={form.pay}
              onChange={(e) => setForm({ ...form, pay: Number(e.target.value) })}
              className={inputClass}
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
              Add Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
