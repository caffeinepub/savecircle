import Array "mo:core/Array";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Order "mo:core/Order";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";


// For system time "now()" (with migration)

actor {
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

  // All public (originally persistent) state must be declared in the actor.
  // Initialization only allowed in migration to keep with-clause valid.
  // Persistent data stores
  let groups = Map.empty<Text, Group>();
  let groupMembership = Map.empty<Text, (Principal, GroupMembership)>();
  let loans = Map.empty<Text, Loan>();
  let contributions = Map.empty<Text, Contribution>();
  let transactions = Map.empty<Text, Transaction>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextGroupId = 1;
  var nextMembershipId = 1;
  var nextLoanId = 1;
  var nextContributionId = 1;
  var nextTransactionId = 1;

  // Authorization (must have persistent field)
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  func generateGroupId() : Text {
    let id = "group_" # nextGroupId.toText();
    nextGroupId += 1;
    id;
  };

  func generateMembershipId() : Text {
    let id = "membership_" # nextMembershipId.toText();
    nextMembershipId += 1;
    id;
  };

  func generateLoanId() : Text {
    let id = "loan_" # nextLoanId.toText();
    nextLoanId += 1;
    id;
  };

  func generateContributionId() : Text {
    let id = "contribution_" # nextContributionId.toText();
    nextContributionId += 1;
    id;
  };

  func generateTransactionId() : Text {
    let id = "transaction_" # nextTransactionId.toText();
    nextTransactionId += 1;
    id;
  };

  // Helper function to check if a user is an active member of a group
  func isActiveMember(principal : Principal, groupId : Text) : Bool {
    for ((_, membership) in groupMembership.entries()) {
      if (
        membership.0 == principal and
        membership.1.groupId == groupId and
        membership.1.isActive
      ) {
        return true;
      };
    };
    false;
  };

  // Helper function to check if a user is a member (active or inactive) of a group
  func isMember(principal : Principal, groupId : Text) : Bool {
    for ((_, membership) in groupMembership.entries()) {
      if (
        membership.0 == principal and
        membership.1.groupId == groupId
      ) {
        return true;
      };
    };
    false;
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

  // GROUP MANAGEMENT
  public shared ({ caller }) func createGroup(name : Text, description : Text) : async Group {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create groups");
    };
    let groupId = generateGroupId();
    let group : Group = {
      id = groupId;
      name;
      description;
      groupCode = groupId;
      createdBy = caller;
      createdAt = Time.now();
      monthlyContribution = 1000.0;
      interestRatePercent = 2.0;
      penaltyRatePercent = 5.0;
    };
    groups.add(groupId, group);

    // Automatically add creator as first member
    let membershipId = generateMembershipId();
    groupMembership.add(membershipId, (caller, {
      groupId = groupId;
      memberPrincipal = caller;
      joinedAt = Time.now();
      memberName = "";
      memberEmail = "";
      memberPhone = "";
      isActive = true;
    }));

    group;
  };

  public shared ({ caller }) func joinGroup(groupCode : Text) : async Group {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join groups");
    };
    switch (groups.get(groupCode)) {
      case (null) { Runtime.trap("Group not found") };
      case (?group) {
        // Check if already a member
        if (isMember(caller, groupCode)) {
          Runtime.trap("Already a member of this group");
        };

        let membershipId = generateMembershipId();
        groupMembership.add(membershipId, (caller, {
          groupId = groupCode;
          memberPrincipal = caller;
          joinedAt = Time.now();
          memberName = "";
          memberEmail = "";
          memberPhone = "";
          isActive = true;
        }));
        group;
      };
    };
  };

  public query ({ caller }) func listMyGroups() : async [Group] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list groups");
    };
    let memberships = groupMembership.toArray().filter(
      func(entry) {
        entry.1.0 == caller;
      }
    );
    memberships.map<(Text, (Principal, GroupMembership)), Group>(
      func((_id, membership)) {
        switch (groups.get(membership.1.groupId)) {
          case (null) { Runtime.trap("Invalid membership, group not found") };
          case (?g) { g };
        };
      }
    );
  };

  public query ({ caller }) func getGroup(groupId : Text) : async ?Group {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view group details");
    };

    // Only allow viewing if user is a member or system admin
    if (not isMember(caller, groupId) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only group members can view group details");
    };

    groups.get(groupId);
  };

  public shared ({ caller }) func leaveGroup(groupId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can leave groups");
    };

    // Verify user is a member
    if (not isMember(caller, groupId)) {
      Runtime.trap("Not a member of this group");
    };

    // Check if user is the creator
    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?group) {
        if (group.createdBy == caller) {
          Runtime.trap("Group creator cannot leave the group. Delete the group instead.");
        };
      };
    };

    // Find membership and change status to false
    for ((id, membership) in groupMembership.entries()) {
      if (
        membership.0 == caller and
        membership.1.groupId == groupId and
        membership.1.isActive
      ) {
        groupMembership.add(
          id,
          (
            caller,
            {
              groupId = groupId;
              memberPrincipal = caller;
              joinedAt = membership.1.joinedAt;
              memberName = membership.1.memberName;
              memberEmail = membership.1.memberEmail;
              memberPhone = membership.1.memberPhone;
              isActive = false;
            },
          ),
        );
        return true;
      };
    };
    false;
  };

  public shared ({ caller }) func deleteGroup(groupId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete groups");
    };
    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?group) {
        if (group.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only group creator or system admin can delete group");
        };

        // Check for outstanding loans
        var hasActiveLoans = false;
        for (loan in loans.values()) {
          if (loan.groupId == groupId and loan.status == "active") {
            hasActiveLoans := true;
          };
        };

        if (hasActiveLoans) {
          Runtime.trap("Cannot delete group with active loans");
        };

        groups.remove(groupId);

        // Remove all memberships
        let toRemove = groupMembership.toArray().filter(
          func(entry) {
            entry.1.1.groupId == groupId;
          }
        );
        for ((id, _) in toRemove.vals()) {
          groupMembership.remove(id);
        };

        true;
      };
    };
  };

  // GROUP ADMIN FUNCTIONS
  public query ({ caller }) func listGroupMembers(groupId : Text) : async [GroupMembership] {
    checkGroupAdmin(caller, groupId);
    let filteredMemberships = groupMembership.toArray().filter(
      func(entry) {
        entry.1.1.groupId == groupId;
      }
    );
    filteredMemberships.map<(Text, (Principal, GroupMembership)), GroupMembership>(
      func(entry) { entry.1.1 }
    );
  };

  public shared ({ caller }) func removeMember(groupId : Text, memberPrincipal : Principal) : async Bool {
    checkGroupAdmin(caller, groupId);

    // Cannot remove the group creator
    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?group) {
        if (group.createdBy == memberPrincipal) {
          Runtime.trap("Cannot remove group creator");
        };
      };
    };

    let mutableArray = groupMembership.toArray();
    for (i in Nat.range(0, mutableArray.size())) {
      let element = mutableArray[i];
      if (
        element.1.1.groupId == groupId and
        element.1.1.memberPrincipal == memberPrincipal
      ) {
        groupMembership.remove(element.0);
        return true;
      };
    };
    false;
  };

  public shared ({ caller }) func updateMemberStatus(
    groupId : Text,
    memberPrincipal : Principal,
    isActive : Bool
  ) : async GroupMembership {
    checkGroupAdmin(caller, groupId);

    // Cannot deactivate the group creator
    if (not isActive) {
      switch (groups.get(groupId)) {
        case (null) { Runtime.trap("Group not found") };
        case (?group) {
          if (group.createdBy == memberPrincipal) {
            Runtime.trap("Cannot deactivate group creator");
          };
        };
      };
    };

    let mutableArray = groupMembership.toArray();
    for (i in Nat.range(0, mutableArray.size())) {
      let element = mutableArray[i];
      let data = element.1.1;
      if (element.1.1.groupId == groupId and element.1.1.memberPrincipal == memberPrincipal) {
        let updated = {
          groupId = data.groupId;
          memberPrincipal = data.memberPrincipal;
          joinedAt = data.joinedAt;
          memberName = data.memberName;
          memberEmail = data.memberEmail;
          memberPhone = data.memberPhone;
          isActive;
        };
        groupMembership.add(element.0, (element.1.0, updated));
        return updated;
      };
    };
    Runtime.trap("Group membership not found");
  };

  public shared ({ caller }) func updateGroupSettings(
    groupId : Text,
    monthlyContribution : Float,
    interestRatePercent : Float,
    penaltyRatePercent : Float
  ) : async Group {
    checkGroupAdmin(caller, groupId);
    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?group) {
        let newGroup = {
          id = group.id;
          name = group.name;
          description = group.description;
          groupCode = group.groupCode;
          createdBy = group.createdBy;
          createdAt = group.createdAt;
          monthlyContribution;
          interestRatePercent;
          penaltyRatePercent;
        };
        groups.add(groupId, newGroup);
        newGroup;
      };
    };
  };

  public shared ({ caller }) func createLoan(
    groupId : Text,
    memberPrincipal : Principal,
    principalAmount : Float
  ) : async Loan {
    checkGroupAdmin(caller, groupId);

    // Verify the member is an active member of the group
    if (not isActiveMember(memberPrincipal, groupId)) {
      Runtime.trap("Cannot create loan for non-active member");
    };

    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?group) {
        let loanId = generateLoanId();
        let loan : Loan = {
          id = loanId;
          groupId = group.id;
          memberPrincipal;
          principalAmount;
          outstandingBalance = principalAmount;
          interestRatePercent = group.interestRatePercent;
          startDate = Time.now();
          status = "active";
        };
        loans.add(loanId, loan);

        // Record transaction
        let transactionId = generateTransactionId();
        let transaction : Transaction = {
          id = transactionId;
          groupId;
          memberPrincipal;
          transactionType = "loan_disbursement";
          amount = principalAmount;
          date = Time.now();
          description = "Loan disbursement";
          relatedLoanId = ?loanId;
        };
        transactions.add(transactionId, transaction);

        loan;
      };
    };
  };

  public shared ({ caller }) func closeLoan(groupId : Text, loanId : Text) : async Loan {
    checkGroupAdmin(caller, groupId);
    switch (loans.get(loanId)) {
      case (null) { Runtime.trap("Loan not found") };
      case (?loan) {
        if (loan.groupId != groupId) {
          Runtime.trap("Loan does not belong to this group");
        };
        let updatedLoan = {
          id = loan.id;
          groupId = loan.groupId;
          memberPrincipal = loan.memberPrincipal;
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

  public query ({ caller }) func listLoans(groupId : Text) : async [Loan] {
    checkGroupAdmin(caller, groupId);
    loans.filter(
      func(_id, l) {
        l.groupId == groupId;
      }
    ).values().toArray();
  };

  public shared ({ caller }) func recordContribution(
    groupId : Text,
    memberPrincipal : Principal,
    amount : Float,
    month : Nat,
    year : Nat
  ) : async Contribution {
    checkGroupAdmin(caller, groupId);

    // Verify the member is a member of the group
    if (not isMember(memberPrincipal, groupId)) {
      Runtime.trap("Cannot record contribution for non-member");
    };

    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?group) {
        let contributionId = generateContributionId();
        let status = if (amount >= group.monthlyContribution) {
          "paid";
        } else if (amount > 0) {
          "partial";
        } else { "pending" };
        let contribution = {
          id = contributionId;
          groupId = group.id;
          memberPrincipal;
          amount;
          month;
          year;
          status;
          paidDate = ?Time.now();
          penaltyAmount = 0.0;
        };
        contributions.add(contributionId, contribution);
        let transactionId = generateTransactionId();
        let transaction : Transaction = {
          id = transactionId;
          groupId = group.id;
          memberPrincipal;
          transactionType = "contribution";
          amount;
          date = Time.now();
          description = "Contribution for " # month.toText() # "/" # year.toText();
          relatedLoanId = null;
        };
        transactions.add(transactionId, transaction);
        contribution;
      };
    };
  };

  public shared ({ caller }) func applyPenalty(
    groupId : Text,
    memberPrincipal : Principal,
    month : Nat,
    year : Nat,
    penaltyAmount : Float
  ) : async Contribution {
    checkGroupAdmin(caller, groupId);

    // Verify the member is a member of the group
    if (not isMember(memberPrincipal, groupId)) {
      Runtime.trap("Cannot apply penalty for non-member");
    };

    let mutableArray = contributions.toArray();
    for (i in Nat.range(0, mutableArray.size())) {
      let entry = mutableArray[i];
      let contribution = entry.1;
      if (
        contribution.groupId == groupId and
        contribution.memberPrincipal == memberPrincipal and
        contribution.month == month and
        contribution.year == year
      ) {
        let updatedContribution = {
          id = contribution.id;
          groupId = contribution.groupId;
          memberPrincipal = contribution.memberPrincipal;
          amount = contribution.amount;
          month = contribution.month;
          year = contribution.year;
          status = contribution.status;
          paidDate = contribution.paidDate;
          penaltyAmount = contribution.penaltyAmount + penaltyAmount;
        };
        contributions.add(entry.0, updatedContribution);
        let transactionId = generateTransactionId();
        let transaction : Transaction = {
          id = transactionId;
          groupId;
          memberPrincipal;
          transactionType = "penalty";
          amount = penaltyAmount;
          date = Time.now();
          description = "Penalty for " # month.toText() # "/" # year.toText();
          relatedLoanId = null;
        };
        transactions.add(transactionId, transaction);
        return updatedContribution;
      };
    };
    Runtime.trap("Contribution not found");
  };

  public shared ({ caller }) func runMonthlyInterestCalculation(
    groupId : Text,
    month : Nat,
    year : Nat
  ) : async [Transaction] {
    checkGroupAdmin(caller, groupId);
    var groupTransactions : [Transaction] = [];
    for ((loanId, loan) in loans.entries()) {
      if (loan.groupId == groupId and loan.status == "active") {
        let interestAmount = loan.outstandingBalance * loan.interestRatePercent / 100.0;
        let updatedLoan = {
          id = loan.id;
          groupId = loan.groupId;
          memberPrincipal = loan.memberPrincipal;
          principalAmount = loan.principalAmount;
          outstandingBalance = loan.outstandingBalance + interestAmount;
          interestRatePercent = loan.interestRatePercent;
          startDate = loan.startDate;
          status = loan.status;
        };
        loans.add(loanId, updatedLoan);
        let transactionId = generateTransactionId();
        let transaction : Transaction = {
          id = transactionId;
          groupId;
          memberPrincipal = loan.memberPrincipal;
          transactionType = "interest";
          amount = interestAmount;
          date = Time.now();
          description = "Monthly interest for " # month.toText() # "/" # year.toText();
          relatedLoanId = ?loanId;
        };
        transactions.add(transactionId, transaction);
        groupTransactions := groupTransactions.concat([transaction]);
      };
    };
    groupTransactions;
  };

  public query ({ caller }) func getAllTransactions(groupId : Text) : async [Transaction] {
    checkGroupAdmin(caller, groupId);
    transactions.filter(
      func(_id, t) {
        t.groupId == groupId;
      }
    ).values().toArray().sort();
  };

  public query ({ caller }) func getGroupSummary(groupId : Text) : async GroupSummary {
    checkGroupAdmin(caller, groupId);
    let groupOpt = groups.get(groupId);
    switch (groupOpt) {
      case (null) { Runtime.trap("Group not found") };
      case (?group) {
        var totalFund : Float = 0.0;
        var totalLoansOutstanding : Float = 0.0;
        var monthlyInterestEarned : Float = 0.0;
        var totalPenalties : Float = 0.0;
        var activeLoansCount : Nat = 0;

        for (contrib in contributions.values()) {
          if (contrib.groupId == groupId) {
            totalFund += contrib.amount;
            totalPenalties += contrib.penaltyAmount;
          };
        };

        for (loan in loans.values()) {
          if (loan.groupId == groupId and loan.status == "active") {
            totalLoansOutstanding += loan.outstandingBalance;
            activeLoansCount += 1;
          };
        };

        for (transaction in transactions.values()) {
          if (transaction.groupId == groupId and transaction.transactionType == "interest") {
            monthlyInterestEarned += transaction.amount;
          };
        };

        {
          totalFund;
          totalLoansOutstanding;
          monthlyInterestEarned;
          totalPenalties;
          memberCount = groupMembership.toArray().filter(
            func(entry) {
              entry.1.1.groupId == groupId;
            }
          ).size();
          activeLoans = activeLoansCount;
        };
      };
    };
  };

  public shared ({ caller }) func adjustRecord(
    groupId : Text,
    transactionId : Text,
    newAmount : Float,
    description : Text
  ) : async Transaction {
    checkGroupAdmin(caller, groupId);
    switch (transactions.get(transactionId)) {
      case (null) { Runtime.trap("Transaction not found") };
      case (?existing) {
        if (existing.groupId != groupId) {
          Runtime.trap("Transaction does not belong to this group");
        };
        let updatedTransaction = {
          id = transactionId;
          groupId = existing.groupId;
          memberPrincipal = existing.memberPrincipal;
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

  // Group checks
  func checkGroupAdmin(caller : Principal, groupId : Text) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can perform this action");
    };

    switch (groups.get(groupId)) {
      case (null) {
        Runtime.trap("Group not found");
      };
      case (?group) {
        if (group.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only group admin or system admin can perform this action");
        };
      };
    };
  };

  func isAdmin(principal : Principal) : Bool {
    AccessControl.isAdmin(accessControlState, principal);
  };

  // MEMBER FUNCTIONS
  public query ({ caller }) func getMyGroupProfile(groupId : Text) : async ?GroupMembership {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view group profile");
    };

    // Verify caller is a member
    if (not isMember(caller, groupId)) {
      return null;
    };

    let mutableArray = groupMembership.toArray();
    for (i in Nat.range(0, mutableArray.size())) {
      let entry = mutableArray[i];
      if (entry.1.1.groupId == groupId and entry.1.1.memberPrincipal == caller) {
        return ?entry.1.1;
      };
    };
    null;
  };

  public query ({ caller }) func getMyLoans(groupId : Text) : async [Loan] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view loans");
    };

    // Verify caller is a member
    if (not isMember(caller, groupId)) {
      Runtime.trap("Unauthorized: Only group members can view their loans");
    };

    loans.filter(
      func(_id, l) {
        l.groupId == groupId and l.memberPrincipal == caller
      }
    ).values().toArray();
  };

  public query ({ caller }) func getMyContributions(groupId : Text) : async [Contribution] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view contributions");
    };

    // Verify caller is a member
    if (not isMember(caller, groupId)) {
      Runtime.trap("Unauthorized: Only group members can view their contributions");
    };

    contributions.filter(
      func(_id, c) {
        c.groupId == groupId and c.memberPrincipal == caller
      }
    ).values().toArray();
  };

  public query ({ caller }) func getMyTransactions(groupId : Text) : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view transactions");
    };

    // Verify caller is a member
    if (not isMember(caller, groupId)) {
      Runtime.trap("Unauthorized: Only group members can view their transactions");
    };

    transactions.filter(
      func(_id, t) {
        t.groupId == groupId and t.memberPrincipal == caller
      }
    ).values().toArray().sort();
  };

  public query ({ caller }) func getMyOutstandingBalance(groupId : Text) : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view outstanding balance");
    };

    // Verify caller is a member
    if (not isMember(caller, groupId)) {
      Runtime.trap("Unauthorized: Only group members can view their outstanding balance");
    };

    var total : Float = 0.0;
    for (loan in loans.values()) {
      if (loan.groupId == groupId and loan.memberPrincipal == caller and loan.status == "active") {
        total += loan.outstandingBalance;
      };
    };
    total;
  };

  public shared ({ caller }) func payContribution(
    groupId : Text,
    amount : Float,
    month : Nat,
    year : Nat
  ) : async Contribution {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can pay contributions");
    };

    // Verify caller is an active member
    if (not isActiveMember(caller, groupId)) {
      Runtime.trap("Unauthorized: Only active group members can pay contributions");
    };

    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?group) {
        let contributionId = generateContributionId();
        let status = if (amount >= group.monthlyContribution) {
          "paid";
        } else if (amount > 0) { "partial" } else { "pending" };
        let newContribution = {
          id = contributionId;
          groupId;
          memberPrincipal = caller;
          amount;
          month;
          year;
          status;
          paidDate = ?Time.now();
          penaltyAmount = 0.0;
        };
        contributions.add(contributionId, newContribution);
        let transactionId = generateTransactionId();
        let transaction : Transaction = {
          id = transactionId;
          groupId;
          memberPrincipal = caller;
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

  public shared ({ caller }) func payLoanInterest(
    groupId : Text,
    loanId : Text,
    amount : Float
  ) : async Transaction {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can pay loan interest");
    };

    // Verify caller is an active member
    if (not isActiveMember(caller, groupId)) {
      Runtime.trap("Unauthorized: Only active group members can pay loan interest");
    };

    switch (loans.get(loanId)) {
      case (null) { Runtime.trap("Loan not found") };
      case (?loan) {
        if (loan.groupId != groupId or loan.memberPrincipal != caller) {
          Runtime.trap("Unauthorized: Cannot pay interest for this loan");
        };
        let updatedLoan = {
          id = loan.id;
          groupId = loan.groupId;
          memberPrincipal = loan.memberPrincipal;
          principalAmount = loan.principalAmount;
          outstandingBalance = loan.outstandingBalance - amount;
          interestRatePercent = loan.interestRatePercent;
          startDate = loan.startDate;
          status = loan.status;
        };
        loans.add(loanId, updatedLoan);
        let transactionId = generateTransactionId();
        let transaction : Transaction = {
          id = transactionId;
          groupId;
          memberPrincipal = caller;
          transactionType = "interest_payment";
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

  public shared ({ caller }) func repayPrincipal(
    groupId : Text,
    loanId : Text,
    amount : Float
  ) : async Loan {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can repay principal");
    };

    // Verify caller is an active member
    if (not isActiveMember(caller, groupId)) {
      Runtime.trap("Unauthorized: Only active group members can repay principal");
    };

    switch (loans.get(loanId)) {
      case (null) { Runtime.trap("Loan not found") };
      case (?loan) {
        if (loan.groupId != groupId or loan.memberPrincipal != caller) {
          Runtime.trap("Unauthorized: Cannot repay this loan");
        };
        let newBalance = loan.outstandingBalance - amount;
        let newStatus = if (newBalance <= 0.0) { "closed" } else { loan.status };
        let updatedLoan = {
          id = loan.id;
          groupId = loan.groupId;
          memberPrincipal = loan.memberPrincipal;
          principalAmount = loan.principalAmount;
          outstandingBalance = if (newBalance < 0.0) { 0.0 } else { newBalance };
          interestRatePercent = loan.interestRatePercent;
          startDate = loan.startDate;
          status = newStatus;
        };
        loans.add(loanId, updatedLoan);
        let transactionId = generateTransactionId();
        let transaction : Transaction = {
          id = transactionId;
          groupId;
          memberPrincipal = caller;
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
