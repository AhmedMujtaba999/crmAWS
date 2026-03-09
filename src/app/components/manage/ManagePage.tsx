import { useState } from "react";
import { employeesData, Employee } from "../../data/mockData";
import {
  Plus,
  Phone,
  Mail,
  ChevronRight,
  Search,
  Edit3,
  Briefcase,
} from "lucide-react";
import EmployeeDetail from "./EmployeeDetail";
import AddEmployeeModal from "./AddEmployeeModal";

const empTypeColors: Record<string, string> = {
  "Full-Time": "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",
  "Part-Time": "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  "Contractor": "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  "Manager": "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
};

export default function ManagePage() {
  const [employees, setEmployees] = useState<Employee[]>(employeesData);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Manage Employees</h1>
            <p className="text-slate-400 text-sm mt-1">{employees.length} total employees</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/30"
          >
            <Plus className="w-4 h-4" />
            Employee +
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          {[
            { label: "Full-Time", value: employees.filter((e) => e.empType === "Full-Time").length, bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-400" },
            { label: "Part-Time", value: employees.filter((e) => e.empType === "Part-Time").length, bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
            { label: "Contractors", value: employees.filter((e) => e.empType === "Contractor").length, bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400" },
            { label: "Managers", value: employees.filter((e) => e.empType === "Manager").length, bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-4`}>
              <p className={`text-3xl font-bold ${s.text}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              {["Employee", "Phone", "Email", "Type", "Working Hours", "Performance", ""].map((col) => (
                <th
                  key={col}
                  className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map((emp) => (
              <tr
                key={emp.id}
                className="hover:bg-slate-800/40 transition-all group cursor-pointer"
                onClick={() => setSelectedEmp(emp)}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{emp.name}</p>
                      <p className="text-xs text-slate-500">{emp.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 text-sm text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                    {emp.phone}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 text-sm text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[180px]">{emp.email}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${empTypeColors[emp.empType]}`}>
                    {emp.empType}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-slate-400">
                  {emp.workingHours.from} — {emp.workingHours.to}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-800 rounded-full h-1.5 max-w-[80px]">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${emp.performance}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">{emp.performance}%</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEmp(emp);
                      }}
                      className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-500">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No employees found</p>
          </div>
        )}
      </div>

      {/* Employee Detail Drawer */}
      {selectedEmp && (
        <EmployeeDetail
          employee={selectedEmp}
          onClose={() => setSelectedEmp(null)}
          onUpdate={(updated) => {
            setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
            setSelectedEmp(updated);
          }}
        />
      )}

      {/* Add Employee Modal */}
      {showAdd && (
        <AddEmployeeModal
          onClose={() => setShowAdd(false)}
          onAdd={(emp) => {
            setEmployees((prev) => [
              ...prev,
              { ...emp, id: `EMP00${prev.length + 1}`, tasks: [], performance: 80 },
            ]);
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}