import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import LeadsPage from "./components/leads/LeadsPage";
import TasksPage from "./components/tasks/TasksPage";
import FinancePage from "./components/finance/FinancePage";
import ManagePage from "./components/manage/ManagePage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "leads", Component: LeadsPage },
      { path: "tasks", Component: TasksPage },
      { path: "finance", Component: FinancePage },
      { path: "manage", Component: ManagePage },
    ],
  },
]);
