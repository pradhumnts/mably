"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, FolderKanban, Loader2, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ProjectLogo } from "@/components/freelancer-dashboard/project-logo";
import {
  inviteWorkspaceMember,
  listWorkspaceProjectsForInvite,
  listWorkspaceTeam,
  removeWorkspaceMember,
  revokeWorkspaceInvite,
  updateWorkspaceMemberRole,
} from "@/lib/actions/workspace-team";

function initialOf(name, email) {
  const n = (name || "").trim();
  if (n) return n.charAt(0).toUpperCase();
  const e = (email || "").trim();
  return e ? e.charAt(0).toUpperCase() : "?";
}

function projectStatusDotClass(statusKey) {
  if (statusKey === "active") return "bg-emerald-500";
  if (statusKey === "on_hold") return "bg-amber-500";
  if (statusKey === "completed") return "bg-sky-500";
  if (statusKey === "draft") return "bg-zinc-400";
  return "bg-zinc-400";
}

/**
 * Settings → Members: invite and manage teammates on this workspace.
 */
export function WorkspaceMembersSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invitesEnabled, setInvitesEnabled] = useState(false);
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [projects, setProjects] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [seatBilling, setSeatBilling] = useState(null);

  const refresh = useCallback(async () => {
    const res = await listWorkspaceTeam();
    if (!res.ok) {
      toast.error(res.error || "Could not load members");
      setLoading(false);
      return;
    }
    setWorkspace(res.workspace);
    setMembers(res.members || []);
    setInvites(res.invites || []);
    setInvitesEnabled(Boolean(res.invitesEnabled));
    setSeatBilling(res.seatBilling ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [teamRes, projectRes] = await Promise.all([
        listWorkspaceTeam(),
        listWorkspaceProjectsForInvite(),
      ]);
      if (cancelled) return;
      if (!teamRes.ok) {
        toast.error(teamRes.error || "Could not load members");
      } else {
        setWorkspace(teamRes.workspace);
        setMembers(teamRes.members || []);
        setInvites(teamRes.invites || []);
        setInvitesEnabled(Boolean(teamRes.invitesEnabled));
        setSeatBilling(teamRes.seatBilling ?? null);
      }
      if (projectRes.ok) setProjects(projectRes.projects || []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const canManage = workspace?.role === "owner" || workspace?.role === "admin";

  const resetInviteForm = () => {
    setEmail("");
    setRole("member");
    setSelectedProjectIds([]);
  };

  const onInviteOpenChange = (open) => {
    setInviteOpen(open);
    if (!open) resetInviteForm();
  };

  const onInvite = async (e) => {
    e.preventDefault();
    if (!invitesEnabled || !canManage || saving) return;
    setSaving(true);
    const res = await inviteWorkspaceMember({
      email,
      role,
      projectIds: role === "member" ? selectedProjectIds : [],
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error || "Could not invite");
      return;
    }
    if (res.warning) toast.message("Invite saved", { description: res.warning });
    else if (res.skippedEmail) toast.success("Invite saved (email skipped in this env)");
    else toast.success("Invite sent");
    onInviteOpenChange(false);
    await refresh();
  };

  const toggleProject = (id) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <div className="space-y-1.5 min-w-0">
            <CardTitle>Team</CardTitle>
            <CardDescription>
              People on {workspace?.name || "your workspace"}. Owners and admins can see
              everything. Members only see the projects listed under their name — you can
              change that when you invite them, or later in a project’s Settings → Team.
            </CardDescription>
            {seatBilling?.paid ? (
              <p className="text-sm text-muted-foreground pt-1">
                {seatBilling.seats} seat{seatBilling.seats === 1 ? "" : "s"} ·{" "}
                <span className="capitalize">{seatBilling.planKey}</span>
                {seatBilling.founding ? (
                  <>
                    {" "}
                    · founding on your plan; extra teammates $
                    {String(seatBilling.planKey).toLowerCase() === "growth" ? "19" : "9"}
                    /mo each
                  </>
                ) : (
                  <>
                    {" "}
                    × $
                    {Number(seatBilling.dollarsPerSeat) % 1 === 0
                      ? String(Math.round(Number(seatBilling.dollarsPerSeat)))
                      : Number(seatBilling.dollarsPerSeat).toFixed(2)}
                    /mo each
                  </>
                )}
              </p>
            ) : null}
          </div>
          {canManage && invitesEnabled ? (
            <Button type="button" onClick={() => setInviteOpen(true)} className="shrink-0">
              <UserPlus className="size-4" />
              Invite team
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading…
            </div>
          ) : (
            <ul className="space-y-3">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-9">
                      <AvatarImage src={m.avatarUrl || undefined} />
                      <AvatarFallback>{initialOf(m.fullName, m.email)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {m.fullName || m.email || "Member"}
                        {m.isSelf ? " (you)" : ""}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                      {m.seesAllProjects ? (
                        <p className="text-xs text-muted-foreground mt-1">
                          Can see all projects
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          {(m.projectAccess || []).length > 0
                            ? `Can open: ${(m.projectAccess || []).map((p) => p.name).join(", ")}`
                            : "No projects yet — open a project’s Settings → Team to give access"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {workspace?.role === "owner" &&
                    !m.isSelf &&
                    m.role !== "owner" &&
                    invitesEnabled ? (
                      <Select
                        value={m.role}
                        onValueChange={async (next) => {
                          const res = await updateWorkspaceMemberRole({
                            memberUserId: m.userId,
                            role: next,
                          });
                          if (!res.ok) toast.error(res.error || "Could not update role");
                          else {
                            toast.success("Role updated");
                            await refresh();
                          }
                        }}
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary" className="capitalize">
                        {m.role}
                      </Badge>
                    )}
                    {canManage && !m.isSelf && m.role !== "owner" && invitesEnabled ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        onClick={async () => {
                          const res = await removeWorkspaceMember(m.userId);
                          if (!res.ok) toast.error(res.error || "Could not remove");
                          else {
                            if (res.warning) {
                              toast.message("Member removed", { description: res.warning });
                            } else {
                              toast.success("Member removed");
                            }
                            await refresh();
                          }
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {invites.length > 0 ? (
            <div className="space-y-2 pt-2">
              <p className="text-sm font-medium">Pending invites</p>
              {invites.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <span className="truncate min-w-0">
                    {inv.email} · {inv.role}
                    {inv.role === "member" ? (
                      <span className="block text-xs text-muted-foreground">
                        {(inv.projectNames || []).length > 0
                          ? `Will see: ${(inv.projectNames || []).join(", ")}`
                          : "No projects selected"}
                      </span>
                    ) : (
                      <span className="block text-xs text-muted-foreground">
                        Will see all projects
                      </span>
                    )}
                  </span>
                  {canManage && invitesEnabled ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        const res = await revokeWorkspaceInvite(inv.id);
                        if (!res.ok) toast.error(res.error || "Could not revoke");
                        else {
                          toast.success("Invite revoked");
                          await refresh();
                        }
                      }}
                    >
                      Revoke
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={onInviteOpenChange}>
        <DialogContent className="gap-5 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invite teammate</DialogTitle>
            <DialogDescription>
              Admins get the full workspace. Members only open the projects you select.
              You’ll be charged for an extra seat when they accept — pending invites stay free.
              Client portal guests are still free.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onInvite} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="team-email">Email</Label>
                <Input
                  id="team-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teammate@agency.com"
                  disabled={saving}
                  required
                  autoFocus
                />
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole} disabled={saving}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[200]">
                    {workspace?.role === "owner" ? (
                      <SelectItem value="admin">Admin</SelectItem>
                    ) : null}
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {role === "member" ? (
              <div className="grid gap-2.5">
                <div className="flex items-center justify-between gap-3">
                  <Label>Projects they can access</Label>
                  {projects.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {selectedProjectIds.length} of {projects.length} selected
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        disabled={saving}
                        onClick={() => {
                          setSelectedProjectIds((prev) =>
                            prev.length === projects.length
                              ? []
                              : projects.map((p) => p.id)
                          );
                        }}
                      >
                        {selectedProjectIds.length === projects.length
                          ? "Clear all"
                          : "Select all"}
                      </Button>
                    </div>
                  ) : null}
                </div>
                {projects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 px-4 py-10 text-center">
                    <FolderKanban className="size-8 text-muted-foreground/70" />
                    <p className="text-sm text-muted-foreground">No projects yet.</p>
                  </div>
                ) : (
                  <ul className="grid max-h-[min(22rem,50vh)] grid-cols-1 gap-2 overflow-y-auto pr-0.5 sm:grid-cols-2">
                    {projects.map((p) => {
                      const selected = selectedProjectIds.includes(p.id);
                      return (
                        <li key={p.id} className="min-w-0">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => toggleProject(p.id)}
                            aria-pressed={selected}
                            className={cn(
                              "flex h-full w-full items-start gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors",
                              "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            )}
                          >
                            <ProjectLogo
                              src={p.logoUrl}
                              name={p.name}
                              size="sm"
                              className="h-11 w-11 rounded-lg"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium leading-tight">
                                {p.name}
                              </p>
                              <div className="mt-1.5 flex flex-col gap-1 text-xs text-muted-foreground">
                                {p.clientName ? (
                                  <span className="truncate">{p.clientName}</span>
                                ) : null}
                                {p.status ? (
                                  <span className="inline-flex items-center gap-1.5">
                                    <span
                                      className={cn(
                                        "size-1.5 rounded-full",
                                        projectStatusDotClass(p.statusKey)
                                      )}
                                    />
                                    {p.status}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <span
                              className={cn(
                                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/30 bg-background"
                              )}
                              aria-hidden
                            >
                              {selected ? <Check className="size-3.5 stroke-[2.5]" /> : null}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : null}
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onInviteOpenChange(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserPlus className="size-4" />
                )}
                <span className="ml-2">Send invite</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
