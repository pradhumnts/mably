"use client";

import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createProjectInvoice } from "@/lib/actions/project-invoices";

/**
 * @param {{
 *   open: boolean;
 *   onOpenChange: (open: boolean) => void;
 *   projectId: string;
 *   projectData: {
 *     projectName?: string;
 *     clientName?: string;
 *     clientEmail?: string;
 *     clientAvatar?: string | null;
 *   } | null | undefined;
 *   onCreated?: () => void;
 * }}
 */
export function CreateInvoiceDialog({ open, onOpenChange, projectId, projectData, onCreated }) {
  const [formData, setFormData] = useState({
    projectName: "",
    clientName: "",
    clientEmail: "",
    clientAvatar: "",
    amount: "",
    invoiceLink: "",
    notes: "",
  });

  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(undefined);
  const [invoiceDateOpen, setInvoiceDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFormData({
      projectName: projectData?.projectName || "",
      clientName: projectData?.clientName || "",
      clientEmail: projectData?.clientEmail || "",
      clientAvatar: projectData?.clientAvatar || "",
      amount: "",
      invoiceLink: "",
      notes: "",
    });
    setInvoiceDate(new Date());
    setDueDate(undefined);
  }, [
    open,
    projectData?.projectName,
    projectData?.clientName,
    projectData?.clientEmail,
    projectData?.clientAvatar,
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dueDate) {
      toast.error("Please select a due date");
      return;
    }
    const amount = Number.parseFloat(String(formData.amount).replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const link = String(formData.invoiceLink ?? "").trim();
    if (!link) {
      toast.error("Invoice link is required");
      return;
    }

    setBusy(true);
    const res = await createProjectInvoice(String(projectId), {
      amount,
      invoiceDate,
      dueDate,
      invoiceLink: link,
      notes: formData.notes,
    });
    setBusy(false);

    if (!res.ok) {
      toast.error(res.error || "Could not create invoice");
      return;
    }

    toast.success("Invoice added");
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90dvh,720px)] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add invoice</DialogTitle>
          <DialogDescription>
            Paste a link from Stripe, Contra, Upwork, or any billing tool. Your client sees it here in one place.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="projectName">Project name</Label>
              <Input
                id="projectName"
                name="projectName"
                value={formData.projectName}
                onChange={handleInputChange}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid gap-2">
              <Label>Client</Label>
              <div className="flex items-center gap-3 p-3 rounded-md border bg-muted">
                <Avatar className="h-[36px] w-[36px]">
                  <AvatarImage src={formData.clientAvatar || undefined} alt={formData.clientName} />
                  <AvatarFallback>{formData.clientName?.charAt(0) || "C"}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{formData.clientName}</span>
                  <span className="text-xs text-muted-foreground">{formData.clientEmail}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="pl-7"
                  required
                  disabled={busy}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="invoiceDate">Invoice date</Label>
                <Popover open={invoiceDateOpen} onOpenChange={setInvoiceDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="invoiceDate"
                      type="button"
                      disabled={busy}
                      className={cn(
                        "w-full justify-between font-normal",
                        !invoiceDate && "text-muted-foreground"
                      )}
                    >
                      {invoiceDate
                        ? invoiceDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Select a date"}
                      <CalendarIcon className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={invoiceDate}
                      onSelect={(date) => {
                        setInvoiceDate(date);
                        setInvoiceDateOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due date</Label>
                <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="dueDate"
                      type="button"
                      disabled={busy}
                      className={cn(
                        "w-full justify-between font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      {dueDate
                        ? dueDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Select a date"}
                      <CalendarIcon className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={(date) => {
                        setDueDate(date);
                        setDueDateOpen(false);
                      }}
                      disabled={(date) =>
                        invoiceDate ? date < new Date(invoiceDate.getFullYear(), invoiceDate.getMonth(), invoiceDate.getDate()) : false
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="invoiceLink">Invoice link</Label>
              <Input
                id="invoiceLink"
                name="invoiceLink"
                type="url"
                placeholder="https://…"
                value={formData.invoiceLink}
                onChange={handleInputChange}
                required
                disabled={busy}
              />
              <p className="text-xs text-muted-foreground">
                Link to pay or view the invoice on your payment platform
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">
                Notes <span className="text-muted-foreground text-sm">(optional)</span>
              </Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Milestone, phase, or anything helpful…"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                disabled={busy}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                "Add invoice"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
