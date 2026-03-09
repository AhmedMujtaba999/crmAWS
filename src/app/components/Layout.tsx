import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import {
  Users,
  CalendarCheck,
  DollarSign,
  Settings,
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  Zap,
  Menu,
  X,
  Bell,
  Search,
  UserCircle,
  Sun,
  Moon,
} from "lucide-react";

const navItems = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    path: "/",
    exact: true,
  },
  {
    label: "Operation Center",
    icon: Users,
    path: "/leads",
    children: [
      { label: "Leads", path: "/leads" },
      { label: "Tasks & Scheduling", path: "/tasks" },
    ],
  },
  {
    label: "Finance",
    icon: DollarSign,
    path: "/finance",
    children: [
      { label: "Dashboard", path: "/finance" },
    ],
  },
  {
    label: "Manage",
    icon: Settings,
    path: "/manage",
    children: [
      { label: "Employee Details", path: "/manage" },
    ],
  },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>(["Operation Center", "Finance", "Manage"]);
  const [darkMode, setDarkMode] = useState(true);
  const location = useLocation();

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-slate-950' : 'bg-gray-50'} overflow-hidden`}>
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } transition-all duration-300 flex flex-col bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 shadow-2xl flex-shrink-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
          <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <p className="text-white text-sm font-semibold tracking-wide">Operations</p>
              <p className="text-indigo-400 text-xs">Centre</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto text-slate-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedItems.includes(item.label);
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);

            return (
              <div key={item.label}>
                {item.children ? (
                  <>
                    <button
                      onClick={() => toggleExpand(item.label)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                        isActive
                          ? "bg-indigo-500/20 text-indigo-400"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && (
                        <>
                          <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </>
                      )}
                    </button>
                    {sidebarOpen && isExpanded && (
                      <div className="ml-4 mt-1 space-y-1 border-l border-slate-800 pl-3">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            className={({ isActive }) =>
                              `block px-3 py-2 rounded-lg text-xs transition-all duration-200 ${
                                isActive
                                  ? "text-indigo-400 bg-indigo-500/10"
                                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                              }`
                            }
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <NavLink
                    to={item.path}
                    end={item.exact}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-indigo-500/20 text-indigo-400 shadow-sm"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`
                    }
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </NavLink>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom user section */}
        <div className="border-t border-slate-800 px-3 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <UserCircle className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <p className="text-slate-200 text-xs font-medium">Admin User</p>
                <p className="text-slate-500 text-xs">Operations Manager</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-4 bg-slate-900 border-b border-slate-800 flex-shrink-0">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 ml-auto">
            <button className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">AU</span>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}