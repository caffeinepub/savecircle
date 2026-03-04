import { useAuth } from "@/auth";
import type { Group } from "@/backend.d";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useGroup } from "@/context/GroupContext";
import { useCreateGroup, useJoinGroup } from "@/hooks/useQueries";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Coins,
  Copy,
  Loader2,
  LogOut,
  Plus,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

function GroupCodeBadge({ code }: { code: string }) {
  function handleCopy() {
    navigator.clipboard.writeText(code);
    toast.success("Group code copied!");
  }
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-md bg-brand-subtle border border-brand/20 px-2.5 py-0.5 font-mono text-sm font-bold text-brand cursor-pointer hover:bg-brand/10 transition-colors"
      onClick={handleCopy}
      title="Click to copy"
    >
      {code}
      <Copy className="h-3 w-3" />
    </button>
  );
}

export default function GroupHub() {
  const { logout, isInitializing, principal } = useAuth();
  const { myGroups, isLoading, setActiveGroup, refreshGroups } = useGroup();
  const navigate = useNavigate();

  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();

  // Create form
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");

  // Join form
  const [groupCode, setGroupCode] = useState("");

  async function handleCreate() {
    if (!groupName.trim()) {
      toast.error("Group name is required.");
      return;
    }
    try {
      const group = await createGroup.mutateAsync({
        name: groupName.trim(),
        description: groupDesc.trim(),
      });
      refreshGroups();
      setActiveGroup(group);
      toast.success(`Group "${group.name}" created!`);
      navigate({ to: "/admin/dashboard" });
    } catch {
      toast.error("Failed to create group.");
    }
  }

  async function handleJoin() {
    const code = groupCode.trim().toUpperCase();
    if (code.length === 0) {
      toast.error("Please enter a valid group code.");
      return;
    }
    try {
      const group = await joinGroup.mutateAsync(code);
      refreshGroups();
      setActiveGroup(group);
      toast.success(`Joined "${group.name}"!`);
      navigate({ to: "/member/dashboard" });
    } catch {
      toast.error("Invalid group code or group not found.");
    }
  }

  function handleSwitchToGroup(group: Group) {
    setActiveGroup(group);
    const isAdmin =
      principal && group.createdBy.toText() === principal.toText();
    navigate({ to: isAdmin ? "/admin/dashboard" : "/member/dashboard" });
  }

  if (isInitializing || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
              <Coins className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              SaveCircle
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            data-ocid="auth.logout_button"
            className="text-muted-foreground hover:text-destructive gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Welcome to SaveCircle
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Create a new savings group or join an existing one using a group
            code.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Create Group */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-card h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-subtle">
                    <Plus className="h-5 w-5 text-brand" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-lg">
                      Create a Group
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Start a new savings group and become the admin
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="group-name">Group Name *</Label>
                  <Input
                    id="group-name"
                    placeholder="e.g. Family Savings Circle"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    data-ocid="group.create.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="group-desc">Description</Label>
                  <Textarea
                    id="group-desc"
                    placeholder="Brief description of this group's purpose..."
                    rows={3}
                    value={groupDesc}
                    onChange={(e) => setGroupDesc(e.target.value)}
                    data-ocid="group.create.textarea"
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={createGroup.isPending}
                  className="w-full bg-brand hover:bg-brand-dark text-white"
                  data-ocid="group.create.primary_button"
                >
                  {createGroup.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Create Group
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Join Group */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="shadow-card h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-subtle">
                    <Users className="h-5 w-5 text-success-fg" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-lg">
                      Join a Group
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Enter the group code shared by your admin
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="group-code">Group Code *</Label>
                  <Input
                    id="group-code"
                    placeholder="e.g. group_1"
                    value={groupCode}
                    onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                    className="font-mono text-lg tracking-widest uppercase text-center"
                    data-ocid="group.join.input"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ask your group admin for their group code
                  </p>
                </div>
                <div className="flex-1" />
                <Button
                  onClick={handleJoin}
                  disabled={
                    joinGroup.isPending || groupCode.trim().length === 0
                  }
                  className="w-full bg-brand hover:bg-brand-dark text-white"
                  data-ocid="group.join.primary_button"
                >
                  {joinGroup.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Join Group
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Existing Groups */}
        {myGroups.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10"
          >
            <Separator className="mb-8" />
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              Your Groups
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myGroups.map((group, i) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                >
                  <Card className="shadow-card hover:shadow-card-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">
                            {group.name}
                          </h3>
                          {group.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {group.description}
                            </p>
                          )}
                        </div>
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-success-fg mt-0.5" />
                      </div>
                      <div className="flex items-center justify-between">
                        <GroupCodeBadge code={group.groupCode} />
                        <Button
                          size="sm"
                          onClick={() => handleSwitchToGroup(group)}
                          className="h-7 text-xs bg-brand hover:bg-brand-dark text-white"
                          data-ocid={`group.switch.button.${i + 1}`}
                        >
                          Switch
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
