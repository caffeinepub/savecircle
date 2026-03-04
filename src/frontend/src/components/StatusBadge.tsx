import { cn } from "@/lib/utils";

type StatusBadgeVariant =
  | "paid"
  | "pending"
  | "partial"
  | "active"
  | "closed"
  | "contribution"
  | "interest"
  | "principal"
  | "penalty"
  | "inactive";

const variantStyles: Record<StatusBadgeVariant, string> = {
  paid: "bg-success-subtle text-success-fg",
  pending: "bg-warning-subtle text-warning-fg",
  partial: "bg-info-subtle text-info-fg",
  active: "bg-success-subtle text-success-fg",
  closed: "bg-muted text-muted-foreground",
  inactive: "bg-muted text-muted-foreground",
  contribution: "bg-success-subtle text-success-fg",
  interest: "bg-brand-subtle text-brand",
  principal: "bg-info-subtle text-info-fg",
  penalty: "bg-destructive-subtle text-destructive-fg",
};

const variantLabels: Record<string, string> = {
  paid: "Paid",
  pending: "Pending",
  partial: "Partial",
  active: "Active",
  closed: "Closed",
  inactive: "Inactive",
  contribution: "Contribution",
  interest: "Interest",
  principal: "Principal",
  penalty: "Penalty",
  principal_repayment: "Principal",
  loan_interest: "Interest",
  monthly_contribution: "Contribution",
  late_penalty: "Penalty",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status
    .toLowerCase()
    .replace(/[_\s]/g, "_") as StatusBadgeVariant;

  // Map transaction types to badge variants
  let variant: StatusBadgeVariant = "pending";
  const s = status.toLowerCase();
  if (s === "paid") variant = "paid";
  else if (s === "pending") variant = "pending";
  else if (s === "partial") variant = "partial";
  else if (s === "active") variant = "active";
  else if (s === "closed") variant = "closed";
  else if (s === "inactive") variant = "inactive";
  else if (s.includes("contribution") || s === "contribution")
    variant = "contribution";
  else if (s.includes("interest") || s === "interest") variant = "interest";
  else if (s.includes("principal") || s === "principal") variant = "principal";
  else if (s.includes("penalty") || s === "penalty") variant = "penalty";

  const styles = variantStyles[variant] ?? "bg-muted text-muted-foreground";
  const label = variantLabels[s] ?? variantLabels[normalizedStatus] ?? status;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        styles,
        className,
      )}
    >
      {label}
    </span>
  );
}
