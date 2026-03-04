import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Float "mo:core/Float";

module {
  type OldGroupSettings = {
    monthlyContribution : Float;
    interestRatePercent : Float;
    penaltyRatePercent : Float;
  };

  type OldMember = {
    id : Text;
    name : Text;
    email : Text;
    phone : Text;
    joinDate : Int;
    isActive : Bool;
    role : Text;
    principal : Principal;
  };

  type OldContribution = {
    id : Text;
    memberId : Text;
    amount : Float;
    month : Nat;
    year : Nat;
    status : Text;
    paidDate : ?Int;
    penaltyAmount : Float;
  };

  type OldLoan = {
    id : Text;
    memberId : Text;
    principalAmount : Float;
    outstandingBalance : Float;
    interestRatePercent : Float;
    startDate : Int;
    status : Text;
  };

  type OldTransaction = {
    id : Text;
    memberId : Text;
    transactionType : Text;
    amount : Float;
    date : Int;
    description : Text;
    relatedLoanId : ?Text;
  };

  type OldUserProfile = {
    name : Text;
    email : Text;
    phone : Text;
  };

  type OldPersistentActor = {
    groupSettings : OldGroupSettings;
    members : Map.Map<Text, OldMember>;
    contributions : Map.Map<Text, OldContribution>;
    loans : Map.Map<Text, OldLoan>;
    transactions : Map.Map<Text, OldTransaction>;
    userProfiles : Map.Map<Principal, OldUserProfile>;
    nextMemberId : Nat;
    nextContributionId : Nat;
    nextLoanId : Nat;
    nextTransactionId : Nat;
    principalToMemberId : Map.Map<Principal, Text>;
  };

  type Group = {
    id : Text;
    name : Text;
    description : Text;
    groupCode : Text;
    createdBy : Principal;
    createdAt : Int;
    monthlyContribution : Float;
    interestRatePercent : Float;
    penaltyRatePercent : Float;
  };

  type GroupMembership = {
    groupId : Text;
    memberPrincipal : Principal;
    joinedAt : Int;
    memberName : Text;
    memberEmail : Text;
    memberPhone : Text;
    isActive : Bool;
  };

  type Loan = {
    id : Text;
    groupId : Text;
    memberPrincipal : Principal;
    principalAmount : Float;
    outstandingBalance : Float;
    interestRatePercent : Float;
    startDate : Int;
    status : Text;
  };

  type Contribution = {
    id : Text;
    groupId : Text;
    memberPrincipal : Principal;
    amount : Float;
    month : Nat;
    year : Nat;
    status : Text;
    paidDate : ?Int;
    penaltyAmount : Float;
  };

  type Transaction = {
    id : Text;
    groupId : Text;
    memberPrincipal : Principal;
    transactionType : Text;
    amount : Float;
    date : Int;
    description : Text;
    relatedLoanId : ?Text;
  };

  type UserProfile = {
    name : Text;
    email : Text;
    phone : Text;
  };

  type NewPersistentActor = {
    groups : Map.Map<Text, Group>;
    groupMembership : Map.Map<Text, (Principal, GroupMembership)>;
    loans : Map.Map<Text, Loan>;
    contributions : Map.Map<Text, Contribution>;
    transactions : Map.Map<Text, Transaction>;
    userProfiles : Map.Map<Principal, UserProfile>;
    nextGroupId : Nat;
    nextMembershipId : Nat;
    nextLoanId : Nat;
    nextContributionId : Nat;
    nextTransactionId : Nat;
  };

  public func run(old : OldPersistentActor) : NewPersistentActor {
    let groupMembership = Map.empty<Text, (Principal, GroupMembership)>();
    {
      groups = Map.empty<Text, Group>();
      groupMembership;
      loans = Map.empty<Text, Loan>();
      contributions = Map.empty<Text, Contribution>();
      transactions = Map.empty<Text, Transaction>();
      userProfiles = old.userProfiles;
      nextGroupId = 1;
      nextMembershipId = 1;
      nextLoanId = 1;
      nextContributionId = 1;
      nextTransactionId = 1;
    };
  };
};
