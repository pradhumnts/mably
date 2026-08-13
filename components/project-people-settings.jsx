"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  inviteProjectStakeholder,
  listProjectStakeholders,
  resendProjectStakeholderInvite,
  revokeProjectStakeholder,
} from "@/lib/actions/project-stakeholders";

function initialOf(name, email) {
  const n = (name || "").trim();
  if (n) return n.charAt(0).toUpperCase();
  const e = (email || "").trim();
  return e ? e.charAt(0).toUpperCase() : "?";
}

/**
 * Freelancer-only: manage additional clients/stakeholders on a project.
 * @param {{ projectId: string; disabled?: boolean }} props
 */
export function ProjectPeopleSettings({ projectId, disabled = false }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [primary, setPrimary] = useState(null);
  const [members, setMembers] = useState(/** @type {any[]} */ ([]));
  const [invites, setInvites] = useState(/** @type {any[]} */ ([]));

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await listProjectStakeholders(projectId);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error || "Could not load people");
      return;
    }
    setPrimary(res.primary);
    setMembers(res.members || []);
    setInvites(res.invites || []);
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onInvite = async (e) => {
    e.preventDefault();
    if (disabled || saving) return;
    setSaving(true);
    const res = await inviteProjectStakeholder(projectId, email);
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error || "Could not send invite");
      return;
    }
    setEmail("");
    if (res.warning) {
      toast.message("Invite saved", { description: res.warning });
    } else if (res.resent) {
      toast.success("Invite resent");
    } else {
      toast.success("Invite sent");
    }
    await refresh();
  };

  const onResend = async (inviteId) => {
    if (disabled) return;
    const res = await resendProjectStakeholderInvite(projectId, inviteId);
    if (!res.ok) {
      toast.error(res.error || "Could not resend");
      return;
    }
    toast.success(res.skipped ? "Invite ready (email skipped in this env)" : "Invite resent");
  };

  const onRevokeInvite = async (inviteId) => {
    if (disabled) return;
    const res = await revokeProjectStakeholder(projectId, { inviteId });
    if (!res.ok) {
      toast.error(res.error || "Could not remove invite");
      return;
    }
    toast.success("Invite removed");
    await refresh();
  };

  const onRevokeMember = async (memberUserId) => {
    if (disabled) return;
    const res = await revokeProjectStakeholder(projectId, { memberUserId });
    if (!res.ok) {
      toast.error(res.error || "Could not remove access");
      return;
    }
    toast.success("Access removed");
    await refresh();
  };

  const extraMembers = members.filter((m) => !m.isPrimary);

  return (
    <Card>
      <CardHeader>
        <CardTitle>People</CardTitle>
        <CardDescription>
          Invite extra clients or stakeholders to this portal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading people…
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <p className="text-sm font-medium">Primary client</p>
              {primary ? (
                <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={primary.avatar || undefined} alt="" />
                    <AvatarFallback>
                      {initialOf(primary.name, primary.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {primary.name || primary.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{primary.email}</p>
                  </div>
                  <Badge variant="secondary">
                    {primary.hasJoined ? "Joined" : "Invited"}
                  </Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No primary client email on this project yet.
                </p>
              )}
            </div>

            {(extraMembers.length > 0 || invites.length > 0) && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Additional access</p>
                <ul className="space-y-2">
                  {extraMembers.map((m) => (
                    <li
                      key={m.userId}
                      className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={m.avatar || undefined} alt="" />
                        <AvatarFallback>
                          {initialOf(m.name, m.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {m.name || m.email || "Client"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {m.email || "—"}
                        </p>
                      </div>
                      <Badge variant="secondary">Joined</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        disabled={disabled}
                        onClick={() => void onRevokeMember(m.userId)}
                        aria-label="Remove access"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                  {invites.map((inv) => (
                    <li
                      key={inv.id}
                      className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{inv.email}</p>
                        <p className="text-xs text-muted-foreground">Pending invite</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={disabled}
                        onClick={() => void onResend(inv.id)}
                      >
                        Resend
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        disabled={disabled}
                        onClick={() => void onRevokeInvite(inv.id)}
                        aria-label="Remove invite"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={onInvite} className="space-y-3 border-t pt-4">
              <Label htmlFor="stakeholder-email">Invite someone else</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="stakeholder-email"
                  type="email"
                  placeholder="colleague@client.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={disabled || saving}
                  className="sm:flex-1"
                />
                <Button type="submit" disabled={disabled || saving || !email.trim()}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  <span className="ml-2">Send invite</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                They’ll get the same portal access with their own account.
              </p>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
