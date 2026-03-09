import { useState } from "react";
import { Employee } from "../../data/mockData";
import {
  X,
  Phone,
  Mail,
  Clock,
  DollarSign,
  TrendingUp,
  FileText,
  Edit3,
  Save,
  Activity,
} from "lucide-react";

interface Props {
  employee: Employee;
  onClose: () => void;
  onUpdate: (emp: Employee) => void;
}

const tabs = ["Overview", "Working Hours", "Pay & Schedule", "Performance", "Agreement"];

export default function EmployeeDetail({ employee, onClose, onUpdate }: Props) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(employee);

  const handleSave = () => {
    onUpdate(editData);
    setEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl h-full bg-slate-900 shadow-2xl flex flex-col">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-indigo-900/60 to-slate-900 border-b border-slate-800 px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/30 flex-shrink-0">
              {employee.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{employee.name}</h2>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs">
                  {employee.empType}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <div className="flex items-center gap-1 text-slate-400 text-sm">
                  <Phone className="w-3.5 h-3.5" />
                  {employee.phone}
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-sm">
                  <Mail className="w-3.5 h-3.5" />
                  {employee.email}
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">{employee.id}</p>
            </div>
            <div className="flex gap-2">
              {editing ? (
                <button onClick={handleSave} className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-all">
                  <Save className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={() => setEditing(true)} className="p-2 bg-slate-800 text-slate-400 rounded-xl hover:text-slate-200 transition-all">
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
              <button onClick={onClose} className="p-2 bg-slate-800 text-slate-400 rounded-xl hover:text-slate-200 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "Working Hours", value: `${employee.workingHours.from} - ${employee.workingHours.to}`, icon: Clock },
              { label: "Monthly Pay", value: `₹${employee.pay?.toLocaleString()}`, icon: DollarSign },
              { label: "Performance", value: `${employee.performance}%`, icon: TrendingUp },
            ].map((s) => (
              <div key={s.label} className="bg-slate-800/60 rounded-xl p-3 flex items-center gap-2">
                <s.icon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className="text-sm font-medium text-slate-200">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 px-4 flex-shrink-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-3 text-xs font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
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
              <div className="bg-slate-800/50 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  Employee Information
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
                      <label className="text-xs text-slate-500 mb-1 block">Phone</label>
                      <input
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Email</label>
                      <input
                        value={editData.email}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Employee Type</label>
                      <select
                        value={editData.empType}
                        onChange={(e) => setEditData({ ...editData, empType: e.target.value as Employee["empType"] })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        {["Full-Time", "Part-Time", "Contractor", "Manager"].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      { label: "Name", value: employee.name },
                      { label: "Phone", value: employee.phone },
                      { label: "Email", value: employee.email },
                      { label: "Employee Type", value: employee.empType },
                      { label: "Employee ID", value: employee.id },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                        <span className="text-sm text-slate-500">{item.label}</span>
                        <span className="text-sm text-slate-200">{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "Working Hours" && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  Schedule
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-500 mb-2">From</p>
                    <p className="text-2xl font-bold text-indigo-400">{employee.workingHours.from}</p>
                  </div>
                  <div className="bg-slate-800 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-500 mb-2">To</p>
                    <p className="text-2xl font-bold text-indigo-400">{employee.workingHours.to}</p>
                  </div>
                </div>
                {editing && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">From</label>
                      <input
                        value={editData.workingHours.from}
                        onChange={(e) => setEditData({ ...editData, workingHours: { ...editData.workingHours, from: e.target.value } })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">To</label>
                      <input
                        value={editData.workingHours.to}
                        onChange={(e) => setEditData({ ...editData, workingHours: { ...editData.workingHours, to: e.target.value } })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "Pay & Schedule" && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Compensation
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Monthly Salary", value: `₹${employee.pay?.toLocaleString()}` },
                    { label: "Annual CTC", value: `₹${((employee.pay || 0) * 12).toLocaleString()}` },
                    { label: "Payment Mode", value: "Bank Transfer" },
                    { label: "Pay Cycle", value: "Monthly (1st)" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between py-2 border-b border-slate-700/50 last:border-0">
                      <span className="text-sm text-slate-500">{item.label}</span>
                      <span className="text-sm font-medium text-slate-200">{item.value}</span>
                    </div>
                  ))}
                </div>
                {editing && (
                  <div className="mt-4">
                    <label className="text-xs text-slate-500 mb-1 block">Monthly Salary (₹)</label>
                    <input
                      type="number"
                      value={editData.pay}
                      onChange={(e) => setEditData({ ...editData, pay: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "Performance" && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  Performance Metrics
                </h3>
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-400">Overall Score</span>
                    <span className="text-sm font-bold text-indigo-400">{employee.performance}%</span>
                  </div>
                  <div className="bg-slate-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all"
                      style={{ width: `${employee.performance}%` }}
                    />
                  </div>
                </div>
                {[
                  { label: "Task Completion", score: 95 },
                  { label: "Punctuality", score: employee.performance - 5 },
                  { label: "Client Satisfaction", score: employee.performance + 2 > 100 ? 100 : employee.performance + 2 },
                  { label: "Team Collaboration", score: employee.performance - 3 },
                ].map((metric) => (
                  <div key={metric.label} className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-slate-500">{metric.label}</span>
                      <span className="text-xs text-slate-400">{metric.score}%</span>
                    </div>
                    <div className="bg-slate-700 rounded-full h-1.5">
                      <div
                        className="bg-indigo-500/70 h-1.5 rounded-full"
                        style={{ width: `${metric.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Agreement" && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Employment Agreement
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Contract Type", value: employee.empType },
                    { label: "Start Date", value: "Jan 15, 2024" },
                    { label: "Contract Duration", value: employee.empType === "Contractor" ? "6 months" : "Permanent" },
                    { label: "Notice Period", value: "30 days" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between py-2 border-b border-slate-700/50 last:border-0">
                      <span className="text-sm text-slate-500">{item.label}</span>
                      <span className="text-sm text-slate-200">{item.value}</span>
                    </div>
                  ))}
                </div>
                <button className="mt-4 w-full py-2.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-sm hover:bg-indigo-500/30 transition-all">
                  Download Agreement PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
