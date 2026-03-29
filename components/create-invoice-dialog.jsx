"use client";

import { useState } from "react";
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
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function CreateInvoiceDialog({ open, onOpenChange, projectData }) {
  const [formData, setFormData] = useState({
    projectName: projectData?.projectName || "",
    clientName: projectData?.clientName || "",
    clientEmail: projectData?.clientEmail || "",
    clientAvatar: projectData?.clientAvatar || "",
    amount: "",
    invoiceLink: "",
    notes: "",
  });
  
  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(undefined);
  const [invoiceDateOpen, setInvoiceDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate that due date is provided
    if (!dueDate) {
      alert("Please select a due date");
      return;
    }
    
    // In the future, this will save to the database
    const invoiceData = {
      ...formData,
      invoiceDate,
      dueDate,
    };
    console.log("Invoice data:", invoiceData);
    onOpenChange(false);
    
    // Reset form
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create Invoice</DialogTitle>
          <DialogDescription>
            Add invoice details. You can add external payment links from any payment platform.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Project Name */}
            <div className="grid gap-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                name="projectName"
                value={formData.projectName}
                onChange={handleInputChange}
                disabled
                className="bg-muted"
              />
            </div>

            {/* Client Details with Avatar */}
            <div className="grid gap-2">
              <Label>Client</Label>
              <div className="flex items-center gap-3 p-3 rounded-md border bg-muted">
                <Avatar className="h-[36px] w-[36px]">
                  <AvatarImage src={formData.clientAvatar} alt={formData.clientName} />
                  <AvatarFallback>{formData.clientName?.charAt(0) || "C"}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{formData.clientName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formData.clientEmail}
                  </span>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="pl-7"
                  required
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="invoiceDate">Invoice Date</Label>
                <Popover open={invoiceDateOpen} onOpenChange={setInvoiceDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="invoiceDate"
                      className={cn(
                        "w-full justify-between font-normal",
                        !invoiceDate && "text-muted-foreground"
                      )}
                    >
                      {invoiceDate ? (
                        invoiceDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      ) : (
                        "Select a date"
                      )}
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
                <Label htmlFor="dueDate">Due Date</Label>
                <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="dueDate"
                      className={cn(
                        "w-full justify-between font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      {dueDate ? (
                        dueDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      ) : (
                        "Select a date"
                      )}
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
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Invoice Link */}
            <div className="grid gap-2">
              <Label htmlFor="invoiceLink">Invoice Link</Label>
              <Input
                id="invoiceLink"
                name="invoiceLink"
                type="url"
                placeholder="https://contra.com/invoice/... or Upwork, Stripe link"
                value={formData.invoiceLink}
                onChange={handleInputChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Add a link to your invoice from Contra, Upwork, Stripe, or other payment platforms
              </p>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">
                Notes <span className="text-muted-foreground text-sm">(Optional)</span>
              </Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Additional notes or description..."
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

