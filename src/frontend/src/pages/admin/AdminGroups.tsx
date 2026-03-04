import { useAuth } from "@/auth";
import type { Group } from "@/backend.d";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroup } from "@/context/GroupContext";
import { useDeleteGroup, useMyGroups } from "@/hooks/useQueries";
import { formatDate } from "@/utils/format";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Coins,
  Copy,
  Layers,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

function GroupCodeBadge({ code }: { code: string }) {
  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast.success("Group code copied!");
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-md bg-brand-subtle border border-brand/20 px-2.5 py-1 font-mono text-sm font-bold text-brand cursor-pointer hover:bg-brand/10 transition-colors"
      title="Click to copy group code"
      data-ocid="group.code.button"
    >
      {code}
      <Copy className="h-3 w-3" />
    </button>
  );
}

export default function AdminGroups() {
  const { myGroups, isLoading, setActiveGroup, activeGroup } = useGroup();
  const { data: groups, refetch } = useMyGroups();
  const deleteGroup = useDeleteGroup();
  const navigate = useNavigate();
  const { principal } = useAuth();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // Only show groups this user created
  const myAdminGroups = (groups ?? myGroups).filter(
    (g) => principal && g.createdBy.toText() === principal.toText(),
  );

  function openDelete(group: Group) {
    setSelectedGroup(group);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!selectedGroup) return;
    try {
      await deleteGroup.mutateAsync(selectedGroup.id);
      toast.success(`Group "${selectedGroup.name}" deleted.`);
      setDeleteOpen(false);
      refetch();
      // If deleted group was active, clear active
      if (activeGroup?.id === selectedGroup.id) {
        const remaining = myGroups.filter((g) => g.id !== selectedGroup.id);
        if (remaining.length > 0) setActiveGroup(remaining[0]);
      }
    } catch {
      toast.error("Failed to delete group.");
    }
  }

  function handleSwitch(group: Group) {
    setActiveGroup(group);
    navigate({ to: "/admin/dashboard" });
    toast.success(`Switched to "${group.name}"`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            My Groups
          </h1>
          <p className="text-sm text-muted-foreground">
            Groups you've created and administer
          </p>
        </div>
        <Button
          onClick={() => navigate({ to: "/group-hub" })}
          className="bg-brand hover:bg-brand-dark text-white"
          data-ocid="group.create.open_modal_button"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Group
        </Button>
      </div>

      {isLoading ? (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          data-ocid="groups.loading_state"
        >
          {Array.from({ length: 3 }, (_, i) => i).map((i) => (
            <Skeleton key={`sk-${i}`} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : myAdminGroups.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20 shadow-card text-center"
          data-ocid="groups.empty_state"
        >
          <Layers className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="font-medium text-muted-foreground">
            No groups created yet
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Create a group to start managing savings
          </p>
          <Button
            onClick={() => navigate({ to: "/group-hub" })}
            className="mt-4 bg-brand hover:bg-brand-dark text-white"
            data-ocid="groups.create.button"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Group
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myAdminGroups.map((group, i) => {
            const isActive = activeGroup?.id === group.id;
            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Card
                  data-ocid={`groups.item.${i + 1}`}
                  className={`shadow-card hover:shadow-card-md transition-shadow h-full flex flex-col ${isActive ? "ring-2 ring-brand" : ""}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle">
                          <Coins className="h-4 w-4 text-brand" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="font-display text-base leading-tight">
                            {group.name}
                          </CardTitle>
                          {isActive && (
                            <Badge className="mt-0.5 h-4 text-[10px] bg-brand text-white px-1.5">
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>
                      {isActive && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-brand mt-1" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3 pt-0">
                    {group.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {group.description}
                      </p>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">
                        Group Code — share with members to invite them
                      </p>
                      <GroupCodeBadge code={group.groupCode} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created: {formatDate(group.createdAt)}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0 flex gap-2">
                    {!isActive && (
                      <Button
                        size="sm"
                        onClick={() => handleSwitch(group)}
                        className="flex-1 bg-brand hover:bg-brand-dark text-white h-8 text-xs"
                        data-ocid={`groups.switch.button.${i + 1}`}
                      >
                        Switch
                        <ArrowRight className="ml-1.5 h-3 w-3" />
                      </Button>
                    )}
                    {isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate({ to: "/admin/dashboard" })}
                        className="flex-1 h-8 text-xs border-brand/30 text-brand"
                        data-ocid={`groups.manage.button.${i + 1}`}
                      >
                        Manage
                        <ArrowRight className="ml-1.5 h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDelete(group)}
                      data-ocid={`groups.delete.button.${i + 1}`}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent data-ocid="group.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete Group
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{selectedGroup?.name}</strong>? All members, loans, and
              contribution records will be permanently removed. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="group.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-white"
              data-ocid="group.delete.confirm_button"
            >
              {deleteGroup.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
