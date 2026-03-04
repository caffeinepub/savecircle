import { useAuth } from "@/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

// ─── Group Summary ────────────────────────────────────────────────────────────
export function useGroupSummary() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["groupSummary"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getGroupSummary();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Members ─────────────────────────────────────────────────────────────────
export function useMembers() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMembers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddMember() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      email,
      phone,
    }: { name: string; email: string; phone: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addMember(name, email, phone);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      qc.invalidateQueries({ queryKey: ["groupSummary"] });
    },
  });
}

export function useEditMember() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      email,
      phone,
      isActive,
    }: {
      id: string;
      name: string;
      email: string;
      phone: string;
      isActive: boolean;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.editMember(id, name, email, phone, isActive);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useDeleteMember() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteMember(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      qc.invalidateQueries({ queryKey: ["groupSummary"] });
    },
  });
}

// ─── Loans ────────────────────────────────────────────────────────────────────
export function useLoans() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["loans"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listLoans();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateLoan() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      memberId,
      principalAmount,
    }: { memberId: string; principalAmount: number }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createLoan(memberId, principalAmount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loans"] });
      qc.invalidateQueries({ queryKey: ["groupSummary"] });
    },
  });
}

export function useCloseLoan() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (loanId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.closeLoan(loanId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loans"] });
      qc.invalidateQueries({ queryKey: ["groupSummary"] });
    },
  });
}

// ─── Contributions ────────────────────────────────────────────────────────────
export function useAllContributions() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allContributions"],
    queryFn: async () => {
      if (!actor) return [];
      // Get contributions for all members via their transactions
      const members = await actor.listMembers();
      const results = await Promise.all(
        members.map((m) => actor.getMemberTransactions(m.id)),
      );
      return { members, transactions: results.flat() };
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRecordContribution() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      memberId,
      amount,
      month,
      year,
    }: { memberId: string; amount: number; month: number; year: number }) => {
      if (!actor) throw new Error("Not connected");
      return actor.recordContribution(
        memberId,
        amount,
        BigInt(month),
        BigInt(year),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allContributions"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["groupSummary"] });
    },
  });
}

export function useApplyPenalty() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      memberId,
      month,
      year,
      penaltyAmount,
    }: {
      memberId: string;
      month: number;
      year: number;
      penaltyAmount: number;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.applyPenalty(
        memberId,
        BigInt(month),
        BigInt(year),
        penaltyAmount,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allContributions"] });
      qc.invalidateQueries({ queryKey: ["groupSummary"] });
    },
  });
}

// ─── Transactions ─────────────────────────────────────────────────────────────
export function useAllTransactions() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTransactions();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export function useGroupSettings() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["groupSettings"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getGroupSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateGroupSettings() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      monthlyContribution,
      interestRatePercent,
      penaltyRatePercent,
    }: {
      monthlyContribution: number;
      interestRatePercent: number;
      penaltyRatePercent: number;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateGroupSettings(
        monthlyContribution,
        interestRatePercent,
        penaltyRatePercent,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groupSettings"] });
    },
  });
}

export function useRunMonthlyInterest() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ month, year }: { month: number; year: number }) => {
      if (!actor) throw new Error("Not connected");
      return actor.runMonthlyInterestCalculation(BigInt(month), BigInt(year));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["loans"] });
      qc.invalidateQueries({ queryKey: ["groupSummary"] });
    },
  });
}

// ─── Member self-service ──────────────────────────────────────────────────────
export function useMyProfile() {
  const { actor, isFetching } = useActor();
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["myProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyProfile();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
  });
}

export function useMyLoans() {
  const { actor, isFetching } = useActor();
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["myLoans"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyLoans();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
  });
}

export function useMyContributions() {
  const { actor, isFetching } = useActor();
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["myContributions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyContributions();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
  });
}

export function useMyTransactions() {
  const { actor, isFetching } = useActor();
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["myTransactions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyTransactions();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
  });
}

export function useMyOutstandingBalance() {
  const { actor, isFetching } = useActor();
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["myOutstandingBalance"],
    queryFn: async () => {
      if (!actor) return 0;
      return actor.getMyOutstandingBalance();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
  });
}

export function usePayContribution() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      amount,
      month,
      year,
    }: { amount: number; month: number; year: number }) => {
      if (!actor) throw new Error("Not connected");
      return actor.payContribution(amount, BigInt(month), BigInt(year));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myContributions"] });
      qc.invalidateQueries({ queryKey: ["myTransactions"] });
    },
  });
}

export function usePayLoanInterest() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      loanId,
      amount,
    }: { loanId: string; amount: number }) => {
      if (!actor) throw new Error("Not connected");
      return actor.payLoanInterest(loanId, amount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myLoans"] });
      qc.invalidateQueries({ queryKey: ["myTransactions"] });
      qc.invalidateQueries({ queryKey: ["myOutstandingBalance"] });
    },
  });
}

export function useRepayPrincipal() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      loanId,
      amount,
    }: { loanId: string; amount: number }) => {
      if (!actor) throw new Error("Not connected");
      return actor.repayPrincipal(loanId, amount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myLoans"] });
      qc.invalidateQueries({ queryKey: ["myTransactions"] });
      qc.invalidateQueries({ queryKey: ["myOutstandingBalance"] });
    },
  });
}
