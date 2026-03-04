import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
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
import { useMyContributions, usePayContribution } from "@/hooks/useQueries";
import {
  formatCurrency,
  formatDate,
  formatMonthYear,
  getCurrentMonthYear,
  getMonthName,
} from "@/utils/format";
import { Loader2, Receipt } from "lucide-react";
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

export default function MemberContributions() {
  const { activeGroup } = useGroup();
  const groupId = activeGroup?.id;

  const { data: contributions, isLoading } = useMyContributions(groupId);
  const payContrib = usePayContribution();

  const { currency } = useCurrency();
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [payOpen, setPayOpen] = useState(false);
  const [payMonth, setPayMonth] = useState(currentMonth);
  const [payYear, setPayYear] = useState(currentYear);
  const [payAmount, setPayAmount] = useState("");

  const sorted = [...(contributions ?? [])].sort((a, b) => {
    if (a.year !== b.year) return Number(b.year - a.year);
    return Number(b.month - a.month);
  });

  function openPay() {
    setPayAmount(String(activeGroup?.monthlyContribution ?? ""));
    setPayOpen(true);
  }

  async function handlePay() {
    const amount = Number.parseFloat(payAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount.");
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            My Contributions
          </h1>
          <p className="text-sm text-muted-foreground">
            {contributions?.length ?? 0} contribution records
          </p>
        </div>
        <Button
          onClick={openPay}
          className="bg-brand hover:bg-brand-dark text-white"
          data-ocid="member.pay_contribution_button"
          disabled={!groupId}
        >
          <Receipt className="mr-2 h-4 w-4" />
          Pay Contribution
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card shadow-card overflow-hidden"
      >
        {isLoading ? (
          <div
            className="p-6 space-y-3"
            data-ocid="contributions.loading_state"
          >
            {Array.from({ length: 4 }, (_, i) => i).map((i) => (
              <Skeleton key={`sk-${i}`} className="h-12 w-full" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20"
            data-ocid="contributions.empty_state"
          >
            <Receipt className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">
              No contribution records
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Your payments will appear here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/30 border-border">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pl-5">
                    Period
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Amount
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">
                    Paid Date
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pr-4 text-right">
                    Penalty
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((c, i) => (
                  <TableRow
                    key={c.id}
                    data-ocid={`contributions.item.${i + 1}`}
                    className="hover:bg-muted/30 border-border"
                  >
                    <TableCell className="pl-5 py-3.5 text-sm font-medium text-foreground">
                      {formatMonthYear(c.month, c.year)}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-foreground">
                      {formatCurrency(c.amount, currency)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                      {c.paidDate ? formatDate(c.paidDate) : "—"}
                    </TableCell>
                    <TableCell className="pr-4 text-right text-sm">
                      {c.penaltyAmount > 0 ? (
                        <span className="font-semibold text-destructive-fg">
                          {formatCurrency(c.penaltyAmount, currency)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>

      {/* Pay Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent data-ocid="contribution.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Pay Contribution</DialogTitle>
            <DialogDescription>
              Select the period and enter the amount to pay.
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
