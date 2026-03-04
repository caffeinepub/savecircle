# SaveCircle

## Current State
Single-group savings & loan management system. One global group with a single set of settings (monthly contribution, interest rate, penalty rate). Admin manages all members and loans in that one group. Members see their own contributions, loans, and transactions. No concept of multiple groups, group codes, or group switching.

## Requested Changes (Diff)

### Add
- `Group` data type: id, name, description, groupCode (unique 6-char alphanumeric), createdBy (Principal), createdAt, settings (monthlyContribution, interestRatePercent, penaltyRatePercent)
- `GroupMembership` data type: groupId, memberId (principal), joinedAt
- Backend: `createGroup(name, description)` -- admin only, auto-generates unique group code, returns Group
- Backend: `listMyGroups()` -- returns groups the caller owns (admin) or is a member of
- Backend: `joinGroup(groupCode)` -- authenticated user only, joins the group matching the code, creates a Member record for them in that group, returns Group
- Backend: `getGroup(groupId)` -- returns group details (admin or member of that group)
- Backend: `listGroupMembers(groupId)` -- admin only, lists members in a specific group
- Backend: `switchActiveGroup(groupId)` -- sets caller's active group context for all subsequent queries
- All existing APIs (loans, contributions, transactions, summary) are now scoped to the caller's currently active group
- Backend: `deleteGroup(groupId)` -- admin only, must be group creator
- Backend: `leaveGroup(groupId)` -- member only, removes their membership
- Frontend: After login, if user has no groups, show a "Group Hub" page with two options: Create Group (admin) or Join Group (enter code)
- Frontend: If user has groups, show a group selector/switcher in the nav so they can switch active group
- Frontend: Admin Groups page -- list of groups admin created, create new group button, shows group code for each, option to delete group
- Frontend: Member "Join Group" flow -- input field for 6-char group code, submit joins and adds to their group list
- Frontend: All dashboard/financial data scoped to the currently active group
- Frontend: Group context (active group name + code display) visible in sidebar/nav header

### Modify
- `GroupSettings` moves from a single global var to per-group settings inside each Group record
- `Member` records are now scoped per group (memberId is unique per group, not global). Each group maintains its own member list.
- All existing admin API calls (addMember, editMember, deleteMember, listMembers, createLoan, recordContribution, etc.) now require a groupId parameter and enforce that caller is admin of that group
- All member self-service calls (getMyLoans, getMyContributions, etc.) scoped to caller's active group
- App routing: after login, redirect to Group Hub if no active group; otherwise go to dashboard in context of active group
- Sidebar/nav: show active group name; add a "Groups" nav item for switching
- Existing members/data: start fresh -- no migration of old single-group data

### Remove
- Global `groupSettings` var (replaced by per-group settings)
- Single-group assumption throughout backend and frontend

## Implementation Plan
1. Rewrite Motoko backend to support multi-group: Group type, GroupMembership, per-group scoped APIs, group code generation, joinGroup, createGroup, switchActiveGroup, all existing APIs accept groupId
2. Update frontend routing to include Group Hub page (post-login landing when no active group)
3. Build Group Hub page: create group form (admin) + join group form (enter code)
4. Add group switcher to sidebar nav header showing active group name
5. Add Admin Groups management page (list groups, show code, create, delete)
6. Scope all dashboard, members, loans, contributions, transactions pages to active group using group context
7. Member join flow: after login, if no groups, show join/create screen; if groups exist, show group switcher
