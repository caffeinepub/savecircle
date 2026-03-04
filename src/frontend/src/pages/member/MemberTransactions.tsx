import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
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
import { useMyTransactions } from "@/hooks/useQueries";
import { formatCurrency, formatDate } from "@/utils/format";
import { ListChecks, Search } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "contribution", label: "Contributions" },
  { value: "interest", label: "Interest" },
  { value: "principal", label: "Principal" },
  { value: "penalty", label: "Penalties" },
];

export default function MemberTransactions() {
  const { data: transactions, isLoading } = useMyTransactions();
  const { currency } = useCurrency();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = (transactions ?? [])
    .filter((t) => {
      const matchSearch =
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.transactionType.toLowerCase().includes(search.toLowerCase());
      const matchType =
        typeFilter === "all" ||
        t.transactionType.toLowerCase().includes(typeFilter);
      return matchSearch && matchType;
    })
    .sort((a, b) => Number(b.date - a.date));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          My Transactions
        </h1>
        <p className="text-sm text-muted-foreground">
          {transactions?.length ?? 0} total transactions
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-ocid="transactions.search_input"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44" data-ocid="transactions.select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card shadow-card overflow-hidden"
      >
        {isLoading ? (
          <div className="p-6 space-y-3" data-ocid="transactions.loading_state">
            {Array.from({ length: 5 }, (_, i) => i).map((i) => (
              <Skeleton key={`sk-${i}`} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20"
            data-ocid="transactions.empty_state"
          >
            <ListChecks className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">
              No transactions found
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {search || typeFilter !== "all"
                ? "Try adjusting your filters"
                : "Your transactions will appear here"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/30 border-border">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pl-5">
                    Date
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Type
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">
                    Description
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pr-4 text-right">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tx, i) => (
                  <TableRow
                    key={tx.id}
                    data-ocid={`transactions.item.${i + 1}`}
                    className="hover:bg-muted/30 border-border"
                  >
                    <TableCell className="pl-5 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(tx.date)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={tx.transactionType} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground max-w-xs truncate">
                      {tx.description}
                    </TableCell>
                    <TableCell className="pr-4 text-right text-sm font-semibold text-foreground">
                      {formatCurrency(tx.amount, currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
