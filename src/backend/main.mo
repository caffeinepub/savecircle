import Array "mo:core/Array";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Float "mo:core/Float";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  type Member = {
    id : Text;
    name : Text;
    email : Text;
    phone : Text;
    joinDate : Int;
    isActive : Bool;
    role : Text;
    principal : Principal;
  };

  module Member {
    public func compare(member1 : Member, member2 : Member) : Order.Order {
      Text.compare(member1.id, member2.id);
    };
  };

  type GroupSettings = {
    monthlyContribution : Float;
    interestRatePercent : Float;
    penaltyRatePercent : Float;
  };

  type Contribution = {
    id : Text;
    memberId : Text;
    amount : Float;
    month : Nat;
    year : Nat;
    status : Text;
    paidDate : ?Int;
    penaltyAmount : Float;
  };

  module Contribution {
    public func compare(contribution1 : Contribution, contribution2 : Contribution) : Order.Order {
      Text.compare(contribution1.id, contribution2.id);
    };
  };

  type Loan = {
    id : Text;
    memberId : Text;
    principalAmount : Float;
    outstandingBalance : Float;
    interestRatePercent : Float;
    startDate : Int;
    status : Text;
  };

  module Loan {
    public func compare(loan1 : Loan, loan2 : Loan) : Order.Order {
      Text.compare(loan1.id, loan2.id);
    };
  };

  type Transaction = {
    id : Text;
    memberId : Text;
    transactionType : Text;
    amount : Float;
    date : Int;
    description : Text;
    relatedLoanId : ?Text;
  };

  module Transaction {
    public func compare(transaction1 : Transaction, transaction2 : Transaction) : Order.Order {
      Text.compare(transaction1.id, transaction2.id);
    };
  };

  type GroupSummary = {
    totalFund : Float;
    totalLoansOutstanding : Float;
    monthlyInterestEarned : Float;
    totalPenalties : Float;
    memberCount : Nat;
    activeLoans : Nat;
  };

  public type UserProfile = {
    name : Text;
    email : Text;
    phone : Text;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Persistent data stores
  let members = Map.empty<Text, Member>();
  let contributions = Map.empty<Text, Contribution>();
  let loans = Map.empty<Text, Loan>();
  let transactions = Map.empty<Text, Transaction>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let principalToMemberId = Map.empty<Principal, Text>();

  // Group settings - default values
  var groupSettings : GroupSettings = {
    monthlyContribution = 1000.0;
    interestRatePercent = 2.0;
    penaltyRatePercent = 5.0;
  };

  // Unique ID counters
  var nextMemberId = 1;
  var nextContributionId = 1;
  var nextLoanId = 1;
  var nextTransactionId = 1;

  // Helper function to generate IDs
  func generateId(prefix : Text, nextId : Nat) : Text {
    prefix # "_" # nextId.toText();
  };

  // Helper function to get member ID from principal
  func getMemberIdFromPrincipal(caller : Principal) : ?Text {
    principalToMemberId.get(caller);
  };

  // USER PROFILE FUNCTIONS (Required by frontend)

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ADMIN FUNCTIONS

  public shared ({ caller }) func addMember(name : Text, email : Text, phone : Text) : async Member {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add members");
    };

    let memberId = generateId("member", nextMemberId);
    nextMemberId += 1;

    let newMember : Member = {
      id = memberId;
      name;
      email;
      phone;
      joinDate = Time.now();
      isActive = true;
      role = "member";
      principal = caller;
    };

    members.add(memberId, newMember);
    newMember;
  };

  public shared ({ caller }) func editMember(id : Text, name : Text, email : Text, phone : Text, isActive : Bool) : async Member {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can edit members");
    };

    switch (members.get(id)) {
      case (null) { Runtime.trap("Member not found") };
      case (?existing) {
        let updatedMember : Member = {
          id;
          name;
          email;
          phone;
          joinDate = existing.joinDate;
          isActive;
          role = existing.role;
          principal = existing.principal;
        };
        members.add(id, updatedMember);
        updatedMember;
      };
    };
  };

  public shared ({ caller }) func deleteMember(id : Text) : async Bool {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete members");
    };

    if (id == "member_1") {
      Runtime.trap("Cannot delete admin member");
    };

    switch (members.get(id)) {
      case (null) { Runtime.trap("Member not found") };
      case (?member) {
        members.remove(id);
        principalToMemberId.remove(member.principal);
        true;
      };
    };
  };

  public query ({ caller }) func listMembers() : async [Member] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view members list");
    };

    members.values().toArray().sort();
  };

  public query ({ caller }) func getMember(id : Text) : async ?Member {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view member details");
    };

    members.get(id);
  };

  // Loan Management
  public shared ({ caller }) func createLoan(memberId : Text, principalAmount : Float) : async Loan {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create loans");
    };

    switch (members.get(memberId)) {
      case (null) { Runtime.trap("Member not found") };
      case (?_) {
        let loanId = generateId("loan", nextLoanId);
        nextLoanId += 1;

        let newLoan : Loan = {
          id = loanId;
          memberId;
          principalAmount;
          outstandingBalance = principalAmount;
          interestRatePercent = groupSettings.interestRatePercent;
          startDate = Time.now();
          status = "active";
        };

        loans.add(loanId, newLoan);
        newLoan;
      };
    };
  };

  public shared ({ caller }) func closeLoan(loanId : Text) : async Loan {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can close loans");
    };

    switch (loans.get(loanId)) {
      case (null) { Runtime.trap("Loan not found") };
      case (?loan) {
        let updatedLoan : Loan = {
          id = loanId;
          memberId = loan.memberId;
          principalAmount = loan.principalAmount;
          outstandingBalance = loan.outstandingBalance;
          interestRatePercent = loan.interestRatePercent;
          startDate = loan.startDate;
          status = "closed";
        };

        loans.add(loanId, updatedLoan);
        updatedLoan;
      };
    };
  };

  public query ({ caller }) func listLoans() : async [Loan] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view loans list");
    };
    loans.values().toArray().sort();
  };

  public query ({ caller }) func getLoan(id : Text) : async ?Loan {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view loan details");
    };
    loans.get(id);
  };

  // Contributions
  public shared ({ caller }) func recordContribution(memberId : Text, amount : Float, month : Nat, year : Nat) : async Contribution {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can record contributions");
    };

    switch (members.get(memberId)) {
      case (null) { Runtime.trap("Member not found") };
      case (?_) {
        let contributionId = generateId("contribution", nextContributionId);
        nextContributionId += 1;

        let status = if (amount >= groupSettings.monthlyContribution) {
          "paid";
        } else if (amount > 0) {
          "partial";
        } else {
          "pending";
        };

        let newContribution : Contribution = {
          id = contributionId;
          memberId;
          amount;
          month;
          year;
          status;
          paidDate = ?Time.now();
          penaltyAmount = 0.0;
        };

        contributions.add(contributionId, newContribution);

        let transactionId = generateId("transaction", nextTransactionId);
        nextTransactionId += 1;

        let transaction : Transaction = {
          id = transactionId;
          memberId;
          transactionType = "contribution";
          amount;
          date = Time.now();
          description = "Contribution for " # month.toText() # "/" # year.toText();
          relatedLoanId = null;
        };

        transactions.add(transactionId, transaction);
        newContribution;
      };
    };
  };

  public shared ({ caller }) func adjustRecord(transactionId : Text, newAmount : Float, description : Text) : async Transaction {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can adjust records");
    };

    switch (transactions.get(transactionId)) {
      case (null) { Runtime.trap("Transaction not found") };
      case (?existing) {
        let updatedTransaction : Transaction = {
          id = transactionId;
          memberId = existing.memberId;
          transactionType = existing.transactionType;
          amount = newAmount;
          date = Time.now();
          description;
          relatedLoanId = existing.relatedLoanId;
        };

        transactions.add(transactionId, updatedTransaction);
        updatedTransaction;
      };
    };
  };

  // Group Settings
  public query ({ caller }) func getGroupSettings() : async GroupSettings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view group settings");
    };
    groupSettings;
  };

  public shared ({ caller }) func updateGroupSettings(monthlyContribution : Float, interestRatePercent : Float, penaltyRatePercent : Float) : async GroupSettings {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update group settings");
    };

    groupSettings := {
      monthlyContribution;
      interestRatePercent;
      penaltyRatePercent;
    };

    groupSettings;
  };

  public shared ({ caller }) func runMonthlyInterestCalculation(month : Nat, year : Nat) : async [Transaction] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can run monthly interest calculation");
    };

    var newTransactions : [Transaction] = [];

    for ((loanId, loan) in loans.entries()) {
      if (loan.status == "active") {
        let interestAmount = loan.outstandingBalance * groupSettings.interestRatePercent / 100.0;
        
        let updatedLoan : Loan = {
          id = loan.id;
          memberId = loan.memberId;
          principalAmount = loan.principalAmount;
          outstandingBalance = loan.outstandingBalance + interestAmount;
          interestRatePercent = loan.interestRatePercent;
          startDate = loan.startDate;
          status = loan.status;
        };
        loans.add(loanId, updatedLoan);

        let transactionId = generateId("transaction", nextTransactionId);
        nextTransactionId += 1;

        let transaction : Transaction = {
          id = transactionId;
          memberId = loan.memberId;
          transactionType = "interest";
          amount = interestAmount;
          date = Time.now();
          description = "Monthly interest for " # month.toText() # "/" # year.toText();
          relatedLoanId = ?loanId;
        };

        transactions.add(transactionId, transaction);
        newTransactions := newTransactions.concat([transaction]);
      };
    };

    newTransactions;
  };

  public shared ({ caller }) func applyPenalty(memberId : Text, month : Nat, year : Nat, penaltyAmount : Float) : async Contribution {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can apply penalties");
    };

    var foundContribution : ?Contribution = null;
    var foundId : ?Text = null;

    for ((id, contrib) in contributions.entries()) {
      if (contrib.memberId == memberId and contrib.month == month and contrib.year == year) {
        foundContribution := ?contrib;
        foundId := ?id;
      };
    };

    switch (foundContribution, foundId) {
      case (?contrib, ?id) {
        let updatedContribution : Contribution = {
          id = contrib.id;
          memberId = contrib.memberId;
          amount = contrib.amount;
          month = contrib.month;
          year = contrib.year;
          status = contrib.status;
          paidDate = contrib.paidDate;
          penaltyAmount = contrib.penaltyAmount + penaltyAmount;
        };

        contributions.add(id, updatedContribution);

        let transactionId = generateId("transaction", nextTransactionId);
        nextTransactionId += 1;

        let transaction : Transaction = {
          id = transactionId;
          memberId;
          transactionType = "penalty";
          amount = penaltyAmount;
          date = Time.now();
          description = "Penalty for " # month.toText() # "/" # year.toText();
          relatedLoanId = null;
        };

        transactions.add(transactionId, transaction);
        updatedContribution;
      };
      case _ { Runtime.trap("Contribution not found") };
    };
  };

  public query ({ caller }) func getGroupSummary() : async GroupSummary {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view group summary");
    };

    var totalFund : Float = 0.0;
    var totalLoansOutstanding : Float = 0.0;
    var monthlyInterestEarned : Float = 0.0;
    var totalPenalties : Float = 0.0;
    var activeLoansCount : Nat = 0;

    for (contrib in contributions.values()) {
      totalFund += contrib.amount;
      totalPenalties += contrib.penaltyAmount;
    };

    for (loan in loans.values()) {
      if (loan.status == "active") {
        totalLoansOutstanding += loan.outstandingBalance;
        activeLoansCount += 1;
      };
    };

    for (transaction in transactions.values()) {
      if (transaction.transactionType == "interest") {
        monthlyInterestEarned += transaction.amount;
      };
    };

    {
      totalFund;
      totalLoansOutstanding;
      monthlyInterestEarned;
      totalPenalties;
      memberCount = members.size();
      activeLoans = activeLoansCount;
    };
  };

  // MEMBER FUNCTIONS

  public query ({ caller }) func getMyProfile() : async ?Member {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their profile");
    };

    switch (getMemberIdFromPrincipal(caller)) {
      case (null) { null };
      case (?memberId) { members.get(memberId) };
    };
  };

  public query ({ caller }) func getMyContributions() : async [Contribution] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their contributions");
    };

    switch (getMemberIdFromPrincipal(caller)) {
      case (null) { [] };
      case (?memberId) {
        contributions.filter(
          func(_id, c) {
            c.memberId == memberId;
          }
        ).values().toArray().sort();
      };
    };
  };

  public query ({ caller }) func getMyLoans() : async [Loan] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their loans");
    };

    switch (getMemberIdFromPrincipal(caller)) {
      case (null) { [] };
      case (?memberId) {
        loans.filter(
          func(_id, l) {
            l.memberId == memberId;
          }
        ).values().toArray().sort();
      };
    };
  };

  public query ({ caller }) func getMyTransactions() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their transactions");
    };

    switch (getMemberIdFromPrincipal(caller)) {
      case (null) { [] };
      case (?memberId) {
        transactions.filter(
          func(_id, t) {
            t.memberId == memberId;
          }
        ).values().toArray().sort();
      };
    };
  };

  public query ({ caller }) func getMyOutstandingBalance() : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their outstanding balance");
    };

    switch (getMemberIdFromPrincipal(caller)) {
      case (null) { 0.0 };
      case (?memberId) {
        var total : Float = 0.0;
        for (loan in loans.values()) {
          if (loan.memberId == memberId and loan.status == "active") {
            total += loan.outstandingBalance;
          };
        };
        total;
      };
    };
  };

  public shared ({ caller }) func payContribution(amount : Float, month : Nat, year : Nat) : async Contribution {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can pay contributions");
    };

    switch (getMemberIdFromPrincipal(caller)) {
      case (null) { Runtime.trap("Member not found") };
      case (?memberId) {
        let contributionId = generateId("contribution", nextContributionId);
        nextContributionId += 1;

        let status = if (amount >= groupSettings.monthlyContribution) {
          "paid";
        } else if (amount > 0) {
          "partial";
        } else {
          "pending";
        };

        let newContribution : Contribution = {
          id = contributionId;
          memberId;
          amount;
          month;
          year;
          status;
          paidDate = ?Time.now();
          penaltyAmount = 0.0;
        };

        contributions.add(contributionId, newContribution);

        let transactionId = generateId("transaction", nextTransactionId);
        nextTransactionId += 1;

        let transaction : Transaction = {
          id = transactionId;
          memberId;
          transactionType = "contribution";
          amount;
          date = Time.now();
          description = "Self-paid contribution for " # month.toText() # "/" # year.toText();
          relatedLoanId = null;
        };

        transactions.add(transactionId, transaction);
        newContribution;
      };
    };
  };

  public shared ({ caller }) func payLoanInterest(loanId : Text, amount : Float) : async Transaction {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can pay loan interest");
    };

    switch (getMemberIdFromPrincipal(caller)) {
      case (null) { Runtime.trap("Member not found") };
      case (?memberId) {
        switch (loans.get(loanId)) {
          case (null) { Runtime.trap("Loan not found") };
          case (?loan) {
            if (loan.memberId != memberId) {
              Runtime.trap("Unauthorized: Can only pay interest on your own loans");
            };

            let updatedLoan : Loan = {
              id = loan.id;
              memberId = loan.memberId;
              principalAmount = loan.principalAmount;
              outstandingBalance = loan.outstandingBalance - amount;
              interestRatePercent = loan.interestRatePercent;
              startDate = loan.startDate;
              status = loan.status;
            };

            loans.add(loanId, updatedLoan);

            let transactionId = generateId("transaction", nextTransactionId);
            nextTransactionId += 1;

            let transaction : Transaction = {
              id = transactionId;
              memberId;
              transactionType = "interest";
              amount;
              date = Time.now();
              description = "Interest payment for loan " # loanId;
              relatedLoanId = ?loanId;
            };

            transactions.add(transactionId, transaction);
            transaction;
          };
        };
      };
    };
  };

  public shared ({ caller }) func repayPrincipal(loanId : Text, amount : Float) : async Loan {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can repay principal");
    };

    switch (getMemberIdFromPrincipal(caller)) {
      case (null) { Runtime.trap("Member not found") };
      case (?memberId) {
        switch (loans.get(loanId)) {
          case (null) { Runtime.trap("Loan not found") };
          case (?loan) {
            if (loan.memberId != memberId) {
              Runtime.trap("Unauthorized: Can only repay your own loans");
            };

            let newBalance = loan.outstandingBalance - amount;
            let newStatus = if (newBalance <= 0.0) { "closed" } else { loan.status };

            let updatedLoan : Loan = {
              id = loan.id;
              memberId = loan.memberId;
              principalAmount = loan.principalAmount;
              outstandingBalance = if (newBalance < 0.0) { 0.0 } else { newBalance };
              interestRatePercent = loan.interestRatePercent;
              startDate = loan.startDate;
              status = newStatus;
            };

            loans.add(loanId, updatedLoan);

            let transactionId = generateId("transaction", nextTransactionId);
            nextTransactionId += 1;

            let transaction : Transaction = {
              id = transactionId;
              memberId;
              transactionType = "principal_repayment";
              amount;
              date = Time.now();
              description = "Principal repayment for loan " # loanId;
              relatedLoanId = ?loanId;
            };

            transactions.add(transactionId, transaction);
            updatedLoan;
          };
        };
      };
    };
  };

  // Utility functions
  public query ({ caller }) func getAllTransactions() : async [Transaction] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all transactions");
    };
    transactions.values().toArray().sort();
  };

  public query ({ caller }) func getMemberTransactions(memberId : Text) : async [Transaction] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view member transactions");
    };

    transactions.filter(
      func(_id, t) {
        t.memberId == memberId;
      }
    ).values().toArray().sort();
  };
};
