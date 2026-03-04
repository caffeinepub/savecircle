import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface GroupSummary {
    memberCount: bigint;
    totalFund: number;
    totalLoansOutstanding: number;
    totalPenalties: number;
    activeLoans: bigint;
    monthlyInterestEarned: number;
}
export interface GroupMembership {
    memberPrincipal: Principal;
    joinedAt: bigint;
    isActive: boolean;
    memberEmail: string;
    groupId: string;
    memberName: string;
    memberPhone: string;
}
export interface Loan {
    id: string;
    status: string;
    memberPrincipal: Principal;
    groupId: string;
    outstandingBalance: number;
    interestRatePercent: number;
    principalAmount: number;
    startDate: bigint;
}
export interface Group {
    id: string;
    penaltyRatePercent: number;
    name: string;
    createdAt: bigint;
    createdBy: Principal;
    description: string;
    interestRatePercent: number;
    groupCode: string;
    monthlyContribution: number;
}
export interface Contribution {
    id: string;
    status: string;
    month: bigint;
    memberPrincipal: Principal;
    penaltyAmount: number;
    year: bigint;
    paidDate?: bigint;
    groupId: string;
    amount: number;
}
export interface UserProfile {
    name: string;
    email: string;
    phone: string;
}
export interface Transaction {
    id: string;
    transactionType: string;
    relatedLoanId?: string;
    date: bigint;
    memberPrincipal: Principal;
    description: string;
    groupId: string;
    amount: number;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    adjustRecord(groupId: string, transactionId: string, newAmount: number, description: string): Promise<Transaction>;
    applyPenalty(groupId: string, memberPrincipal: Principal, month: bigint, year: bigint, penaltyAmount: number): Promise<Contribution>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    closeLoan(groupId: string, loanId: string): Promise<Loan>;
    createGroup(name: string, description: string): Promise<Group>;
    createLoan(groupId: string, memberPrincipal: Principal, principalAmount: number): Promise<Loan>;
    deleteGroup(groupId: string): Promise<boolean>;
    getAllTransactions(groupId: string): Promise<Array<Transaction>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getGroup(groupId: string): Promise<Group | null>;
    getGroupSummary(groupId: string): Promise<GroupSummary>;
    getMyContributions(groupId: string): Promise<Array<Contribution>>;
    getMyGroupProfile(groupId: string): Promise<GroupMembership | null>;
    getMyLoans(groupId: string): Promise<Array<Loan>>;
    getMyOutstandingBalance(groupId: string): Promise<number>;
    getMyTransactions(groupId: string): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    joinGroup(groupCode: string): Promise<Group>;
    leaveGroup(groupId: string): Promise<boolean>;
    listGroupMembers(groupId: string): Promise<Array<GroupMembership>>;
    listLoans(groupId: string): Promise<Array<Loan>>;
    listMyGroups(): Promise<Array<Group>>;
    payContribution(groupId: string, amount: number, month: bigint, year: bigint): Promise<Contribution>;
    payLoanInterest(groupId: string, loanId: string, amount: number): Promise<Transaction>;
    recordContribution(groupId: string, memberPrincipal: Principal, amount: number, month: bigint, year: bigint): Promise<Contribution>;
    removeMember(groupId: string, memberPrincipal: Principal): Promise<boolean>;
    repayPrincipal(groupId: string, loanId: string, amount: number): Promise<Loan>;
    runMonthlyInterestCalculation(groupId: string, month: bigint, year: bigint): Promise<Array<Transaction>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateGroupSettings(groupId: string, monthlyContribution: number, interestRatePercent: number, penaltyRatePercent: number): Promise<Group>;
    updateMemberStatus(groupId: string, memberPrincipal: Principal, isActive: boolean): Promise<GroupMembership>;
}
