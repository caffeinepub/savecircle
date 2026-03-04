import { useAuth } from "@/auth";
import type { Group, GroupMembership, UserProfile } from "@/backend.d";
import { useGroup } from "@/context/GroupContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

// ─── My Groups ────────────────────────────────────────────────────────────────
export function useMyGroups() {
  const { actor, isFetching } = useActor();
  return useQuery<Group[]>({
    queryKey: ["myGroups"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMyGroups();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateGroup() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      description,
    }: { name: string; description: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createGroup(name, description);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myGroups"] });
    },
  });
}

export function useJoinGroup() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupCode: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.joinGroup(groupCode);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myGroups"] });
    },
  });
}

export function useLeaveGroup() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.leaveGroup(groupId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myGroups"] });
    },
  });
}

export function useDeleteGroup() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteGroup(groupId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myGroups"] });
    },
  });
}

// ─── Group Summary ────────────────────────────────────────────────────────────
export function useGroupSummary(groupId?: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["groupSummary", groupId],
    queryFn: async () => {
      if (!actor || !groupId) return null;
      return actor.getGroupSummary(groupId);
    },
    enabled: !!actor && !isFetching && !!groupId,
  });
}

// ─── Group Members ────────────────────────────────────────────────────────────
export function useGroupMembers(groupId?: string) {
  const { actor, isFetching } = useActor();
  return useQuery<GroupMembership[]>({
    queryKey: ["groupMembers", groupId],
    queryFn: async () => {
      if (!actor || !groupId) return [];
      return actor.listGroupMembers(groupId);
    },
    enabled: !!actor && !isFetching && !!groupId,
  });
}

export function useRemoveMember() {
  const { actor } = useActor();
  const { activeGroup } = useGroup();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      memberPrincipal,
    }: { memberPrincipal: import("@icp-sdk/core/principal").Principal }) => {
      if (!actor || !activeGroup) throw new Error("Not connected");
      return actor.removeMember(activeGroup.id, memberPrincipal);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groupMembers", activeGroup?.id] });
      qc.invalidateQueries({ queryKey: ["groupSummary", activeGroup?.id] });
    },
  });
}

export function useUpdateMemberStatus() {
  const { actor } = useActor();
  const { activeGroup } = useGroup();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      memberPrincipal,
      isActive,
    }: {
      memberPrincipal: import("@icp-sdk/core/principal").Principal;
      isActive: boolean;
    }) => {
      if (!actor || !activeGroup) throw new Error("Not connected");
      return actor.updateMemberStatus(
        activeGroup.id,
        memberPrincipal,
        isActive,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groupMembers", activeGroup?.id] });
    },
  });
}

// ─── Loans ────────────────────────────────────────────────────────────────────
export function useLoans(groupId?: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["loans", groupId],
    queryFn: async () => {
      if (!actor || !groupId) return [];
      return actor.listLoans(groupId);
    },
    enabled: !!actor && !isFetching && !!groupId,
  });
}

export function useCreateLoan() {
  const { actor } = useActor();
  const { activeGroup } = useGroup();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      memberPrincipal,
      principalAmount,
    }: {
      memberPrincipal: import("@icp-sdk/core/principal").Principal;
      principalAmount: number;
    }) => {
      if (!actor || !activeGroup) throw new Error("Not connected");
      return actor.createLoan(activeGroup.id, memberPrincipal, principalAmount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loans", activeGroup?.id] });
      qc.invalidateQueries({ queryKey: ["groupSummary", activeGroup?.id] });
    },
  });
}

export function useCloseLoan() {
  const { actor } = useActor();
  const { activeGroup } = useGroup();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (loanId: string) => {
      if (!actor || !activeGroup) throw new Error("Not connected");
      return actor.closeLoan(activeGroup.id, loanId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loans", activeGroup?.id] });
      qc.invalidateQueries({ queryKey: ["groupSummary", activeGroup?.id] });
    },
  });
}

// ─── Contributions ────────────────────────────────────────────────────────────
export function useRecordContribution() {
  const { actor } = useActor();
  const { activeGroup } = useGroup();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      memberPrincipal,
      amount,
      month,
      year,
    }: {
      memberPrincipal: import("@icp-sdk/core/principal").Principal;
      amount: number;
      month: number;
      year: number;
    }) => {
      if (!actor || !activeGroup) throw new Error("Not connected");
      return actor.recordContribution(
        activeGroup.id,
        memberPrincipal,
        amount,
        BigInt(month),
        BigInt(year),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allTransactions", activeGroup?.id] });
      qc.invalidateQueries({ queryKey: ["groupSummary", activeGroup?.id] });
    },
  });
}

export function useApplyPenalty() {
  const { actor } = useActor();
  const { activeGroup } = useGroup();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      memberPrincipal,
      month,
      year,
      penaltyAmount,
    }: {
      memberPrincipal: import("@icp-sdk/core/principal").Principal;
      month: number;
      year: number;
      penaltyAmount: number;
    }) => {
      if (!actor || !activeGroup) throw new Error("Not connected");
      return actor.applyPenalty(
        activeGroup.id,
        memberPrincipal,
        BigInt(month),
        BigInt(year),
        penaltyAmount,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allTransactions", activeGroup?.id] });
      qc.invalidateQueries({ queryKey: ["groupSummary", activeGroup?.id] });
    },
  });
}

