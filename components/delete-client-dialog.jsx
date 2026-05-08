"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { deleteClient } from "@/lib/actions/clients";

/**
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   client: { id: string; name?: string; email?: string; avatar?: string | null } | null;
 *   onDeleted?: () => void;
 * }}
 */
export function DeleteClientDialog({ open, onOpenChange, client, onDeleted }) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) setBusy(false);
  }, [open]);

  const handleDelete = async () => {
    if (!client?.id) return;
    setBusy(true);
    const res = await deleteClient(client.id);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error || "Could not delete client");
      return;
    }
    toast.success("Client removed");
    onOpenChange(false);
    onDeleted?.();
  };

  if (!client) return null;

  const displayName = (client.name ?? "").trim() || "this client";
  const initial = displayName.charAt(0).toUpperCase() || "?";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border border-border shadow-lg">
        <DialogHeader>
          <div className="flex items-start gap-3">
            
            <div className="space-y-1.5 text-left">
              <DialogTitle className="text-xl">Delete this client?</DialogTitle>
              <DialogDescription className="text-left text-sm leading-relaxed">
                This permanently removes the client from your contacts. If they
                are linked to any active projects, you&apos;ll need to remove or
                reassign those first. This cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2.5">
          <Avatar className="h-9 w-9">
            <AvatarImage src={client.avatar || undefined} alt={displayName} />
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {displayName}
            </p>
            {client.email ? (
              <p className="truncate text-xs text-muted-foreground">
                {client.email}
              </p>
            ) : null}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={() => void handleDelete()}
          >
            {busy ? "Deleting…" : "Delete client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
