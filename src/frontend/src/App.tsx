import { useAuth } from "@/auth";
import { Toaster } from "@/components/ui/sonner";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { GroupProvider, useGroup } from "@/context/GroupContext";
import GroupHub from "@/pages/GroupHub";
import LandingPage from "@/pages/LandingPage";
import AdminContributions from "@/pages/admin/AdminContributions";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminGroups from "@/pages/admin/AdminGroups";
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
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

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

// Group Hub (post-login group selection/creation)
const groupHubRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/group-hub",
  component: GroupHubWrapper,
});

function GroupHubWrapper() {
  const { isAuthenticated, isInitializing } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <GroupHub />;
}

// Admin Layout route
const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminLayoutWrapper,
});

function AdminLayoutWrapper() {
  const { isAuthenticated, isInitializing } = useAuth();
  const { myGroups, isLoading } = useGroup();
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitializing || isLoading) return;
    if (!isAuthenticated) {
      navigate({ to: "/" });
      return;
    }
    if (!isLoading && myGroups.length === 0) {
      navigate({ to: "/group-hub" });
    }
  }, [isAuthenticated, isInitializing, isLoading, myGroups, navigate]);

  if (isInitializing || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (myGroups.length === 0) return null;

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

const adminGroupsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/groups",
  component: AdminGroups,
});

// Member Layout route
const memberLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/member",
  component: MemberLayoutWrapper,
});

function MemberLayoutWrapper() {
  const { isAuthenticated, isInitializing } = useAuth();
  const { myGroups, isLoading } = useGroup();
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitializing || isLoading) return;
    if (!isAuthenticated) {
      navigate({ to: "/" });
      return;
    }
    if (!isLoading && myGroups.length === 0) {
      navigate({ to: "/group-hub" });
    }
  }, [isAuthenticated, isInitializing, isLoading, myGroups, navigate]);

  if (isInitializing || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (myGroups.length === 0) return null;

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
  groupHubRoute,
  adminLayoutRoute.addChildren([
    adminIndexRoute,
    adminDashboardRoute,
    adminMembersRoute,
    adminLoansRoute,
    adminContributionsRoute,
    adminTransactionsRoute,
    adminSettingsRoute,
    adminGroupsRoute,
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

function AppProviders() {
  return (
    <CurrencyProvider>
      <GroupProvider>
        <RouterProvider router={router} />
      </GroupProvider>
    </CurrencyProvider>
  );
}

export default function App() {
  return <AppProviders />;
}