// ─── Transactions ─────────────────────────────────────────────────────────────
export function useAllTransactions(groupId?: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allTransactions", groupId],
    queryFn: async () => {
      if (!actor || !groupId) return [];
      return actor.getAllTransactions(groupId);
    },
    enabled: !!actor && !isFetching && !!groupId,
  });
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export function useUpdateGroupSettings() {
  const { actor } = useActor();
  const { activeGroup } = useGroup();
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
      if (!actor || !activeGroup) throw new Error("Not connected");
      return actor.updateGroupSettings(
        activeGroup.id,
        monthlyContribution,
        interestRatePercent,
        penaltyRatePercent,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myGroups"] });
    },
  });
}

export function useRunMonthlyInterest() {
  const { actor } = useActor();
  const { activeGroup } = useGroup();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ month, year }: { month: number; year: number }) => {
      if (!actor || !activeGroup) throw new Error("Not connected");
      return actor.runMonthlyInterestCalculation(
        activeGroup.id,
        BigInt(month),
        BigInt(year),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allTransactions", activeGroup?.id] });
      qc.invalidateQueries({ queryKey: ["loans", activeGroup?.id] });
      qc.invalidateQueries({ queryKey: ["groupSummary", activeGroup?.id] });
    },
  });
}

// ─── User Profile ─────────────────────────────────────────────────────────────
export function useUserProfile() {
  const { actor, isFetching } = useActor();
  const { isAuthenticated } = useAuth();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
  });
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

// Keep alias for backward compat in MemberLayout
export const useMyProfile = useUserProfile;

// ─── Member Self-Service ──────────────────────────────────────────────────────
export function useMyGroupProfile(groupId?: string) {
  const { actor, isFetching } = useActor();
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["myGroupProfile", groupId],
    queryFn: async () => {
      if (!actor || !groupId) return null;
      return actor.getMyGroupProfile(groupId);
    },
    enabled: !!actor && !isFetching && isAuthenticated && !!groupId,
  });
}

export function useMyLoans(groupId?: string) {
  const { actor, isFetching } = useActor();
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["myLoans", groupId],
    queryFn: async () => {
      if (!actor || !groupId) return [];
      return actor.getMyLoans(groupId);
    },
    enabled: !!actor && !isFetching && isAuthenticated && !!groupId,
  });
}

export function useMyContributions(groupId?: string) {
  const { actor, isFetching } = useActor();
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["myContributions", groupId],
    queryFn: async () => {
      if (!actor || !groupId) return [];
      return actor.getMyContributions(groupId);
    },
    enabled: !!actor && !isFetching && isAuthenticated && !!groupId,
  });
}

export function useMyTransactions(groupId?: string) {
  const { actor, isFetching } = useActor();
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["myTransactions", groupId],
    queryFn: async () => {
      if (!actor || !groupId) return [];
      return actor.getMyTransactions(groupId);
    },
    enabled: !!actor && !isFetching && isAuthenticated && !!groupId,
  });
}

export function useMyOutstandingBalance(groupId?: string) {
  const { actor, isFetching } = useActor();
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["myOutstandingBalance", groupId],
    queryFn: async () => {
      if (!actor || !groupId) return 0;
      return actor.getMyOutstandingBalance(groupId);
    },
    enabled: !!actor && !isFetching && isAuthenticated && !!groupId,
  });
}

export function usePayContribution() {
  const { actor } = useActor();
  const { activeGroup } = useGroup();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      amount,
      month,
      year,
    }: { amount: number; month: number; year: number }) => {
      if (!actor || !activeGroup) throw new Error("Not connected");
      return actor.payContribution(
        activeGroup.id,
        amount,
        BigInt(month),
        BigInt(year),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myContributions", activeGroup?.id] });
      qc.invalidateQueries({ queryKey: ["myTransactions", activeGroup?.id] });
    },
  });
}

export function usePayLoanInterest() {
  const { actor } = useActor();
  const { activeGroup } = useGroup();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      loanId,
      amount,
    }: { loanId: string; amount: number }) => {
      if (!actor || !activeGroup) throw new Error("Not connected");
      return actor.payLoanInterest(activeGroup.id, loanId, amount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myLoans", activeGroup?.id] });
      qc.invalidateQueries({ queryKey: ["myTransactions", activeGroup?.id] });
      qc.invalidateQueries({
        queryKey: ["myOutstandingBalance", activeGroup?.id],
      });
    },
  });
}

export function useRepayPrincipal() {
  const { actor } = useActor();
  const { activeGroup } = useGroup();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      loanId,
      amount,
    }: { loanId: string; amount: number }) => {
      if (!actor || !activeGroup) throw new Error("Not connected");
      return actor.repayPrincipal(activeGroup.id, loanId, amount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myLoans", activeGroup?.id] });
      qc.invalidateQueries({ queryKey: ["myTransactions", activeGroup?.id] });
      qc.invalidateQueries({
        queryKey: ["myOutstandingBalance", activeGroup?.id],
      });
    },
  });
}
