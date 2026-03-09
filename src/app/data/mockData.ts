// Mock data for the Operations Centre

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  status: "New" | "Contacted" | "Qualified" | "Proposal" | "Negotiation" | "Closed";
  statusDetails: string;
  email: string;
  address: string;
  checked: boolean;
  notes?: string;
  quote?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  status: "unassigned" | "pending" | "active" | "completed";
  priority: "Low" | "Medium" | "High";
  dueDate: string;
  completedDate?: string;
  clientName?: string;
  clientEmail?: string;
  clientAddress?: string;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  email: string;
  empType: "Full-Time" | "Part-Time" | "Contractor" | "Manager";
  workingHours: { from: string; to: string };
  tasks?: string[];
  performance?: number;
  pay?: number;
}

export const leadsData: Lead[] = [
  {
    id: "L001",
    name: "Arjun Sharma",
    phone: "+91 98765 43210",
    source: "Website",
    status: "Qualified",
    statusDetails: "Interested in premium package",
    email: "arjun.sharma@email.com",
    address: "42, MG Road, Hyderabad, Telangana 500001",
    checked: false,
    notes: "Very interested, follow up next week",
    quote: 85000,
  },
  {
    id: "L002",
    name: "Priya Nair",
    phone: "+91 87654 32109",
    source: "Referral",
    status: "Proposal",
    statusDetails: "Awaiting approval from management",
    email: "priya.nair@company.com",
    address: "15, Banjara Hills, Hyderabad, Telangana 500034",
    checked: false,
    notes: "Has budget constraints, offered discount",
    quote: 120000,
  },
  {
    id: "L003",
    name: "Rahul Verma",
    phone: "+91 76543 21098",
    source: "LinkedIn",
    status: "New",
    statusDetails: "Initial inquiry received",
    email: "rahul.v@business.in",
    address: "7, Jubilee Hills, Hyderabad, Telangana 500033",
    checked: false,
    notes: "Wants a demo session",
    quote: 0,
  },
  {
    id: "L004",
    name: "Meera Patel",
    phone: "+91 65432 10987",
    source: "Cold Call",
    status: "Contacted",
    statusDetails: "Call scheduled for tomorrow",
    email: "meera.patel@industry.com",
    address: "88, Kondapur, Hyderabad, Telangana 500084",
    checked: false,
    notes: "Needs brochure and pricing",
    quote: 55000,
  },
  {
    id: "L005",
    name: "Vikram Singh",
    phone: "+91 54321 09876",
    source: "Trade Show",
    status: "Negotiation",
    statusDetails: "Price negotiation ongoing",
    email: "vikram.singh@enterprise.co",
    address: "33, Gachibowli, Hyderabad, Telangana 500032",
    checked: false,
    notes: "Wants 20% discount",
    quote: 200000,
  },
  {
    id: "L006",
    name: "Anita Reddy",
    phone: "+91 43210 98765",
    source: "Website",
    status: "Qualified",
    statusDetails: "Ready to sign contract",
    email: "anita.reddy@startup.io",
    address: "56, Madhapur, Hyderabad, Telangana 500081",
    checked: false,
    notes: "Fast track required",
    quote: 95000,
  },
];

