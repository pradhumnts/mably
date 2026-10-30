"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  grantProjectStaffAccess,
  listProjectStaffAccess,
  revokeProjectStaffAccess,
} from "@/lib/actions/workspace-team";

function initialOf(name, email) {
  const n = (name || "").trim();
  if (n) return n.charAt(0).toUpperCase();
  const e = (email || "").trim();
  return e ? e.charAt(0).toUpperCase() : "?";
}

/**
 * Project Settings → Team access: grant workspace members this project.
 * @param {{ projectId: string; disabled?: boolean }} props
 */
export function ProjectTeamAccessSettings({ projectId, disabled = false }) {
  const [loading, setLoading] = useState(true);
  const [invitesEnabled, setInvitesEnabled] = useState(false);
  const [grants, setGrants] = useState([]);
  const [members, setMembers] = useState([]);
  const [pick, setPick] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const res = await listProjectStaffAccess(projectId);
    if (!res.ok) {
      toast.error(res.error || "Could not load team access");
      setLoading(false);
      return;
    }
    setInvitesEnabled(Boolean(res.invitesEnabled));
    setGrants(res.grants || []);
    setMembers(res.members || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await listProjectStaffAccess(projectId);
      if (cancelled) return;
      if (!res.ok) {
        toast.error(res.error || "Could not load team access");
      } else {
        setInvitesEnabled(Boolean(res.invitesEnabled));
        setGrants(res.grants || []);
        setMembers(res.members || []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const grantedIds = new Set(grants.map((g) => g.userId));
  const available = members.filter((m) => !grantedIds.has(m.userId));

  const onGrant = async () => {
    if (disabled || !invitesEnabled || !pick || saving) return;
    setSaving(true);
    const res = await grantProjectStaffAccess(projectId, pick);
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error || "Could not add");
      return;
    }
    setPick("");
    toast.success("Access granted");
    await refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team access</CardTitle>
        <CardDescription>
          Teammates who can work on this project. Owners and admins already have access
          to every project. Clients are managed under People.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : grants.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No teammates on this project yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {grants.map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="size-8">
                    <AvatarImage src={g.avatarUrl || undefined} />
                    <AvatarFallback>{initialOf(g.fullName, g.email)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {g.fullName || g.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{g.email}</p>
                  </div>
                </div>
                {invitesEnabled && !disabled ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive"
                    onClick={async () => {
                      const res = await revokeProjectStaffAccess(projectId, g.userId);
                      if (!res.ok) toast.error(res.error || "Could not remove");
                      else {
                        toast.success("Access removed");
                        await refresh();
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1">
            <Select
              value={pick}
              onValueChange={setPick}
              disabled={disabled || !invitesEnabled || available.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add workspace member…" />
              </SelectTrigger>
              <SelectContent>
                {available.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    {m.fullName || m.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            disabled={disabled || !invitesEnabled || !pick || saving}
            onClick={() => void onGrant()}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserPlus className="size-4" />
            )}
            <span className="ml-2">Add</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
