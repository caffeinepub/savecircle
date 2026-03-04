import { useAuth, useIsAdmin } from "@/auth";
import { Toaster } from "@/components/ui/sonner";
import LandingPage from "@/pages/LandingPage";
import AdminContributions from "@/pages/admin/AdminContributions";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminLoans from "@/pages/admin/AdminLoans";
import AdminMembers from "@/pages/admin/AdminMembers";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminTransactions from "@/pages/admin/AdminTransactions";
import MemberContributions from "@/pages/member/MemberContributions";
import MemberDashboard from "@/pages/member/MemberDashboard";
import MemberLayout from "@/pages/member/MemberLayout";
import MemberLoans from "@/pages/member/MemberLoans";
import MemberTransactions from "@/pages/member/MemberTransactions";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";

// Root
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
    </>
  ),
});

// Landing
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

// Admin Layout route
const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminLayoutWrapper,
});

function AdminLayoutWrapper() {
  const { isAuthenticated } = useAuth();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate({ to: "/" });
    return null;
  }
  if (!isAdmin) {
    navigate({ to: "/member/dashboard" });
    return null;
  }
  return <AdminLayout />;
}

const adminIndexRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/",
  component: AdminDashboard,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/dashboard",
  component: AdminDashboard,
});

const adminMembersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/members",
  component: AdminMembers,
});

const adminLoansRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/loans",
  component: AdminLoans,
});

const adminContributionsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/contributions",
  component: AdminContributions,
});

const adminTransactionsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/transactions",
  component: AdminTransactions,
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/settings",
  component: AdminSettings,
});

// Member Layout route
const memberLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/member",
  component: MemberLayoutWrapper,
});

function MemberLayoutWrapper() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate({ to: "/" });
    return null;
  }
  return <MemberLayout />;
}

const memberIndexRoute = createRoute({
  getParentRoute: () => memberLayoutRoute,
  path: "/",
  component: MemberDashboard,
});

const memberDashboardRoute = createRoute({
  getParentRoute: () => memberLayoutRoute,
  path: "/dashboard",
  component: MemberDashboard,
});

const memberLoansRoute = createRoute({
  getParentRoute: () => memberLayoutRoute,
  path: "/loans",
  component: MemberLoans,
});

const memberContributionsRoute = createRoute({
  getParentRoute: () => memberLayoutRoute,
  path: "/contributions",
  component: MemberContributions,
});

const memberTransactionsRoute = createRoute({
  getParentRoute: () => memberLayoutRoute,
  path: "/transactions",
  component: MemberTransactions,
});

// Router
const routeTree = rootRoute.addChildren([
  indexRoute,
  adminLayoutRoute.addChildren([
    adminIndexRoute,
    adminDashboardRoute,
    adminMembersRoute,
    adminLoansRoute,
    adminContributionsRoute,
    adminTransactionsRoute,
    adminSettingsRoute,
  ]),
  memberLayoutRoute.addChildren([
    memberIndexRoute,
    memberDashboardRoute,
    memberLoansRoute,
    memberContributionsRoute,
    memberTransactionsRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
