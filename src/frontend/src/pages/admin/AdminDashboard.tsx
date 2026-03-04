import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrency } from "@/context/CurrencyContext";
import { useGroup } from "@/context/GroupContext";
import {
  useGroupMembers,
  useGroupSummary,
  useLoans,
  useRunMonthlyInterest,
} from "@/hooks/useQueries";
import {
  formatCurrency,
  getCurrentMonthYear,
  getMonthName,
} from "@/utils/format";
import {
  AlertCircle,
  BarChart3,
  CreditCard,
  DollarSign,
  Loader2,
  PlayCircle,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: getMonthName(i + 1),
}));
const YEARS = Array.from(
  { length: 5 },
  (_, i) => new Date().getFullYear() - 2 + i,
);

function SummaryCard({
  title,
  value,
  icon: Icon,
  subtitle,
  accent,
  delay,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  subtitle?: string;
  accent: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="shadow-card hover:shadow-card-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {title}
              </p>
              <p className="mt-1.5 font-display text-2xl font-bold text-foreground">
                {value}
              </p>
              {subtitle && (
                <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div className={`rounded-xl p-2.5 ${accent}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { activeGroup } = useGroup();
  const groupId = activeGroup?.id;

  const { data: summary, isLoading: summaryLoading } = useGroupSummary(groupId);
  const { data: members, isLoading: membersLoading } = useGroupMembers(groupId);
  const { data: loans, isLoading: loansLoading } = useLoans(groupId);
  const runInterest = useRunMonthlyInterest();

  const { currency } = useCurrency();
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  async function handleRunInterest() {
    try {
      const txs = await runInterest.mutateAsync({
        month: selectedMonth,
        year: selectedYear,
      });
      toast.success(
        `Monthly interest calculated! ${txs.length} transaction(s) created.`,
      );
    } catch {
      toast.error("Failed to run interest calculation.");
    }
  }

  const activeLoans =
    loans?.filter((l) => l.status.toLowerCase() === "active") ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          {activeGroup
            ? `${activeGroup.name} — ${getMonthName(currentMonth)} ${currentYear}`
            : `${getMonthName(currentMonth)} ${currentYear} — Group Financial Overview`}
        </p>
      </div>

      {/* Summary Cards */}
      {summaryLoading ? (
        <div
          className="grid grid-cols-2 gap-4 lg:grid-cols-3"
          data-ocid="dashboard.loading_state"
        >
          {Array.from({ length: 6 }, (_, i) => i).map((i) => (
            <Card key={`sk-${i}`} className="shadow-card">
              <CardContent className="p-5">
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <SummaryCard
            title="Total Group Fund"
            value={formatCurrency(summary?.totalFund ?? 0, currency)}
            icon={DollarSign}
            subtitle="Available balance"
            accent="bg-brand-subtle text-brand"
            delay={0}
          />
          <SummaryCard
            title="Loans Outstanding"
            value={formatCurrency(
              summary?.totalLoansOutstanding ?? 0,
              currency,
            )}
            icon={CreditCard}
            subtitle={`${summary?.activeLoans ?? 0} active loans`}
            accent="bg-info-subtle text-info-fg"
            delay={0.05}
          />
          <SummaryCard
            title="Monthly Interest"
            value={formatCurrency(
              summary?.monthlyInterestEarned ?? 0,
              currency,
            )}
            icon={TrendingUp}
            subtitle="Earned this month"
            accent="bg-success-subtle text-success-fg"
            delay={0.1}
          />
          <SummaryCard
            title="Total Penalties"
            value={formatCurrency(summary?.totalPenalties ?? 0, currency)}
            icon={AlertCircle}
            subtitle="All time"
            accent="bg-destructive-subtle text-destructive-fg"
            delay={0.15}
          />
          <SummaryCard
            title="Total Members"
            value={String(summary?.memberCount ?? 0)}
            icon={Users}
            subtitle="In this group"
            accent="bg-brand-subtle text-brand"
            delay={0.2}
          />
          <SummaryCard
            title="Active Loans"
            value={String(summary?.activeLoans ?? 0)}
            icon={BarChart3}
            subtitle="Outstanding"
            accent="bg-warning-subtle text-warning-fg"
            delay={0.25}
          />
        </div>
      )}

      {/* Run Monthly Interest */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="shadow-card border-brand/20 bg-brand-subtle">
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display font-semibold text-foreground">
                  Monthly Interest Calculation
                </h3>
                <p className="text-sm text-muted-foreground">
                  Apply monthly interest charges to all active loans for the
                  selected period.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={String(selectedMonth)}
                  onValueChange={(v) => setSelectedMonth(Number(v))}
                >
                  <SelectTrigger
                    className="w-36 bg-white"
                    data-ocid="dashboard.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={String(m.value)}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={String(selectedYear)}
                  onValueChange={(v) => setSelectedYear(Number(v))}
                >
                  <SelectTrigger
                    className="w-28 bg-white"
                    data-ocid="dashboard.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleRunInterest}
                  disabled={runInterest.isPending || !groupId}
                  className="bg-brand hover:bg-brand-dark text-white"
                  data-ocid="dashboard.primary_button"
                >
                  {runInterest.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PlayCircle className="mr-2 h-4 w-4" />
                  )}
                  Run Calculation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Member Status */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base font-semibold">
                Member Status
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {getMonthName(currentMonth)} {currentYear}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {membersLoading ? (
                <div
                  className="p-4 space-y-3"
                  data-ocid="members.loading_state"
                >
                  {Array.from({ length: 4 }, (_, i) => i).map((i) => (
                    <Skeleton key={`sk-${i}`} className="h-10 w-full" />
                  ))}
                </div>
              ) : members && members.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table data-ocid="admin.contributions_table">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-border">
                        <TableHead className="text-xs font-semibold text-muted-foreground pl-4">
                          Member
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">
                          Status
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground pr-4">
                          Joined
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.slice(0, 8).map((member, i) => (
                        <TableRow
                          key={member.memberPrincipal.toText()}
                          data-ocid={`members.item.${i + 1}`}
                          className="hover:bg-muted/40 border-border"
                        >
                          <TableCell className="pl-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {member.memberName || "—"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {member.memberEmail}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={member.isActive ? "active" : "inactive"}
                            />
                          </TableCell>
                          <TableCell className="pr-4 text-xs text-muted-foreground">
                            {new Date(
                              Number(member.joinedAt) / 1_000_000,
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center py-12 text-center"
                  data-ocid="members.empty_state"
                >
                  <Users className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">
                    No members yet
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    Share the group code to invite members
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Loans Overview */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base font-semibold">
                Active Loans Overview
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {activeLoans.length} outstanding
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {loansLoading ? (
                <div className="p-4 space-y-3" data-ocid="loans.loading_state">
                  {Array.from({ length: 3 }, (_, i) => i).map((i) => (
                    <Skeleton key={`sk-${i}`} className="h-10 w-full" />
                  ))}
                </div>
              ) : activeLoans.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table data-ocid="admin.loans_table">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-border">
                        <TableHead className="text-xs font-semibold text-muted-foreground pl-4">
                          Loan ID
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">
                          Principal
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">
                          Outstanding
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground pr-4">
                          Rate
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeLoans.slice(0, 6).map((loan, i) => (
                        <TableRow
                          key={loan.id}
                          data-ocid={`loans.item.${i + 1}`}
                          className="hover:bg-muted/40 border-border"
                        >
                          <TableCell className="pl-4 py-3">
                            <span className="text-xs font-mono text-muted-foreground">
                              {loan.id.slice(0, 8)}...
                            </span>
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {formatCurrency(loan.principalAmount, currency)}
                          </TableCell>
                          <TableCell className="text-sm font-semibold text-brand">
                            {formatCurrency(loan.outstandingBalance, currency)}
                          </TableCell>
                          <TableCell className="pr-4 text-sm text-muted-foreground">
                            {loan.interestRatePercent}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center py-12 text-center"
                  data-ocid="loans.empty_state"
                >
                  <CreditCard className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">
                    No active loans
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    Create a loan from the Loans page
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
