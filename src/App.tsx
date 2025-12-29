import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Machines from "./pages/Machines";
import MachineDetails from "./pages/MachineDetails";
import Tasks from "./pages/Tasks";
import TaskDetails from "./pages/TaskDetails";
import DailyReport from "./pages/Dailyreport";
import NewMachine from "./pages/NewMachine";
import AssignTask from "./pages/AssignTask";
import AdminApproval from "./pages/Adminapprovel";
import Settings from "./pages/Settings";
import Calendar from "./pages/Calendar";
import ProtectedRoute from "./components/ProtectedRoute";
import useAuthStore from "./store/authStore";

// Role-based default redirect component
const RoleBasedRedirect = () => {
  const { user } = useAuthStore();

  if (user?.pageAccess === "Admin") {
    return <Navigate to="/dashboard" replace />;
  } else if (user?.pageAccess === "User" || user?.pageAccess === "Viewer") {
    if (user.allowedPages && user.allowedPages.length > 0) {
      const pageToPath: { [key: string]: string } = {
        "Dashboard": "/dashboard",
        "Machines": "/machines",
        "Assign Task": "/assign-task",
        "Tasks": "/tasks",
        "Admin Approval": "/admin-approval",
        "Daily Report": "/daily-report",
        "Calendar": "/calendar",
        "Settings": "/settings"
      };
      const firstPage = user.allowedPages[0];
      const path = pageToPath[firstPage] || "/machines";
      return <Navigate to={path} replace />;
    }
    return <Navigate to="/settings" replace />;
  } else {
    // Fallback for users without a defined role
    return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<RoleBasedRedirect />} />

          {/* Admin only routes */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute requiredPage="Dashboard">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="assign-task"
            element={
              <ProtectedRoute requiredPage="Assign Task">
                <AssignTask />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin-approval"
            element={
              <ProtectedRoute requiredPage="Admin Approval">
                <AdminApproval />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Shared routes - both admin and user */}
          <Route path="machines" element={
            <ProtectedRoute requiredPage="Machines">
              <Machines />
            </ProtectedRoute>
          } />
          <Route path="machines/new" element={
            <ProtectedRoute requiredPage="Machines">
              <NewMachine />
            </ProtectedRoute>
          } />
          <Route path="machines/:id" element={
            <ProtectedRoute requiredPage="Machines">
              <MachineDetails />
            </ProtectedRoute>
          } />
          <Route path="machines/:id/edit" element={
            <ProtectedRoute requiredPage="Machines">
              <NewMachine />
            </ProtectedRoute>
          } />
          <Route path="tasks" element={
            <ProtectedRoute requiredPage="Tasks">
              <Tasks />
            </ProtectedRoute>
          } />
          <Route path="tasks/:id" element={
            <ProtectedRoute requiredPage="Tasks">
              <TaskDetails />
            </ProtectedRoute>
          } />
          <Route path="daily-report" element={
            <ProtectedRoute requiredPage="Daily Report">
              <DailyReport />
            </ProtectedRoute>
          } />
          <Route path="calendar" element={
            <ProtectedRoute requiredPage="Calendar">
              <Calendar />
            </ProtectedRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;