import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import "./index.css";
import { AuthProvider, useAuth } from "./lib/auth";
import { Shell } from "./components/Shell";
import { PortalShell } from "./components/PortalShell";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Channel from "./pages/Channel";
import PortalDashboard from "./pages/portal/PortalDashboard";
import PortalApply from "./pages/portal/PortalApply";
import PortalApplications from "./pages/portal/PortalApplications";
import PortalLoans from "./pages/portal/PortalLoans";
import PortalDocuments from "./pages/portal/PortalDocuments";
import PortalSupport from "./pages/portal/PortalSupport";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import Telecall from "./pages/Telecall";
import Customers from "./pages/Customers";
import Customer360 from "./pages/Customer360";
import Applications from "./pages/Applications";
import ApplicationWorkspace from "./pages/ApplicationWorkspace";
import Underwriting from "./pages/Underwriting";
import BREBuilder from "./pages/BREBuilder";
import CreditRisk from "./pages/CreditRisk";
import Loans from "./pages/Loans";
import LoanWorkspace from "./pages/LoanWorkspace";
import Payments from "./pages/Payments";
import Collections from "./pages/Collections";
import Compliance from "./pages/Compliance";
import AuditLog from "./pages/AuditLog";
import Reports from "./pages/Reports";
import Risk from "./pages/Risk";
import AI from "./pages/AI";
import Network from "./pages/Network";
import Integrations from "./pages/Integrations";
import Admin from "./pages/Admin";

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f6f6f7]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-brand-600 animate-pulse" />
          <span className="text-[13px] text-zinc-500 font-medium">Loading NEXUS…</span>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  // Customer accounts land in the customer portal; staff see the operations shell
  if (user.role === "customer") return <PortalShell>{children}</PortalShell>;
  return <Shell>{children}</Shell>;
}

function Home() {
  const { user } = useAuth();
  return user?.role === "customer" ? <PortalDashboard /> : <Dashboard />;
}

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/app" element={<Protected><Home /></Protected>} />
          <Route path="/leads" element={<Protected><Leads /></Protected>} />
          <Route path="/leads/:id" element={<Protected><LeadDetail /></Protected>} />
          <Route path="/telecall" element={<Protected><Telecall /></Protected>} />
          <Route path="/customers" element={<Protected><Customers /></Protected>} />
          <Route path="/customers/:id" element={<Protected><Customer360 /></Protected>} />
          <Route path="/applications" element={<Protected><Applications /></Protected>} />
          <Route path="/applications/:id" element={<Protected><ApplicationWorkspace /></Protected>} />
          <Route path="/underwriting" element={<Protected><Underwriting /></Protected>} />
          <Route path="/bre" element={<Protected><BREBuilder /></Protected>} />
          <Route path="/credit" element={<Protected><CreditRisk /></Protected>} />
          <Route path="/loans" element={<Protected><Loans /></Protected>} />
          <Route path="/loans/:id" element={<Protected><LoanWorkspace /></Protected>} />
          <Route path="/payments" element={<Protected><Payments /></Protected>} />
          <Route path="/collections" element={<Protected><Collections /></Protected>} />
          <Route path="/compliance" element={<Protected><Compliance /></Protected>} />
          <Route path="/audit" element={<Protected><AuditLog /></Protected>} />
          <Route path="/reports" element={<Protected><Reports /></Protected>} />
          <Route path="/risk" element={<Protected><Risk /></Protected>} />
          <Route path="/ai" element={<Protected><AI /></Protected>} />
          <Route path="/network" element={<Protected><Network /></Protected>} />
          <Route path="/integrations" element={<Protected><Integrations /></Protected>} />
          <Route path="/admin" element={<Protected><Admin /></Protected>} />
          <Route path="/channel" element={<Protected><Channel /></Protected>} />
          <Route path="/portal" element={<Protected><PortalDashboard /></Protected>} />
          <Route path="/portal/apply" element={<Protected><PortalApply /></Protected>} />
          <Route path="/portal/applications" element={<Protected><PortalApplications /></Protected>} />
          <Route path="/portal/applications/:id" element={<Protected><PortalApplications /></Protected>} />
          <Route path="/portal/loans" element={<Protected><PortalLoans /></Protected>} />
          <Route path="/portal/loans/:id" element={<Protected><PortalLoans /></Protected>} />
          <Route path="/portal/documents" element={<Protected><PortalDocuments /></Protected>} />
          <Route path="/portal/support" element={<Protected><PortalSupport /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
