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
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { deleteProjectInvoice } from "@/lib/actions/project-invoices";

/**
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   projectId: string;
 *   item: { id: string; invoiceNo: string; amountLabel: string } | null;
 *   onDeleted?: () => void;
 * }}
 */
export function DeleteProjectInvoiceDialog({ open, onOpenChange, projectId, item, onDeleted }) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) setBusy(false);
  }, [open]);

  const handleDelete = async () => {
    if (!item?.id) return;
    setBusy(true);
    const res = await deleteProjectInvoice(projectId, item.id);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error || "Could not delete invoice");
      return;
    }
    toast.success("Invoice removed");
    onOpenChange(false);
    onDeleted?.();
  };

  if (!item) return null;

  const summary = [item.invoiceNo, item.amountLabel].filter(Boolean).join(" · ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border border-border shadow-lg">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden />
            </div>
            <div className="space-y-1.5 text-left">
              <DialogTitle className="text-xl">Delete this invoice?</DialogTitle>
              <DialogDescription className="text-left text-sm leading-relaxed">
                This removes the row from the project payment list. It does not cancel charges on Stripe or other
                platforms. This cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <p className="text-sm font-medium text-foreground border border-border rounded-md bg-muted/40 px-3 py-2">
          <span className="font-mono break-all">{summary}</span>
        </p>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={busy} onClick={() => void handleDelete()}>
            {busy ? "Deleting…" : "Delete invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
