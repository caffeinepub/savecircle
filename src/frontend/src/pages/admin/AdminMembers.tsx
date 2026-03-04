import type { Member } from "@/backend.d";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAddMember,
  useDeleteMember,
  useEditMember,
  useMembers,
} from "@/hooks/useQueries";
import { formatDate } from "@/utils/format";
import {
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminMembers() {
  const { data: members, isLoading } = useMembers();
  const addMember = useAddMember();
  const editMember = useEditMember();
  const deleteMember = useDeleteMember();

  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);

  const filtered =
    members?.filter(
      (m) =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        m.phone.includes(search),
    ) ?? [];

  function openAdd() {
    setName("");
    setEmail("");
    setPhone("");
    setAddOpen(true);
  }

  function openEdit(member: Member) {
    setSelectedMember(member);
    setName(member.name);
    setEmail(member.email);
    setPhone(member.phone);
    setIsActive(member.isActive);
    setEditOpen(true);
  }

  function openDelete(member: Member) {
    setSelectedMember(member);
    setDeleteOpen(true);
  }

  async function handleAdd() {
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    try {
      await addMember.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      toast.success(`${name} added successfully.`);
      setAddOpen(false);
    } catch {
      toast.error("Failed to add member.");
    }
  }

  async function handleEdit() {
    if (!selectedMember) return;
    try {
      await editMember.mutateAsync({
        id: selectedMember.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        isActive,
      });
      toast.success(`${name} updated successfully.`);
      setEditOpen(false);
    } catch {
      toast.error("Failed to update member.");
    }
  }

  async function handleDelete() {
    if (!selectedMember) return;
    try {
      await deleteMember.mutateAsync(selectedMember.id);
      toast.success(`${selectedMember.name} removed.`);
      setDeleteOpen(false);
    } catch {
      toast.error("Failed to delete member.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Members
          </h1>
          <p className="text-sm text-muted-foreground">
            {members?.length ?? 0} registered members
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-brand hover:bg-brand-dark text-white"
          data-ocid="member.add_button"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

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
                : 'Click "Add Member" to get started'}
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
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">
                    Role
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pr-4 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((member, i) => (
                  <TableRow
                    key={member.id}
                    data-ocid={`members.item.${i + 1}`}
                    className="hover:bg-muted/30 border-border"
                  >
                    <TableCell className="pl-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-xs font-bold text-brand">
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {member.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {member.email}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                      {member.phone}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                      {formatDate(member.joinDate)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={member.isActive ? "active" : "inactive"}
                      />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-xs font-medium capitalize text-muted-foreground">
                        {member.role}
                      </span>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(member)}
                          data-ocid="member.edit_button"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDelete(member)}
                          data-ocid="member.delete_button"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>

      {/* Add Member Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent data-ocid="member.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Add New Member</DialogTitle>
            <DialogDescription>
              Enter the member's details to add them to the savings group.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input
                placeholder="e.g. Jane Adeyemi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-ocid="member.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-ocid="member.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                placeholder="+1 555 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-ocid="member.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              data-ocid="member.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={addMember.isPending}
              className="bg-brand hover:bg-brand-dark text-white"
              data-ocid="member.confirm_button"
            >
              {addMember.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent data-ocid="member.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Member</DialogTitle>
            <DialogDescription>
              Update the member's information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-ocid="member.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-ocid="member.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-ocid="member.input"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Active Status</p>
                <p className="text-xs text-muted-foreground">
                  Deactivate to suspend the member
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                data-ocid="member.switch"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              data-ocid="member.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={editMember.isPending}
              className="bg-brand hover:bg-brand-dark text-white"
              data-ocid="member.save_button"
            >
              {editMember.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent data-ocid="member.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete Member
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{selectedMember?.name}</strong>? This action cannot be
              undone.
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
              {deleteMember.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
