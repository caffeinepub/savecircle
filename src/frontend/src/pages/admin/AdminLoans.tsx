import type { Loan } from "@/backend.d";
import { StatusBadge } from "@/components/StatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  useCloseLoan,
  useCreateLoan,
  useGroupMembers,
  useLoans,
} from "@/hooks/useQueries";
import { formatCurrency, formatDate } from "@/utils/format";
import { Principal } from "@icp-sdk/core/principal";
import { CreditCard, Loader2, Plus, Search, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminLoans() {
  const { activeGroup } = useGroup();
  const groupId = activeGroup?.id;

  const { data: loans, isLoading: loansLoading } = useLoans(groupId);
  const { data: members } = useGroupMembers(groupId);
  const createLoan = useCreateLoan();
  const closeLoan = useCloseLoan();

  const { currency } = useCurrency();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  // Form
  const [selectedMemberPrincipal, setSelectedMemberPrincipal] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");

  // Build a name lookup by principal string
  const memberNameMap = Object.fromEntries(
    (members ?? []).map((m) => [
      m.memberPrincipal.toText(),
      m.memberName || `${m.memberPrincipal.toText().slice(0, 10)}...`,
    ]),
  );

  const filtered = (loans ?? []).filter((l) => {
    const memberName = memberNameMap[l.memberPrincipal.toText()] ?? "";
    return (
      memberName.toLowerCase().includes(search.toLowerCase()) ||
      l.id.includes(search) ||
      l.status.toLowerCase().includes(search.toLowerCase())
    );
  });

  async function handleCreate() {
    if (!selectedMemberPrincipal || !principalAmount) {
      toast.error("Please select a member and enter an amount.");
      return;
    }
    const amount = Number.parseFloat(principalAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    try {
      const principal = Principal.fromText(selectedMemberPrincipal);
      await createLoan.mutateAsync({
        memberPrincipal: principal,
        principalAmount: amount,
      });
      toast.success("Loan created successfully.");
      setCreateOpen(false);
      setSelectedMemberPrincipal("");
      setPrincipalAmount("");
    } catch {
      toast.error("Failed to create loan.");
    }
  }

  async function handleClose() {
    if (!selectedLoan) return;
    try {
      await closeLoan.mutateAsync(selectedLoan.id);
      toast.success("Loan closed successfully.");
      setCloseOpen(false);
    } catch {
      toast.error("Failed to close loan.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Loans
          </h1>
          <p className="text-sm text-muted-foreground">
            {loans?.length ?? 0} total loans
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-brand hover:bg-brand-dark text-white"
          data-ocid="loan.create_button"
          disabled={!groupId}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Loan
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by member, loan ID, or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-ocid="loans.search_input"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card shadow-card overflow-hidden"
      >
        {loansLoading ? (
          <div className="p-6 space-y-3" data-ocid="loans.loading_state">
            {Array.from({ length: 5 }, (_, i) => i).map((i) => (
              <Skeleton key={`sk-${i}`} className="h-14 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20"
            data-ocid="loans.empty_state"
          >
            <CreditCard className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">No loans found</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {search ? "Try adjusting your search" : "Create the first loan"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table data-ocid="admin.loans_table">
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/30 border-border">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pl-5">
                    Member
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Principal
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Outstanding
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">
                    Rate
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">
                    Start Date
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pr-4 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((loan, i) => (
                  <TableRow
                    key={loan.id}
                    data-ocid={`loans.item.${i + 1}`}
                    className="hover:bg-muted/30 border-border"
                  >
                    <TableCell className="pl-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {memberNameMap[loan.memberPrincipal.toText()] ??
                            "Unknown"}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground/60">
                          {loan.id.slice(0, 10)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {formatCurrency(loan.principalAmount, currency)}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-brand">
                      {formatCurrency(loan.outstandingBalance, currency)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                      {loan.interestRatePercent}%/mo
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                      {formatDate(loan.startDate)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={loan.status} />
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      {loan.status.toLowerCase() === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLoan(loan);
                            setCloseOpen(true);
                          }}
                          data-ocid={`loans.close.button.${i + 1}`}
                          className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive hover:text-white"
                        >
                          <XCircle className="mr-1 h-3 w-3" />
                          Close
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>

      {/* Create Loan Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent data-ocid="loan.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Create New Loan</DialogTitle>
            <DialogDescription>
              Select a member and enter the loan principal amount.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Member *</Label>
              <Select
                value={selectedMemberPrincipal}
                onValueChange={setSelectedMemberPrincipal}
              >
                <SelectTrigger data-ocid="loan.select">
                  <SelectValue placeholder="Select a member..." />
                </SelectTrigger>
                <SelectContent>
                  {(members ?? [])
                    .filter((m) => m.isActive)
                    .map((m) => (
                      <SelectItem
                        key={m.memberPrincipal.toText()}
                        value={m.memberPrincipal.toText()}
                      >
                        {m.memberName ||
                          `${m.memberPrincipal.toText().slice(0, 16)}...`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Principal Amount ({currency.symbol}) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 5000.00"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                data-ocid="loan.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              data-ocid="loan.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createLoan.isPending}
              className="bg-brand hover:bg-brand-dark text-white"
              data-ocid="loan.confirm_button"
            >
              {createLoan.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Loan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Loan Confirmation */}
      <AlertDialog open={closeOpen} onOpenChange={setCloseOpen}>
        <AlertDialogContent data-ocid="loan.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Close Loan
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to close this loan for{" "}
              <strong>
                {selectedLoan
                  ? (memberNameMap[selectedLoan.memberPrincipal.toText()] ??
                    "Unknown")
                  : "Unknown"}
              </strong>
              ? Outstanding balance:{" "}
              <strong>
                {formatCurrency(
                  selectedLoan?.outstandingBalance ?? 0,
                  currency,
                )}
              </strong>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="loan.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClose}
              className="bg-destructive hover:bg-destructive/90 text-white"
              data-ocid="loan.confirm_button"
            >
              {closeLoan.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Close Loan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
