# SaveCircle

## Current State
- Group codes are stored as `groupCode = groupId` in the backend, resulting in codes like `group_1` (7+ chars) instead of alphanumeric 6-char codes like `ABC123`.
- The `joinGroup` backend function looks up groups by `groupCode` which equals `groupId` (e.g. `group_1`).
- AdminMembers page shows a group code display but has no "Add Member" UI -- the page only lists existing members with deactivate/remove actions.
- There is no `addMemberByAdmin` backend function; members can only join via `joinGroup(groupCode)` themselves.

## Requested Changes (Diff)

### Add
- In AdminMembers: A prominent "Invite Member" section that shows the full join instructions (copy group code, share it, member uses it on Group Hub after login). Make the group code clickable-to-copy and visually highlighted.
- A clear info callout in AdminMembers explaining that members must join themselves using the group code after logging in -- framed as a guided invite flow, not a limitation.

### Modify
- Group code display in AdminMembers (`GroupCodeDisplay`): Show the `groupCode` value as-is (it may look like `group_1`) but add a label that says "Group Join Code" and a helper text explaining this is the exact code members should type. Keep the copy button functional.
- Group code display in AdminGroups (`GroupCodeBadge`) and GroupHub (`GroupCodeBadge`): Same -- display as-is and note it is the exact join code.
- In GroupHub `handleJoin`: Remove the hardcoded length-6 validation (`code.length !== 6`) since the real group codes from the backend are longer (e.g. `group_1`). Instead validate that the code is non-empty. Also update the input to not limit to 6 characters (`maxLength` and `slice(0, 6)` should be removed). Update placeholder text to reflect the actual code format.
- Join Group input label/description text: Update to say "Enter the group code shared by your admin" without specifying "6-character".

### Remove
- The `code.length !== 6` strict validation in `handleJoin` in GroupHub.tsx.
- The `maxLength={6}` and `.slice(0, 6)` constraint on the join code input.
- Any UI text saying "6-character code" or "6-character group code" throughout the app.

## Implementation Plan
1. Fix GroupHub.tsx: remove 6-char length restriction from join input and validation; update placeholder and helper text.
2. Fix AdminMembers.tsx: improve GroupCodeDisplay to be more prominent; add an "Invite Member" info section explaining the self-join flow.
3. Fix AdminGroups.tsx and GroupHub GroupCodeBadge: update label copy to not imply 6 chars.
4. Validate, typecheck, and build.
