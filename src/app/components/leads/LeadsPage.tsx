import { useState } from "react";
import { leadsData, Lead } from "../../data/mockData";
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
} from "lucide-react";
import LeadDetail from "./LeadDetail";
import CloseDealModal from "./CloseDealModal";
import CreateLeadModal from "./CreateLeadModal";

const statusColors: Record<string, string> = {
  New: "bg-sky-500/20 text-sky-400 border border-sky-500/30",
  Contacted: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  Qualified: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  Proposal: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  Negotiation: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  Closed: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(leadsData);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showCloseDeal, setShowCloseDeal] = useState(false);
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [closeDealLead, setCloseDealLead] = useState<Lead | null>(null);

  const anyChecked = leads.some((l) => l.checked);
  const checkedLeads = leads.filter((l) => l.checked);

  const filteredLeads = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone.includes(searchTerm)
  );

  const toggleCheck = (id: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, checked: !l.checked } : l))
    );
  };

  const toggleAll = () => {
    const allChecked = filteredLeads.every((l) => l.checked);
    setLeads((prev) =>
      prev.map((l) => ({
        ...l,
        checked: filteredLeads.some((fl) => fl.id === l.id) ? !allChecked : l.checked,
      }))
    );
  };

  const handleCloseDeal = () => {
    if (anyChecked) {
      setCloseDealLead(checkedLeads[0]);
      setShowCloseDeal(true);
    }
  };

  return (
    <div className="p-6 h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Leads</h1>
            <p className="text-slate-400 text-sm mt-1">
              {leads.length} total leads · {leads.filter((l) => l.checked).length} selected
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Close Deal Button */}
            <button
              onClick={handleCloseDeal}
              disabled={!anyChecked}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                anyChecked
                  ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/30 cursor-pointer"
                  : "bg-slate-800 text-slate-600 cursor-not-allowed opacity-40 border border-slate-700"
              }`}
            >
              {anyChecked ? (
                <Handshake className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>Close Deal</span>
              {!anyChecked && (
                <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 ml-1">
                  Select lead first
                </span>
              )}
            </button>

            {/* Create Deal */}
            <button
              onClick={() => setShowCreateLead(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/30"
            >
              <Plus className="w-4 h-4" />
              <span>Create Lead</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          {[
            { label: "Total Leads", value: leads.length, icon: Users2Icon, iconBg: "bg-indigo-500/20", iconText: "text-indigo-400" },
            { label: "Qualified", value: leads.filter((l) => l.status === "Qualified").length, icon: Star, iconBg: "bg-emerald-500/20", iconText: "text-emerald-400" },
            { label: "Negotiation", value: leads.filter((l) => l.status === "Negotiation").length, icon: TrendingUp, iconBg: "bg-amber-500/20", iconText: "text-amber-400" },
            { label: "Closed", value: leads.filter((l) => l.status === "Closed").length, icon: CheckCircle2, iconBg: "bg-purple-500/20", iconText: "text-purple-400" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.iconText}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-sm transition-all">
          <Filter className="w-4 h-4" />
          Filter
        </button>
        <button className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-sm transition-all">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Selected banner */}
      {anyChecked && (
        <div className="mb-3 flex items-center gap-3 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          <span className="text-indigo-300 text-sm">
            {checkedLeads.length} lead{checkedLeads.length > 1 ? "s" : ""} selected — Click "Close Deal" to proceed
          </span>
          <button
            onClick={() => setLeads((prev) => prev.map((l) => ({ ...l, checked: false })))}
            className="ml-auto text-indigo-400 hover:text-indigo-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={filteredLeads.length > 0 && filteredLeads.every((l) => l.checked)}
                  onChange={toggleAll}
                  className="w-4 h-4 accent-indigo-500 cursor-pointer"
                />
              </th>
              {["Name", "Phone", "Source", "Status", "Status Details", "Email", "Address"].map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
              <th className="px-4 py-3 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredLeads.map((lead) => (
              <tr
                key={lead.id}
                className={`transition-all duration-150 group ${
                  lead.checked
                    ? "bg-indigo-500/5"
                    : "hover:bg-slate-800/50"
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={lead.checked}
                    onChange={() => toggleCheck(lead.id)}
                    className="w-4 h-4 accent-indigo-500 cursor-pointer"
                  />
                </td>
                <td
                  className="px-4 py-3 cursor-pointer"
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {lead.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <span className="text-slate-200 text-sm font-medium hover:text-indigo-400 transition-colors">
                      {lead.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-slate-400 text-sm">
                    <Phone className="w-3 h-3" />
                    {lead.phone}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-400 text-sm">{lead.source}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${statusColors[lead.status]}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-sm max-w-[180px] truncate">
                  {lead.statusDetails}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-slate-400 text-sm">
                    <Mail className="w-3 h-3" />
                    <span className="truncate max-w-[140px]">{lead.email}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-slate-400 text-sm">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[140px]">{lead.address}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelectedLead(lead)}
                    className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all hover:scale-110"
                    title="View Details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLeads.length === 0 && (
          <div className="py-16 text-center text-slate-500">
            <p>No leads found</p>
          </div>
        )}
      </div>

      {/* Lead Detail Drawer */}
      {selectedLead && (
        <LeadDetail
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={(updated) => {
            setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
            setSelectedLead(updated);
          }}
        />
      )}

      {/* Close Deal Modal */}
      {showCloseDeal && closeDealLead && (
        <CloseDealModal
          leads={checkedLeads}
          onClose={() => setShowCloseDeal(false)}
          onConfirm={() => {
            setLeads((prev) =>
              prev.map((l) =>
                l.checked ? { ...l, status: "Closed", checked: false } : l
              )
            );
            setShowCloseDeal(false);
          }}
        />
      )}

      {/* Create Lead Modal */}
      {showCreateLead && (
        <CreateLeadModal
          onClose={() => setShowCreateLead(false)}
          onCreate={(lead) => {
            setLeads((prev) => [...prev, { ...lead, id: `L00${prev.length + 1}`, checked: false }]);
            setShowCreateLead(false);
          }}
        />
      )}
    </div>
  );
}

function Users2Icon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}