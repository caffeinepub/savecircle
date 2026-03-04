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
export interface Member {
    id: string;
    principal: Principal;
    joinDate: bigint;
    name: string;
    role: string;
    isActive: boolean;
    email: string;
    phone: string;
}
export interface Loan {
    id: string;
    status: string;
    memberId: string;
    outstandingBalance: number;
    interestRatePercent: number;
    principalAmount: number;
    startDate: bigint;
}
export interface GroupSettings {
    penaltyRatePercent: number;
    interestRatePercent: number;
    monthlyContribution: number;
}
export interface Contribution {
    id: string;
    status: string;
    memberId: string;
    month: bigint;
    penaltyAmount: number;
    year: bigint;
    paidDate?: bigint;
    amount: number;
}
export interface UserProfile {
    name: string;
    email: string;
    phone: string;
}
export interface Transaction {
    id: string;
    memberId: string;
    transactionType: string;
    relatedLoanId?: string;
    date: bigint;
    description: string;
    amount: number;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addMember(name: string, email: string, phone: string): Promise<Member>;
    adjustRecord(transactionId: string, newAmount: number, description: string): Promise<Transaction>;
    applyPenalty(memberId: string, month: bigint, year: bigint, penaltyAmount: number): Promise<Contribution>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    closeLoan(loanId: string): Promise<Loan>;
    createLoan(memberId: string, principalAmount: number): Promise<Loan>;
    deleteMember(id: string): Promise<boolean>;
    editMember(id: string, name: string, email: string, phone: string, isActive: boolean): Promise<Member>;
    getAllTransactions(): Promise<Array<Transaction>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getGroupSettings(): Promise<GroupSettings>;
    getGroupSummary(): Promise<GroupSummary>;
    getLoan(id: string): Promise<Loan | null>;
    getMember(id: string): Promise<Member | null>;
    getMemberTransactions(memberId: string): Promise<Array<Transaction>>;
    getMyContributions(): Promise<Array<Contribution>>;
    getMyLoans(): Promise<Array<Loan>>;
    getMyOutstandingBalance(): Promise<number>;
    getMyProfile(): Promise<Member | null>;
    getMyTransactions(): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listLoans(): Promise<Array<Loan>>;
    listMembers(): Promise<Array<Member>>;
    payContribution(amount: number, month: bigint, year: bigint): Promise<Contribution>;
    payLoanInterest(loanId: string, amount: number): Promise<Transaction>;
    recordContribution(memberId: string, amount: number, month: bigint, year: bigint): Promise<Contribution>;
    repayPrincipal(loanId: string, amount: number): Promise<Loan>;
    runMonthlyInterestCalculation(month: bigint, year: bigint): Promise<Array<Transaction>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateGroupSettings(monthlyContribution: number, interestRatePercent: number, penaltyRatePercent: number): Promise<GroupSettings>;
}
