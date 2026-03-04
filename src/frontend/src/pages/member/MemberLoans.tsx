import type { Loan } from "@/backend.d";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/context/CurrencyContext";
import { useGroup } from "@/context/GroupContext";
import {
  useMyLoans,
  usePayLoanInterest,
  useRepayPrincipal,
} from "@/hooks/useQueries";
import { formatCurrency, formatDate, formatPercent } from "@/utils/format";
import { CreditCard, Loader2, RefreshCw, TrendingDown } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

export default function MemberLoans() {
  const { activeGroup } = useGroup();
  const groupId = activeGroup?.id;

  const { data: loans, isLoading } = useMyLoans(groupId);
  const payInterest = usePayLoanInterest();
  const repayPrincipal = useRepayPrincipal();

  const { currency } = useCurrency();
  const [interestOpen, setInterestOpen] = useState(false);
  const [principalOpen, setPrincipalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [interestAmount, setInterestAmount] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");

  function openInterest(loan: Loan) {
    setSelectedLoan(loan);
    setInterestAmount("");
    setInterestOpen(true);
  }

  function openPrincipal(loan: Loan) {
    setSelectedLoan(loan);
    setPrincipalAmount("");
    setPrincipalOpen(true);
  }

  async function handlePayInterest() {
    if (!selectedLoan) return;
    const amount = Number.parseFloat(interestAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    try {
      await payInterest.mutateAsync({ loanId: selectedLoan.id, amount });
      toast.success("Interest payment processed!");
      setInterestOpen(false);
    } catch {
      toast.error("Failed to process interest payment.");
    }
  }

  async function handleRepayPrincipal() {
    if (!selectedLoan) return;
    const amount = Number.parseFloat(principalAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    if (amount > selectedLoan.outstandingBalance) {
      toast.error("Amount cannot exceed outstanding balance.");
      return;
    }
    try {
      await repayPrincipal.mutateAsync({ loanId: selectedLoan.id, amount });
      toast.success("Principal repayment processed!");
      setPrincipalOpen(false);
    } catch {
      toast.error("Failed to process repayment.");
    }
  }

  const activeLoans = (loans ?? []).filter(
    (l) => l.status.toLowerCase() === "active",
  );
  const closedLoans = (loans ?? []).filter(
    (l) => l.status.toLowerCase() !== "active",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          My Loans
        </h1>
        <p className="text-sm text-muted-foreground">
          {activeLoans.length} active · {closedLoans.length} closed
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4" data-ocid="loans.loading_state">
          {Array.from({ length: 2 }, (_, i) => i).map((i) => (
            <Skeleton key={`sk-${i}`} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : (loans ?? []).length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20 shadow-card"
          data-ocid="loans.empty_state"
        >
          <CreditCard className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="font-medium text-muted-foreground">No loans</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            You have no active or past loans
          </p>
        </div>
      ) : (
        <>
          {activeLoans.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Active Loans
              </h2>
              {activeLoans.map((loan, i) => {
                const repaidPercent =
                  loan.principalAmount > 0
                    ? Math.round(
                        ((loan.principalAmount - loan.outstandingBalance) /
                          loan.principalAmount) *
                          100,
                      )
                    : 0;
                return (
                  <motion.div
                    key={loan.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card
                      data-ocid={`loans.item.${i + 1}`}
                      className="shadow-card hover:shadow-card-md transition-shadow"
                    >
                      <CardContent className="p-5">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-brand" />
                                <span className="font-display text-base font-semibold text-foreground">
                                  Loan
                                </span>
                                <StatusBadge status={loan.status} />
                              </div>
                              <p className="mt-1 text-xs font-mono text-muted-foreground/50">
                                ID: {loan.id.slice(0, 16)}...
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                Started
                              </p>
                              <p className="text-sm font-medium text-foreground">
                                {formatDate(loan.startDate)}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Principal
                              </p>
                              <p className="mt-0.5 text-base font-semibold text-foreground">
                                {formatCurrency(loan.principalAmount, currency)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Outstanding
                              </p>
                              <p className="mt-0.5 text-base font-semibold text-brand">
                                {formatCurrency(
                                  loan.outstandingBalance,
                                  currency,
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Interest Rate
                              </p>
                              <p className="mt-0.5 text-base font-semibold text-foreground">
                                {formatPercent(loan.interestRatePercent)}/mo
                              </p>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-xs text-muted-foreground">
                                Repayment Progress
                              </p>
                              <p className="text-xs font-semibold text-foreground">
                                {repaidPercent}%
                              </p>
                            </div>
                            <Progress value={repaidPercent} className="h-2" />
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openInterest(loan)}
                              data-ocid={`member.pay_interest_button.${i + 1}`}
                              className="border-brand/30 text-brand hover:bg-brand hover:text-white"
                            >
                              <TrendingDown className="mr-1.5 h-3.5 w-3.5" />
                              Pay Interest
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPrincipal(loan)}
                              data-ocid={`member.repay_principal_button.${i + 1}`}
                              className="border-brand/30 text-brand hover:bg-brand hover:text-white"
                            >
                              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                              Repay Principal
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {closedLoans.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Closed Loans
              </h2>
              {closedLoans.map((loan, i) => (
                <Card
                  key={loan.id}
                  data-ocid={`loans.closed.item.${i + 1}`}
                  className="shadow-card opacity-70"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">
                            Closed Loan
                          </span>
                          <StatusBadge status="closed" />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Started: {formatDate(loan.startDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Principal
                        </p>
                        <p className="text-base font-semibold text-muted-foreground">
                          {formatCurrency(loan.principalAmount, currency)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Pay Interest Dialog */}
      <Dialog open={interestOpen} onOpenChange={setInterestOpen}>
        <DialogContent data-ocid="loan.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              Pay Loan Interest
            </DialogTitle>
            <DialogDescription>
              Enter the interest amount you want to pay for this loan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selectedLoan && (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                <p className="text-muted-foreground">
                  Outstanding Balance:{" "}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(selectedLoan.outstandingBalance, currency)}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Interest Rate:{" "}
                  <span className="font-semibold text-foreground">
                    {formatPercent(selectedLoan.interestRatePercent)}/month
                  </span>
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Amount ({currency.symbol})</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 150.00"
                value={interestAmount}
                onChange={(e) => setInterestAmount(e.target.value)}
                data-ocid="loan.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInterestOpen(false)}
              data-ocid="loan.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayInterest}
              disabled={payInterest.isPending}
              className="bg-brand hover:bg-brand-dark text-white"
              data-ocid="loan.confirm_button"
            >
              {payInterest.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Pay Interest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Repay Principal Dialog */}
      <Dialog open={principalOpen} onOpenChange={setPrincipalOpen}>
        <DialogContent data-ocid="loan.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Repay Principal</DialogTitle>
            <DialogDescription>
              Enter the amount to repay. You can make a full or partial payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selectedLoan && (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                <p className="text-muted-foreground">
                  Outstanding Balance:{" "}
                  <span className="font-semibold text-brand">
                    {formatCurrency(selectedLoan.outstandingBalance, currency)}
                  </span>
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Repayment Amount ({currency.symbol})</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder={`Max: ${formatCurrency(selectedLoan?.outstandingBalance ?? 0, currency)}`}
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                data-ocid="loan.input"
              />
              {selectedLoan && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-brand"
                  onClick={() =>
                    setPrincipalAmount(String(selectedLoan.outstandingBalance))
                  }
                >
                  Pay full balance (
                  {formatCurrency(selectedLoan.outstandingBalance, currency)})
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPrincipalOpen(false)}
              data-ocid="loan.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRepayPrincipal}
              disabled={repayPrincipal.isPending}
              className="bg-brand hover:bg-brand-dark text-white"
              data-ocid="loan.confirm_button"
            >
              {repayPrincipal.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Repay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
