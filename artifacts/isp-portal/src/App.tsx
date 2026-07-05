import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import "@/lib/auth";

// Pages
import LoginPage from "@/pages/LoginPage";
import CustomerDashboard from "@/pages/customer/DashboardPage";
import CustomerPackages from "@/pages/customer/PackagesPage";
import CustomerPayments from "@/pages/customer/PaymentsPage";
import CustomerComplaints from "@/pages/customer/ComplaintsPage";
import AdminDashboard from "@/pages/admin/DashboardPage";
import AdminCustomers from "@/pages/admin/CustomersPage";
import CustomerDetailPage from "@/pages/admin/CustomerDetailPage";
import AddCustomerPage from "@/pages/admin/AddCustomerPage";
import ImportCustomersPage from "@/pages/admin/ImportCustomersPage";
import AdminSettingsPage from "@/pages/admin/SettingsPage";
import CustomerSettingsPage from "@/pages/customer/SettingsPage";
import AdminPackages from "@/pages/admin/PackagesPage";
import AdminSubscriptions from "@/pages/admin/SubscriptionsPage";
import AdminPayments from "@/pages/admin/PaymentsPage";
import AdminComplaints from "@/pages/admin/ComplaintsPage";
import AdminAnnouncements from "@/pages/admin/AnnouncementsPage";
import AdminZones from "@/pages/admin/ZonesPage";

// Layouts
import { CustomerLayout } from "@/components/layouts/CustomerLayout";
import { AdminLayout } from "@/components/layouts/AdminLayout";

import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
});

function CustomerRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, navigate] = useLocation();
  if (isLoading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) { navigate("/login"); return null; }
  if (user?.role === "admin") { navigate("/admin/dashboard"); return null; }
  return <CustomerLayout><Component /></CustomerLayout>;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, navigate] = useLocation();
  if (isLoading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) { navigate("/login"); return null; }
  if (user?.role !== "admin") { navigate("/dashboard"); return null; }
  return <AdminLayout><Component /></AdminLayout>;
}

function RootRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, navigate] = useLocation();
  if (isLoading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) { navigate("/login"); return null; }
  if (user?.role === "admin") { navigate("/admin/dashboard"); return null; }
  navigate("/dashboard");
  return null;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />

      {/* Customer routes */}
      <Route path="/dashboard" component={() => <CustomerRoute component={CustomerDashboard} />} />
      <Route path="/packages" component={() => <CustomerRoute component={CustomerPackages} />} />
      <Route path="/payments" component={() => <CustomerRoute component={CustomerPayments} />} />
      <Route path="/complaints" component={() => <CustomerRoute component={CustomerComplaints} />} />
      <Route path="/settings" component={() => <CustomerRoute component={CustomerSettingsPage} />} />

      {/* Admin routes */}
      <Route path="/admin/dashboard" component={() => <AdminRoute component={AdminDashboard} />} />
      <Route path="/admin/customers/new" component={() => <AdminRoute component={AddCustomerPage} />} />
      <Route path="/admin/customers/import" component={() => <AdminRoute component={ImportCustomersPage} />} />
      <Route path="/admin/customers/:id" component={() => <AdminRoute component={CustomerDetailPage} />} />
      <Route path="/admin/customers" component={() => <AdminRoute component={AdminCustomers} />} />
      <Route path="/admin/packages" component={() => <AdminRoute component={AdminPackages} />} />
      <Route path="/admin/subscriptions" component={() => <AdminRoute component={AdminSubscriptions} />} />
      <Route path="/admin/payments" component={() => <AdminRoute component={AdminPayments} />} />
      <Route path="/admin/complaints" component={() => <AdminRoute component={AdminComplaints} />} />
      <Route path="/admin/announcements" component={() => <AdminRoute component={AdminAnnouncements} />} />
      <Route path="/admin/settings" component={() => <AdminRoute component={AdminSettingsPage} />} />
      <Route path="/admin/zones" component={() => <AdminRoute component={AdminZones} />} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
