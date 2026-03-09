import { useState } from "react";
import { Lead } from "../../data/mockData";
import {
  X,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  Activity,
  Edit3,
  Save,
  User,
  Wrench,
  CheckCircle2,
  Circle,
} from "lucide-react";

interface Props {
  lead: Lead;
  onClose: () => void;
  onUpdate: (lead: Lead) => void;
}

const tabs = ["Overview", "Services", "Email", "Finances", "Notes"];

export default function LeadDetail({ lead, onClose, onUpdate }: Props) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(lead);

  const handleSave = () => {
    onUpdate(editData);
    setEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Full Screen Modal */}
      <div className="relative w-full max-w-6xl h-[90vh] bg-slate-900 shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 rounded-2xl border border-slate-800">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-indigo-900/60 to-slate-900 border-b border-slate-800 px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/30 flex-shrink-0">
              {lead.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white truncate">{lead.name}</h2>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-medium">
                  {lead.status}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <div className="flex items-center gap-1 text-slate-400 text-sm">
                  <Phone className="w-3.5 h-3.5" />
                  {lead.phone}
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-sm">
                  <Mail className="w-3.5 h-3.5" />
                  {lead.email}
                </div>
              </div>
              <div className="flex items-start gap-1 mt-1 text-slate-400 text-sm">
                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                {lead.address}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {editing ? (
                <button
                  onClick={handleSave}
                  className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-all"
                >
                  <Save className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="p-2 bg-slate-800 text-slate-400 rounded-xl hover:text-slate-200 transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 bg-slate-800 text-slate-400 rounded-xl hover:text-slate-200 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick info bar */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "Task Title", value: "Site Survey", icon: FileText },
              { label: "Source", value: lead.source, icon: User },
              { label: "Quote", value: lead.quote ? `₹${lead.quote.toLocaleString()}` : "N/A", icon: DollarSign },
            ].map((item) => (
              <div key={item.label} className="bg-slate-800/60 rounded-xl p-3 flex items-center gap-2">
                <item.icon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-sm font-medium text-slate-200">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 px-6 flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px ${
                activeTab === tab
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "Overview" && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  Lead Overview
                </h3>
                {editing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Name</label>
                      <input
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Status</label>
                      <select
                        value={editData.status}
                        onChange={(e) => setEditData({ ...editData, status: e.target.value as any })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        {["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Closed"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Status Details</label>
                      <input
                        value={editData.statusDetails}
                        onChange={(e) => setEditData({ ...editData, statusDetails: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      { label: "Lead Status", value: lead.status },
                      { label: "Status Details", value: lead.statusDetails },
                      { label: "Source", value: lead.source },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start justify-between py-2 border-b border-slate-700/50 last:border-0">
                        <span className="text-sm text-slate-500">{item.label}</span>
                        <span className="text-sm text-slate-200 text-right max-w-[240px]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quotation Section */}
              <div className="bg-slate-800/50 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Quotation
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Quoted Amount</span>
                  <span className="text-2xl font-bold text-emerald-400">
                    ₹{lead.quote?.toLocaleString() || "0"}
                  </span>
                </div>
                {editing && (
                  <div className="mt-3">
                    <label className="text-xs text-slate-500 mb-1 block">Update Quote (₹)</label>
                    <input
                      type="number"
                      value={editData.quote}
                      onChange={(e) => setEditData({ ...editData, quote: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "Services" && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-indigo-400" />
                  Services for this Lead
                </h3>
                <div className="space-y-3">
                  {[
                    { 
                      name: "Solar Panel Installation", 
                      description: "6kW rooftop solar panel system installation",
                      price: "₹85,000",
                      status: "Proposed",
                      selected: true 
                    },
                    { 
                      name: "Site Survey & Assessment", 
                      description: "Detailed site inspection and electrical assessment",
                      price: "₹5,000",
                      status: "Completed",
                      selected: true 
                    },
                    { 
                      name: "Battery Storage System", 
                      description: "10kWh lithium-ion battery backup system",
                      price: "₹120,000",
                      status: "Optional",
                      selected: false 
                    },
                    { 
                      name: "Annual Maintenance Contract", 
                      description: "1-year comprehensive maintenance package",
                      price: "₹12,000/year",
                      status: "Optional",
                      selected: false 
                    },
                  ].map((service, i) => (
                    <div key={i} className={`bg-slate-800 rounded-xl p-4 border transition-all ${
                      service.selected 
                        ? "border-indigo-500/40 bg-indigo-500/5" 
                        : "border-slate-700 hover:border-slate-600"
                    }`}>
                      <div className="flex items-start gap-3">
                        {service.selected ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-slate-200">{service.name}</h4>
                            <span className={`text-sm font-bold flex-shrink-0 ${
                              service.selected ? "text-emerald-400" : "text-slate-400"
                            }`}>
                              {service.price}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{service.description}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-lg ${
                              service.status === "Completed" 
                                ? "bg-emerald-500/20 text-emerald-400"
                                : service.status === "Proposed"
                                ? "bg-indigo-500/20 text-indigo-400"
                                : "bg-slate-700 text-slate-400"
                            }`}>
                              {service.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-4 w-full py-2.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-sm hover:bg-indigo-500/30 transition-all">
                  Add New Service
                </button>
              </div>
            </div>
          )}

          {activeTab === "Email" && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  Email Communication
                </h3>
                <div className="space-y-3">
                  {[
                    { subject: "Initial Contact", date: "Feb 28", preview: "Hi, following up on your inquiry..." },
                    { subject: "Proposal Sent", date: "Mar 1", preview: "Please find attached our detailed proposal..." },
                    { subject: "Meeting Scheduled", date: "Mar 2", preview: "Confirming our meeting for tomorrow..." },
                  ].map((email, i) => (
                    <div key={i} className="bg-slate-800 rounded-xl p-3 hover:bg-slate-750 transition-all cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-200">{email.subject}</span>
                        <span className="text-xs text-slate-500">{email.date}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{email.preview}</p>
                    </div>
                  ))}
                </div>
                <button className="mt-4 w-full py-2.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-sm hover:bg-indigo-500/30 transition-all">
                  Compose Email
                </button>
              </div>
            </div>
          )}

          {activeTab === "Finances" && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Financial Summary
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Quoted Amount", value: `₹${lead.quote?.toLocaleString() || "0"}`, color: "emerald" },
                    { label: "Advance Paid", value: "₹0", color: "amber" },
                    { label: "Balance Due", value: `₹${lead.quote?.toLocaleString() || "0"}`, color: "rose" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0">
                      <span className="text-sm text-slate-500">{item.label}</span>
                      <span className={`text-sm font-semibold text-${item.color}-400`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "Notes" && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Notes
                </h3>
                <textarea
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 min-h-[150px] resize-none"
                  placeholder="Add notes about this lead..."
                  value={editData.notes || ""}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                />
                <button
                  onClick={handleSave}
                  className="mt-3 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm hover:bg-indigo-400 transition-all"
                >
                  Save Notes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}