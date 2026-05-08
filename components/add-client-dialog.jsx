"use client";

import { useEffect, useState } from "react";
import { createClientRecord, updateClient } from "@/lib/actions/clients";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Link as LinkIcon, GripVertical } from "lucide-react";

// Social media icon components
const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#0A66C2">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#25D366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

// Helper to get icon based on URL/label
const getLinkIcon = (url, label) => {
  const urlLower = url.toLowerCase();
  const labelLower = label.toLowerCase();
  
  if (urlLower.includes('twitter.com') || urlLower.includes('x.com') || labelLower.includes('twitter') || labelLower.includes('x')) {
    return <TwitterIcon />;
  }
  if (urlLower.includes('linkedin.com') || labelLower.includes('linkedin')) {
    return <LinkedInIcon />;
  }
  if (urlLower.includes('github.com') || labelLower.includes('github')) {
    return <GitHubIcon />;
  }
  if (urlLower.includes('wa.me') || urlLower.includes('whatsapp') || labelLower.includes('whatsapp')) {
    return <WhatsAppIcon />;
  }
  if (urlLower.includes('tiktok.com') || labelLower.includes('tiktok')) {
    return <TikTokIcon />;
  }
  return <LinkIcon className="h-5 w-5" />;
};

export function AddClientDialog({
  open,
  onOpenChange,
  client = null,
  onSaved,
  existingClients = [],
}) {
  const isEdit = Boolean(client);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
  });
  const [links, setLinks] = useState([]);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [currentLink, setCurrentLink] = useState({ label: "", url: "" });
  const [editingLinkId, setEditingLinkId] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (client) {
      setFormData({
        name: client.name ?? "",
        email: client.email ?? "",
        phone: client.phone ?? "",
        location: client.location ?? "",
      });
      setLinks(
        (client.links ?? []).map((l, i) => ({
          id: `link-${i}-${l.url}`,
          label: l.label,
          url: l.url,
        }))
      );
    } else {
      setFormData({ name: "", email: "", phone: "", location: "" });
      setLinks([]);
    }
    setShowLinkForm(false);
    setCurrentLink({ label: "", url: "" });
    setEditingLinkId(null);
  }, [open, client?.id, client?.email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const trimmedEmail = formData.email.trim().toLowerCase();
  const duplicateClient =
    trimmedEmail && Array.isArray(existingClients)
      ? existingClients.find(
          (c) =>
            (c?.email || "").trim().toLowerCase() === trimmedEmail &&
            (!isEdit || String(c?.id) !== String(client?.id))
        )
      : null;
  // Suppress while submitting or while the dialog is closing — otherwise a
  // freshly-created client gets added to `existingClients` in the same render
  // as `open=false`, and the helper would briefly flash during the exit anim.
  const hasDuplicateEmail = open && !isLoading && Boolean(duplicateClient);

  const handleAddLink = () => {
    setCurrentLink({ label: "", url: "" });
    setEditingLinkId(null);
    setShowLinkForm(true);
  };

  const handleEditLink = (link) => {
    setCurrentLink({ label: link.label, url: link.url });
    setEditingLinkId(link.id);
    setShowLinkForm(true);
  };

  const handleSaveLink = () => {
    if (!currentLink.label || !currentLink.url) {
      toast.error("Please fill in both fields");
      return;
    }

    if (editingLinkId) {
      // Editing existing link
      setLinks((prev) =>
        prev.map((link) =>
          link.id === editingLinkId
            ? { ...link, label: currentLink.label, url: currentLink.url }
            : link
        )
      );
    } else {
      // Adding new link
      setLinks((prev) => [
        ...prev,
        { id: Date.now(), label: currentLink.label, url: currentLink.url },
      ]);
    }

    setShowLinkForm(false);
    setCurrentLink({ label: "", url: "" });
    setEditingLinkId(null);
  };

  const handleRemoveLink = (id) => {
    setLinks((prev) => prev.filter((link) => link.id !== id));
  };

  const handleBackFromLinkForm = () => {
    setShowLinkForm(false);
    setCurrentLink({ label: "", url: "" });
    setEditingLinkId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasDuplicateEmail) {
      toast.error("A client with this email already exists.");
      return;
    }
    setIsLoading(true);

    const linksPayload = links.map(({ label, url }) => ({ label, url }));

    const payload = {
      fullName: formData.name,
      email: formData.email,
      phone: formData.phone,
      location: formData.location,
      links: linksPayload,
    };

    const result = isEdit
      ? await updateClient({ id: client.id, ...payload })
      : await createClientRecord(payload);

    setIsLoading(false);

    if (!result.ok) {
      toast.error(result.error || "Something went wrong");
      return;
    }

    toast.success(isEdit ? "Client updated" : "Client created", {
      description: isEdit
        ? `${formData.name} has been saved.`
        : `${formData.name} has been added to your list.`,
    });

    onOpenChange(false);
    if (!isEdit && result.id) {
      onSaved?.({
        id: result.id,
        name: formData.name,
        email: formData.email,
        avatar: null,
        phone: formData.phone,
        location: formData.location,
        links: linksPayload,
      });
    } else {
      onSaved?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl min-w-[500px] max-h-[90vh] overflow-y-auto">
        {!showLinkForm ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold">
                {isEdit ? "Edit Client" : "Add New Client"}
              </DialogTitle>
              <DialogDescription>
                {isEdit
                  ? "Update this client’s details and links."
                  : "Fill in the client details below to add them to your list."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="name">
                  Full Name <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  aria-invalid={hasDuplicateEmail || undefined}
                  aria-describedby={hasDuplicateEmail ? "email-duplicate-help" : undefined}
                  className={hasDuplicateEmail ? "border-destructive focus-visible:ring-destructive/20" : undefined}
                />
                {hasDuplicateEmail ? (
                  <p id="email-duplicate-help" className="text-xs text-destructive">
                    A client with this email already exists
                    {duplicateClient?.name ? ` (${duplicateClient.name})` : ""}.
                  </p>
                ) : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="phone">
                  Phone Number
                </FieldLabel>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="location">
                  Location
                </FieldLabel>
                <Input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="New York, NY"
                  value={formData.location}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </Field>
            </div>
          </div>

              {/* Links */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Links
                </h3>
                
                {/* Display added links */}
                {links.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {links.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors overflow-hidden"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move flex-shrink-0" />
                        <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
                          <div className="flex-shrink-0">
                            {getLinkIcon(link.url, link.label)}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-medium truncate">{link.url}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[280px]">{link.label}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditLink(link)}
                            disabled={isLoading}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveLink(link.id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add link button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLink}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add link
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || hasDuplicateEmail}>
                  {isLoading
                    ? isEdit
                      ? "Saving..."
                      : "Creating..."
                    : isEdit
                      ? "Save changes"
                      : "Create Client"}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            {/* Link Form */}
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold">
                {editingLinkId ? "Edit Link" : "Add Link"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <Field>
                <FieldLabel htmlFor="link-url">Link URL</FieldLabel>
                <Input
                  id="link-url"
                  type="url"
                  placeholder="Twitter / X, Instagram, etc."
                  value={currentLink.url}
                  onChange={(e) =>
                    setCurrentLink((prev) => ({ ...prev, url: e.target.value }))
                  }
                  disabled={isLoading}
                  autoFocus
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="link-label">Name the link</FieldLabel>
                <Input
                  id="link-label"
                  type="text"
                  placeholder="e.g., LinkedIn, Portfolio, GitHub"
                  value={currentLink.label}
                  onChange={(e) =>
                    setCurrentLink((prev) => ({ ...prev, label: e.target.value }))
                  }
                  disabled={isLoading}
                />
              </Field>

              <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackFromLinkForm}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveLink}
                  disabled={isLoading}
                >
                  Save link
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

