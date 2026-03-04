import { useAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useGroup } from "@/context/GroupContext";
import { cn } from "@/lib/utils";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  ChevronRight,
  Coins,
  CreditCard,
  Layers,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Receipt,
  Settings,
  Users,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/admin/dashboard",
    ocid: "nav.dashboard_link",
  },
  {
    label: "Members",
    icon: Users,
    path: "/admin/members",
    ocid: "nav.members_link",
  },
  {
    label: "Loans",
    icon: CreditCard,
    path: "/admin/loans",
    ocid: "nav.loans_link",
  },
  {
    label: "Contributions",
    icon: Receipt,
    path: "/admin/contributions",
    ocid: "nav.contributions_link",
  },
  {
    label: "Transactions",
    icon: ListChecks,
    path: "/admin/transactions",
    ocid: "nav.transactions_link",
  },
  {
    label: "My Groups",
    icon: Layers,
    path: "/admin/groups",
    ocid: "nav.groups_link",
  },
  {
    label: "Settings",
    icon: Settings,
    path: "/admin/settings",
    ocid: "nav.settings_link",
  },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const router = useRouterState();
  const currentPath = router.location.pathname;

  return (
    <nav className="flex-1 space-y-1 p-3">
      {navItems.map((item) => {
        const isActive =
          currentPath === item.path ||
          (item.path === "/admin/dashboard" && currentPath === "/admin");
        return (
          <button
            type="button"
            key={item.path}
            data-ocid={item.ocid}
            onClick={() => {
              navigate({ to: item.path });
              onNavigate?.();
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-brand text-white shadow-sm"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
            {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5" />}
          </button>
        );
      })}
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { logout, principal } = useAuth();
  const { activeGroup } = useGroup();
  const navigate = useNavigate();

  const principalStr = principal?.toString() ?? "";
  const shortPrincipal = principalStr
    ? `${principalStr.slice(0, 8)}...${principalStr.slice(-4)}`
    : "Admin";

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand shadow-sm">
            <Coins className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-display text-lg font-bold text-sidebar-foreground">
              SaveCircle
            </span>
            <p className="text-[10px] text-sidebar-foreground/50 -mt-0.5">
              Admin Portal
            </p>
          </div>
        </div>
        {/* Active group info */}
        {activeGroup && (
          <div className="mt-3 rounded-lg bg-sidebar-accent/40 border border-sidebar-border px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-sidebar-foreground/50 mb-0.5">
              Active Group
            </p>
            <p className="text-sm font-semibold text-sidebar-foreground truncate">
              {activeGroup.name}
            </p>
            <p className="text-[10px] font-mono text-sidebar-foreground/60 mt-0.5">
              Code: {activeGroup.groupCode}
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            navigate({ to: "/group-hub" });
            onNavigate?.();
          }}
          data-ocid="nav.switch_group_button"
          className="mt-2 w-full h-7 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground justify-start px-2 gap-1.5"
        >
          <ArrowLeftRight className="h-3 w-3" />
          Switch Group
        </Button>
      </div>

      <Separator className="bg-sidebar-border" />

      <SidebarNav onNavigate={onNavigate} />

      <Separator className="bg-sidebar-border" />

      {/* User section */}
      <div className="p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-xs font-bold text-brand">
            A
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              Admin
            </p>
            <p className="truncate text-xs text-sidebar-foreground/50">
              {shortPrincipal}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            data-ocid="auth.logout_button"
            className="h-7 w-7 text-sidebar-foreground/50 hover:text-destructive"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border lg:flex flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-64 p-0 border-r border-sidebar-border"
        >
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="flex items-center gap-3 border-b border-border bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="text-foreground hover:text-brand transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-brand" />
            <span className="font-display text-base font-bold">SaveCircle</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-6 scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