export const tasksData: Task[] = [
  {
    id: "T001",
    title: "Site Survey - Sharma Residence",
    description: "Conduct a detailed site survey for solar panel installation",
    assignee: "unassigned",
    status: "unassigned",
    priority: "High",
    dueDate: "2026-03-10",
    clientName: "Arjun Sharma",
    clientEmail: "arjun.sharma@email.com",
    clientAddress: "42, MG Road, Hyderabad",
  },
  {
    id: "T002",
    title: "Electrical Assessment - Nair Office",
    description: "Check electrical load capacity for commercial installation",
    assignee: "Emp1",
    status: "pending",
    priority: "Medium",
    dueDate: "2026-03-08",
    clientName: "Priya Nair",
    clientEmail: "priya.nair@company.com",
    clientAddress: "15, Banjara Hills, Hyderabad",
  },
  {
    id: "T003",
    title: "Panel Installation - Verma Home",
    description: "Install 6kW solar panel system on rooftop",
    assignee: "Emp2",
    status: "active",
    priority: "High",
    dueDate: "2026-03-07",
    clientName: "Rahul Verma",
    clientEmail: "rahul.v@business.in",
    clientAddress: "7, Jubilee Hills, Hyderabad",
  },
  {
    id: "T004",
    title: "Follow-up Call - Patel",
    description: "Follow up call to discuss pricing and finalize",
    assignee: "Emp3",
    status: "pending",
    priority: "Low",
    dueDate: "2026-03-09",
    clientName: "Meera Patel",
    clientEmail: "meera.patel@industry.com",
    clientAddress: "88, Kondapur, Hyderabad",
  },
  {
    id: "T005",
    title: "Contract Review - Singh Enterprise",
    description: "Review and finalize the contract terms with client",
    assignee: "unassigned",
    status: "unassigned",
    priority: "High",
    dueDate: "2026-03-11",
    clientName: "Vikram Singh",
    clientEmail: "vikram.singh@enterprise.co",
    clientAddress: "33, Gachibowli, Hyderabad",
  },
  {
    id: "T006",
    title: "Post-Installation Inspection",
    description: "Inspect completed solar installation at Reddy property",
    assignee: "Emp1",
    status: "active",
    priority: "Medium",
    dueDate: "2026-03-06",
    clientName: "Anita Reddy",
    clientEmail: "anita.reddy@startup.io",
    clientAddress: "56, Madhapur, Hyderabad",
  },
  {
    id: "T007",
    title: "Equipment Delivery - Block C",
    description: "Coordinate equipment delivery to Block C site",
    assignee: "Emp2",
    status: "completed",
    priority: "Medium",
    dueDate: "2026-03-01",
    completedDate: "2026-03-01",
    clientName: "Ravi Kumar",
    clientEmail: "ravi.k@mail.com",
    clientAddress: "Block C, Hi-Tech City, Hyderabad",
  },
  {
    id: "T008",
    title: "Maintenance Check - Phase 2",
    description: "Quarterly maintenance for Phase 2 installations",
    assignee: "Emp3",
    status: "completed",
    priority: "Low",
    dueDate: "2026-02-28",
    completedDate: "2026-02-28",
    clientName: "Sunita Joshi",
    clientEmail: "sunita.j@homes.com",
    clientAddress: "Phase 2, Miyapur, Hyderabad",
  },
  {
    id: "T009",
    title: "Battery Storage Setup",
    description: "Configure and install battery storage system",
    assignee: "unassigned",
    status: "unassigned",
    priority: "High",
    dueDate: "2026-03-15",
    clientName: "Deepak Mehta",
    clientEmail: "deepak.m@tech.in",
    clientAddress: "12, HITEC City, Hyderabad",
  },
];

export const employeesData: Employee[] = [
  {
    id: "EMP001",
    name: "Kiran Kumar",
    phone: "+91 91234 56789",
    email: "kiran.kumar@opscentre.com",
    empType: "Full-Time",
    workingHours: { from: "8:00 AM", to: "6:00 PM" },
    tasks: ["T002", "T006"],
    performance: 92,
    pay: 45000,
  },
  {
    id: "EMP002",
    name: "Divya Menon",
    phone: "+91 82345 67890",
    email: "divya.menon@opscentre.com",
    empType: "Full-Time",
    workingHours: { from: "9:00 AM", to: "7:00 PM" },
    tasks: ["T003", "T007"],
    performance: 88,
    pay: 42000,
  },
  {
    id: "EMP003",
    name: "Suresh Babu",
    phone: "+91 73456 78901",
    email: "suresh.babu@opscentre.com",
    empType: "Contractor",
    workingHours: { from: "8:30 AM", to: "5:30 PM" },
    tasks: ["T004", "T008"],
    performance: 78,
    pay: 35000,
  },
  {
    id: "EMP004",
    name: "Lakshmi Devi",
    phone: "+91 64567 89012",
    email: "lakshmi.devi@opscentre.com",
    empType: "Part-Time",
    workingHours: { from: "10:00 AM", to: "3:00 PM" },
    tasks: [],
    performance: 85,
    pay: 22000,
  },
  {
    id: "EMP005",
    name: "Mohammed Farhan",
    phone: "+91 55678 90123",
    email: "m.farhan@opscentre.com",
    empType: "Manager",
    workingHours: { from: "9:00 AM", to: "6:00 PM" },
    tasks: [],
    performance: 95,
    pay: 65000,
  },
];

export const financeData = {
  totalRevenue: 1850000,
  monthlyRevenue: 285000,
  pendingPayments: 420000,
  completedDeals: 24,
  activeDeals: 8,
  expenses: 125000,
  revenueByMonth: [
    { month: "Oct", revenue: 180000, expenses: 95000 },
    { month: "Nov", revenue: 210000, expenses: 105000 },
    { month: "Dec", revenue: 195000, expenses: 98000 },
    { month: "Jan", revenue: 240000, expenses: 110000 },
    { month: "Feb", revenue: 265000, expenses: 118000 },
    { month: "Mar", revenue: 285000, expenses: 125000 },
  ],
  dealsByStatus: [
    { status: "Completed", count: 24, value: 1200000 },
    { status: "Active", count: 8, value: 650000 },
    { status: "Pending", count: 5, value: 420000 },
  ],
};
