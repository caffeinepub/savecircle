import type { Member } from "@/backend.d";
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
import {
  useApplyPenalty,
  useGroupSettings,
  useMembers,
  useRecordContribution,
} from "@/hooks/useQueries";
import {
  formatCurrency,
  getCurrentMonthYear,
  getMonthName,
} from "@/utils/format";
import { AlertTriangle, Loader2, Receipt } from "lucide-react";
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

export default function AdminContributions() {
  const { data: members, isLoading: membersLoading } = useMembers();
  const { data: settings } = useGroupSettings();
  const recordContrib = useRecordContribution();
  const applyPenalty = useApplyPenalty();

  const { currency } = useCurrency();
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterYear, setFilterYear] = useState(currentYear);

  const [recordOpen, setRecordOpen] = useState(false);
  const [penaltyOpen, setPenaltyOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [amount, setAmount] = useState("");
  const [penaltyAmount, setPenaltyAmount] = useState("");

  const defaultAmount = settings?.monthlyContribution ?? 0;

  function openRecord(member: Member) {
    setSelectedMember(member);
    setAmount(String(defaultAmount));
    setRecordOpen(true);
  }

  function openPenalty(member: Member) {
    setSelectedMember(member);
    setPenaltyAmount("");
    setPenaltyOpen(true);
  }

  async function handleRecord() {
    if (!selectedMember || !amount) return;
    const amt = Number.parseFloat(amount);
    if (Number.isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    try {
      await recordContrib.mutateAsync({
        memberId: selectedMember.id,
        amount: amt,
        month: filterMonth,
        year: filterYear,
      });
      toast.success(`Contribution recorded for ${selectedMember.name}.`);
      setRecordOpen(false);
    } catch {
      toast.error("Failed to record contribution.");
    }
  }

  async function handlePenalty() {
    if (!selectedMember || !penaltyAmount) return;
    const amt = Number.parseFloat(penaltyAmount);
    if (Number.isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid penalty amount.");
      return;
    }
    try {
      await applyPenalty.mutateAsync({
        memberId: selectedMember.id,
        month: filterMonth,
        year: filterYear,
        penaltyAmount: amt,
      });
      toast.success(`Penalty applied to ${selectedMember.name}.`);
      setPenaltyOpen(false);
    } catch {
      toast.error("Failed to apply penalty.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Contributions
          </h1>
          <p className="text-sm text-muted-foreground">
            Track monthly contributions for all members
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(filterMonth)}
            onValueChange={(v) => setFilterMonth(Number(v))}
          >
            <SelectTrigger className="w-36" data-ocid="contributions.select">
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
            value={String(filterYear)}
            onValueChange={(v) => setFilterYear(Number(v))}
          >
            <SelectTrigger className="w-28" data-ocid="contributions.select">
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

      {settings && (
        <div className="rounded-lg border border-border bg-brand-subtle p-4 flex items-center gap-3">
          <Receipt className="h-4 w-4 text-brand shrink-0" />
          <p className="text-sm text-muted-foreground">
            Monthly contribution:{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(settings.monthlyContribution, currency)}
            </span>{" "}
            per member
          </p>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card shadow-card overflow-hidden"
      >
        {membersLoading ? (
          <div
            className="p-6 space-y-3"
            data-ocid="contributions.loading_state"
          >
            {Array.from({ length: 5 }, (_, i) => i).map((i) => (
              <Skeleton key={`sk-${i}`} className="h-14 w-full" />
            ))}
          </div>
        ) : (members ?? []).length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20"
            data-ocid="contributions.empty_state"
          >
            <Receipt className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">
              No members found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table data-ocid="admin.contributions_table">
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/30 border-border">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pl-5">
                    Member
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Amount Due
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">
                    Period
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pr-4 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(members ?? [])
                  .filter((m) => m.isActive)
                  .map((member, i) => (
                    <TableRow
                      key={member.id}
                      data-ocid={`contributions.item.${i + 1}`}
                      className="hover:bg-muted/30 border-border"
                    >
                      <TableCell className="pl-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-xs font-bold text-brand">
                            {member.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {member.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-foreground">
                        {formatCurrency(
                          settings?.monthlyContribution ?? 0,
                          currency,
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {getMonthName(filterMonth)} {filterYear}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRecord(member)}
                            data-ocid="contribution.record_button"
                            className="h-7 text-xs border-brand/30 text-brand hover:bg-brand hover:text-white"
                          >
                            <Receipt className="mr-1 h-3 w-3" />
                            Record
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPenalty(member)}
                            data-ocid="contribution.penalty_button"
                            className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive hover:text-white"
                          >
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Penalty
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>

      {/* Record Contribution Dialog */}
      <Dialog open={recordOpen} onOpenChange={setRecordOpen}>
        <DialogContent data-ocid="contribution.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              Record Contribution
            </DialogTitle>
            <DialogDescription>
              Recording contribution for <strong>{selectedMember?.name}</strong>{" "}
              — {getMonthName(filterMonth)} {filterYear}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Amount ({currency.symbol}) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                data-ocid="contribution.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRecordOpen(false)}
              data-ocid="contribution.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRecord}
              disabled={recordContrib.isPending}
              className="bg-brand hover:bg-brand-dark text-white"
              data-ocid="contribution.confirm_button"
            >
              {recordContrib.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Penalty Dialog */}
      <Dialog open={penaltyOpen} onOpenChange={setPenaltyOpen}>
        <DialogContent data-ocid="contribution.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Apply Penalty</DialogTitle>
            <DialogDescription>
              Apply a late payment penalty to{" "}
              <strong>{selectedMember?.name}</strong> for{" "}
              {getMonthName(filterMonth)} {filterYear}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Penalty Amount ({currency.symbol}) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 50.00"
                value={penaltyAmount}
                onChange={(e) => setPenaltyAmount(e.target.value)}
                data-ocid="contribution.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPenaltyOpen(false)}
              data-ocid="contribution.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePenalty}
              disabled={applyPenalty.isPending}
              className="bg-destructive hover:bg-destructive/90 text-white"
              data-ocid="contribution.confirm_button"
            >
              {applyPenalty.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Apply Penalty
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
