import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/context/CurrencyContext";
import { useGroup } from "@/context/GroupContext";
import {
  useMyContributions,
  useMyOutstandingBalance,
  useMyTransactions,
  usePayContribution,
  useUserProfile,
} from "@/hooks/useQueries";
import {
  formatCurrency,
  formatDate,
  getCurrentMonthYear,
  getMonthName,
} from "@/utils/format";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  DollarSign,
  Loader2,
  Receipt,
  TrendingUp,
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

export default function MemberDashboard() {
  const navigate = useNavigate();
  const { activeGroup } = useGroup();
  const groupId = activeGroup?.id;

  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: balance, isLoading: balanceLoading } =
    useMyOutstandingBalance(groupId);
  const { data: contributions, isLoading: contribLoading } =
    useMyContributions(groupId);
  const { data: transactions, isLoading: txLoading } =
    useMyTransactions(groupId);
  const payContrib = usePayContribution();

  const { currency } = useCurrency();
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [payOpen, setPayOpen] = useState(false);
  const [payMonth, setPayMonth] = useState(currentMonth);
  const [payYear, setPayYear] = useState(currentYear);
  const [payAmount, setPayAmount] = useState("");

  const totalContributions = (contributions ?? []).reduce(
    (sum, c) => sum + c.amount,
    0,
  );

  const recentTxs = (transactions ?? [])
    .sort((a, b) => Number(b.date - a.date))
    .slice(0, 5);

  function openPay() {
    setPayAmount(String(activeGroup?.monthlyContribution ?? ""));
    setPayOpen(true);
  }

  async function handlePay() {
    const amount = Number.parseFloat(payAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    try {
      await payContrib.mutateAsync({ amount, month: payMonth, year: payYear });
      toast.success("Contribution paid successfully!");
      setPayOpen(false);
    } catch {
      toast.error("Failed to process contribution.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        {profileLoading ? (
          <Skeleton className="h-8 w-48" />
        ) : (
          <h1 className="font-display text-2xl font-bold text-foreground">
            Welcome back, {profile?.name ?? "Member"} 👋
          </h1>
        )}
        <p className="text-sm text-muted-foreground">
          {activeGroup?.name ? `${activeGroup.name} — ` : ""}
          {getMonthName(currentMonth)} {currentYear}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Outstanding Balance
                  </p>
                  {balanceLoading ? (
                    <Skeleton
                      className="mt-2 h-8 w-28"
                      data-ocid="balance.loading_state"
                    />
                  ) : (
                    <p className="mt-1.5 font-display text-2xl font-bold text-brand">
                      {formatCurrency(balance ?? 0, currency)}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Active loan balance
                  </p>
                </div>
                <div className="rounded-xl bg-brand-subtle p-2.5">
                  <DollarSign className="h-5 w-5 text-brand" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Total Contributions
                  </p>
                  {contribLoading ? (
                    <Skeleton
                      className="mt-2 h-8 w-28"
                      data-ocid="contributions.loading_state"
                    />
                  ) : (
                    <p className="mt-1.5 font-display text-2xl font-bold text-foreground">
                      {formatCurrency(totalContributions, currency)}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {contributions?.length ?? 0} payment(s)
                  </p>
                </div>
                <div className="rounded-xl bg-success-subtle p-2.5">
                  <TrendingUp className="h-5 w-5 text-success-fg" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Due This Month
                  </p>
                  <p className="mt-1.5 font-display text-2xl font-bold text-foreground">
                    {formatCurrency(
                      activeGroup?.monthlyContribution ?? 0,
                      currency,
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Monthly contribution
                  </p>
                </div>
                <div className="rounded-xl bg-info-subtle p-2.5">
                  <Receipt className="h-5 w-5 text-info-fg" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="shadow-card border-brand/20 bg-brand-subtle">
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display font-semibold text-foreground">
                  Quick Actions
                </h3>
                <p className="text-sm text-muted-foreground">
                  Pay your monthly contribution or manage your loan
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={openPay}
                  className="bg-brand hover:bg-brand-dark text-white"
                  data-ocid="member.pay_contribution_button"
                  disabled={!groupId}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Pay Contribution
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: "/member/loans" })}
                  className="border-brand/30 text-brand hover:bg-brand hover:text-white"
                  data-ocid="member.secondary_button"
                >
                  View Loans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base font-semibold">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {txLoading ? (
              <div className="p-4 space-y-3" data-ocid="activity.loading_state">
                {Array.from({ length: 4 }, (_, i) => i).map((i) => (
                  <Skeleton key={`sk-${i}`} className="h-12 w-full" />
                ))}
              </div>
            ) : recentTxs.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-12"
                data-ocid="activity.empty_state"
              >
                <Receipt className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">
                  No transactions yet
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentTxs.map((tx, i) => (
                  <div
                    key={tx.id}
                    data-ocid={`activity.item.${i + 1}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {tx.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(tx.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <StatusBadge status={tx.transactionType} />
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(tx.amount, currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Pay Contribution Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent data-ocid="contribution.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              Pay Monthly Contribution
            </DialogTitle>
            <DialogDescription>
              Select the month and year for your contribution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Month</Label>
                <Select
                  value={String(payMonth)}
                  onValueChange={(v) => setPayMonth(Number(v))}
                >
                  <SelectTrigger data-ocid="contribution.select">
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
              </div>
              <div className="space-y-1.5">
                <Label>Year</Label>
                <Select
                  value={String(payYear)}
                  onValueChange={(v) => setPayYear(Number(v))}
                >
                  <SelectTrigger data-ocid="contribution.select">
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
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Amount ({currency.symbol})</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                data-ocid="contribution.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPayOpen(false)}
              data-ocid="contribution.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePay}
              disabled={payContrib.isPending}
              className="bg-brand hover:bg-brand-dark text-white"
              data-ocid="contribution.confirm_button"
            >
              {payContrib.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Pay Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
