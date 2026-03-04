import type { GroupMembership } from "@/backend.d";
import { StatusBadge } from "@/components/StatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGroup } from "@/context/GroupContext";
import {
  useGroupMembers,
  useRemoveMember,
  useUpdateMemberStatus,
} from "@/hooks/useQueries";
import {
  Check,
  Copy,
  Info,
  Loader2,
  Search,
  Share2,
  Trash2,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

function GroupCodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Group code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      {/* Code Card */}
      <div className="rounded-xl border-2 border-brand/25 bg-gradient-to-r from-brand-subtle to-orange-50 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 shrink-0">
              <Share2 className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Group Join Code
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Share this code with anyone you want to invite
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-2.5 rounded-lg border-2 px-5 py-3 font-mono text-xl font-bold tracking-widest cursor-pointer transition-all duration-200 ${
              copied
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-brand/40 bg-white text-brand hover:bg-brand-subtle hover:border-brand/60"
            }`}
            title="Click to copy"
            data-ocid="members.code.button"
          >
            <span>{code}</span>
            {copied ? (
              <Check className="h-4 w-4 text-green-600 shrink-0" />
            ) : (
              <Copy className="h-4 w-4 shrink-0 opacity-60" />
            )}
          </button>
        </div>
        {copied && (
          <p className="text-xs text-green-600 font-medium mt-2 sm:text-right">
            ✓ Code copied to clipboard
          </p>
        )}
      </div>

      {/* How to invite members callout */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3.5">
        <div className="flex items-start gap-2.5">
          <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-blue-800 mb-1.5">
              How to invite members
            </p>
            <ol className="space-y-1 text-xs text-blue-700 list-none">
              <li className="flex items-start gap-1.5">
                <span className="font-bold shrink-0">1.</span>
                <span>
                  Share the group code above with the person you want to invite
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold shrink-0">2.</span>
                <span>They log in at the app URL using Internet Identity</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold shrink-0">3.</span>
                <span>On the Group Hub page, they enter this code to join</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminMembers() {
  const { activeGroup } = useGroup();
  const groupId = activeGroup?.id;

  const { data: members, isLoading } = useGroupMembers(groupId);
  const removeMember = useRemoveMember();
  const updateStatus = useUpdateMemberStatus();

  const [search, setSearch] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<GroupMembership | null>(
    null,
  );

  const filtered =
    members?.filter(
      (m) =>
        m.memberName.toLowerCase().includes(search.toLowerCase()) ||
        m.memberEmail.toLowerCase().includes(search.toLowerCase()) ||
        m.memberPhone.includes(search),
    ) ?? [];

  function openDelete(member: GroupMembership) {
    setSelectedMember(member);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!selectedMember) return;
    try {
      await removeMember.mutateAsync({
        memberPrincipal: selectedMember.memberPrincipal,
      });
      toast.success("Member removed from group.");
      setDeleteOpen(false);
    } catch {
      toast.error("Failed to remove member.");
    }
  }

  async function handleToggleStatus(member: GroupMembership) {
    try {
      await updateStatus.mutateAsync({
        memberPrincipal: member.memberPrincipal,
        isActive: !member.isActive,
      });
      toast.success(
        `Member ${!member.isActive ? "activated" : "deactivated"}.`,
      );
    } catch {
      toast.error("Failed to update member status.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Members
        </h1>
        <p className="text-sm text-muted-foreground">
          {members?.length ?? 0} member(s) in this group
        </p>
      </div>

      {/* Group Code */}
      {activeGroup && <GroupCodeDisplay code={activeGroup.groupCode} />}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-ocid="members.search_input"
        />
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card shadow-card overflow-hidden"
      >
        {isLoading ? (
          <div className="p-6 space-y-3" data-ocid="members.loading_state">
            {Array.from({ length: 5 }, (_, i) => i).map((i) => (
              <Skeleton key={`sk-${i}`} className="h-14 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 text-center"
            data-ocid="members.empty_state"
          >
            <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">
              {search ? "No members found" : "No members yet"}
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {search
                ? "Try adjusting your search"
                : "Share the group code above to invite members"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table data-ocid="admin.members_table">
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/30 border-border">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pl-5">
                    Name
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Email
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">
                    Phone
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">
                    Joined
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pr-4 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((member, i) => {
                  const joinDate = new Date(
                    Number(member.joinedAt) / 1_000_000,
                  );
                  return (
                    <TableRow
                      key={member.memberPrincipal.toText()}
                      data-ocid={`members.item.${i + 1}`}
                      className="hover:bg-muted/30 border-border"
                    >
                      <TableCell className="pl-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-xs font-bold text-brand">
                            {(member.memberName || "?")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {member.memberName || "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {member.memberEmail || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                        {member.memberPhone || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                        {joinDate.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={member.isActive ? "active" : "inactive"}
                        />
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(member)}
                            disabled={updateStatus.isPending}
                            data-ocid={`members.toggle.button.${i + 1}`}
                            className="h-7 text-xs"
                          >
                            {updateStatus.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : member.isActive ? (
                              "Deactivate"
                            ) : (
                              "Activate"
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDelete(member)}
                            data-ocid={`members.delete_button.${i + 1}`}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>

      {/* Remove Member Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent data-ocid="member.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Remove Member
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{selectedMember?.memberName || "this member"}</strong>{" "}
              from the group? Their transaction history will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="member.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-white"
              data-ocid="member.delete_button"
            >
              {removeMember.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
