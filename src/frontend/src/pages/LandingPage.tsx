import { useAuth, useIsAdmin } from "@/auth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Coins,
  FileText,
  Loader2,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

const features = [
  {
    icon: Coins,
    title: "Automated Savings",
    description:
      "Track monthly contributions effortlessly. Members get notified, statuses update in real-time, and penalties are applied automatically for late payments.",
    color: "bg-brand-subtle text-brand",
  },
  {
    icon: TrendingUp,
    title: "Smart Loan Management",
    description:
      "Create and manage group loans with configurable interest rates. Monthly interest is calculated automatically and outstanding balances stay always up-to-date.",
    color: "bg-success-subtle text-success-fg",
  },
  {
    icon: BarChart3,
    title: "Financial Reports",
    description:
      "Complete transparency with real-time group fund totals, loan summaries, transaction ledgers, and member payment status dashboards.",
    color: "bg-info-subtle text-info-fg",
  },
];

const stats = [
  { value: "100%", label: "Automated tracking" },
  { value: "0", label: "Excel spreadsheets needed" },
  { value: "Real-time", label: "Balance updates" },
  { value: "Secure", label: "Role-based access" },
];

export default function LandingPage() {
  const { isAuthenticated, login, isInitializing } = useAuth();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Redirect after login
  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        navigate({ to: "/admin/dashboard" });
      } else {
        navigate({ to: "/member/dashboard" });
      }
    }
  }, [isAuthenticated, isAdmin, navigate]);

  function handleLogin() {
    setIsLoggingIn(true);
    login();
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
              <Coins className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              SaveCircle
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleLogin}
              disabled={isLoggingIn || isInitializing}
              className="bg-brand hover:bg-brand-dark text-white"
              data-ocid="auth.login_button"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        {/* Background accent */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-64 -top-64 h-[600px] w-[600px] rounded-full bg-brand-subtle opacity-60" />
          <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-brand-subtle opacity-40" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-brand-subtle px-4 py-1.5 text-sm font-medium text-brand"
            >
              <Shield className="h-3.5 w-3.5" />
              Trusted by community savings groups
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl"
            >
              Smart savings.
              <br />
              <span className="text-brand">Transparent loans.</span>
              <br />
              Trusted by communities.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl"
            >
              Replace messy Excel spreadsheets with a modern, automated platform
              for managing group savings, loans, interest, and payments — all in
              one place.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            >
              <Button
                size="lg"
                onClick={handleLogin}
                disabled={isLoggingIn || isInitializing}
                className="bg-brand hover:bg-brand-dark text-white px-8 text-base font-semibold shadow-md"
                data-ocid="auth.login_button"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                No credit card required. Free to use.
              </p>
            </motion.div>
          </div>

          {/* Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 overflow-hidden rounded-2xl border border-border shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-border bg-muted px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-destructive opacity-60" />
              <div className="h-3 w-3 rounded-full bg-warning-subtle" />
              <div className="h-3 w-3 rounded-full bg-success opacity-60" />
              <span className="ml-4 text-xs text-muted-foreground">
                savecircle.app/admin/dashboard
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-background p-6 sm:grid-cols-4">
              {[
                {
                  label: "Total Group Fund",
                  value: "$48,350.00",
                  color: "text-brand",
                },
                { label: "Active Loans", value: "7", color: "text-foreground" },
                {
                  label: "Monthly Interest",
                  value: "$1,240.00",
                  color: "text-success-fg",
                },
                { label: "Members", value: "24", color: "text-foreground" },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-lg border border-border bg-card p-4 shadow-xs"
                >
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p
                    className={`mt-1 text-xl font-semibold font-display ${card.color}`}
                  >
                    {card.value}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-brand py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="font-display text-3xl font-bold text-white">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-white/75">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              Everything your savings group needs
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Built specifically for community finance groups. Automate the
              boring stuff, focus on growing together.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="rounded-xl border border-border bg-card p-8 shadow-card transition-shadow hover:shadow-card-md"
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color}`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Role benefits */}
      <section className="bg-background py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-12 lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                Designed for admins and members alike
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Role-based access ensures every user sees exactly what they need
                — nothing more, nothing less.
              </p>
              <div className="mt-8 space-y-6">
                <div>
                  <h4 className="flex items-center gap-2 font-semibold text-foreground">
                    <Users className="h-4 w-4 text-brand" />
                    Admin Dashboard
                  </h4>
                  <ul className="mt-3 space-y-2">
                    {[
                      "Manage members and their roles",
                      "Create and close loans",
                      "Record and verify contributions",
                      "Run monthly interest calculations",
                      "Adjust records and apply penalties",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="flex items-center gap-2 font-semibold text-foreground">
                    <Shield className="h-4 w-4 text-brand" />
                    Member Portal
                  </h4>
                  <ul className="mt-3 space-y-2">
                    {[
                      "Pay monthly contributions",
                      "View outstanding loan balance",
                      "Make principal repayments",
                      "Pay loan interest",
                      "View full transaction history",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  title: "Total Fund",
                  value: "$48,350",
                  sub: "+$2,400 this month",
                  accent: "bg-brand-subtle border-brand/20",
                },
                {
                  title: "Loans Outstanding",
                  value: "$12,000",
                  sub: "7 active loans",
                  accent: "bg-info-subtle border-info/20",
                },
                {
                  title: "Interest Earned",
                  value: "$1,240",
                  sub: "This month",
                  accent: "bg-success-subtle border-success/20",
                },
                {
                  title: "Penalties",
                  value: "$320",
                  sub: "4 late payments",
                  accent: "bg-destructive-subtle border-destructive/20",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className={`rounded-xl border p-5 ${card.accent}`}
                >
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {card.title}
                  </p>
                  <p className="mt-2 font-display text-2xl font-bold text-foreground">
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {card.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <FileText className="mx-auto mb-6 h-12 w-12 text-white/80" />
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Ready to modernize your savings group?
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Get started in minutes. No spreadsheets, no manual calculations.
          </p>
          <Button
            size="lg"
            onClick={handleLogin}
            disabled={isLoggingIn || isInitializing}
            className="mt-8 bg-white text-brand hover:bg-white/90 px-8 text-base font-semibold"
            data-ocid="auth.login_button"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Start Managing Your Group
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-brand">
                <Coins className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-display text-sm font-bold text-foreground">
                SaveCircle
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()}. Built with{" "}
              <span className="text-brand">♥</span> using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand hover:underline"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
