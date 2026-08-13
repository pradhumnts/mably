"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePortalProject } from "../project-portal-shell";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updatePortalProjectSettings } from "@/lib/actions/projects";
import {
  getPortalProjectSettings,
  savePortalClientContact,
  savePortalNotificationPreferences,
  uploadPortalClientAvatar,
} from "@/lib/actions/project-portal-settings";
import { BrowserPushSettings } from "@/components/browser-push-settings";
import {
  BrandColorFieldGroup,
  DEFAULT_BRAND_COLOR_HEX,
} from "@/components/brand-color-field";
import { PortalBrandPreview } from "@/components/create-project/portal-brand-preview";
import { ProjectPeopleSettings } from "@/components/project-people-settings";

function parseIsoDate(iso) {
  if (!iso || typeof iso !== "string") return undefined;
  const parts = iso.trim().slice(0, 10).split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return undefined;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

function formatLongDate(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function statusLabel(ui) {
  if (ui === "on-hold") return "On hold";
  if (ui === "active") return "Active";
  if (ui === "completed") return "Completed";
  if (ui === "draft") return "Draft";
  return ui || "—";
}

function statusBadgeClass(ui) {
  switch (ui) {
    case "active":
      return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200";
    case "draft":
      return "bg-muted text-muted-foreground";
    case "on-hold":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
    case "completed":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200";
    default:
      return "";
  }
}

function contactInitial(name, email) {
  const n = (typeof name === "string" ? name : "").trim();
  if (n) return n.charAt(0).toUpperCase();
  const e = (typeof email === "string" ? email : "").trim();
  return e ? e.charAt(0).toUpperCase() : "?";
}

export default function ProjectSettings() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId;
  const { meta, sidebar, dashboard } = usePortalProject();
  const userRole = meta.isFreelancer ? "freelancer" : "client";
  const isDemo = Boolean(meta?.isDemo);

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [projectInfo, setProjectInfo] = useState({
    name: "",
    description: "",
    startDate: undefined,
    dueDate: undefined,
    status: "active",
    logo: "",
    brandColor: DEFAULT_BRAND_COLOR_HEX,
  });
  const [notifications, setNotifications] = useState({
    fileUploads: true,
    newMessages: true,
    paymentReminders: true,
    milestoneDeadlines: true,
    activityNotifications: {
      fileApprovals: true,
      comments: true,
      milestoneStarted: true,
      milestoneCompleted: true,
      invoiceSent: false,
    },
  });
  const [contactInfo, setContactInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    avatar: "",
  });

  const [startDateOpen, setStartDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const ingest = useCallback((r) => {
    if (!r?.ok) return false;
    setProjectInfo({
      name: r.project.name,
      description: r.project.description,
      startDate: parseIsoDate(r.project.startDate),
      dueDate: parseIsoDate(r.project.endDate),
      status: r.project.status,
      logo: r.project.logoUrl ?? "",
      brandColor: r.project.brandColor ?? DEFAULT_BRAND_COLOR_HEX,
    });
    setNotifications(r.notifications);
    setContactInfo({
      fullName: r.profile.fullName,
      email: r.profile.email,
      phone: r.profile.phone,
      company: r.project.name || "",
      avatar: r.profile.avatarUrl ?? "",
    });
    return true;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setReady(false);
      setLoadError(null);
      const r = await getPortalProjectSettings(String(projectId));
      if (cancelled) return;
      if (!r.ok) {
        setLoadError(r.error || "Could not load settings");
        setReady(true);
        return;
      }
      ingest(r);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, ingest]);

  // Demo Freelancer ↔ Client switch: keep contact card aligned with the active persona.
  useEffect(() => {
    if (!isDemo || !ready) return;
    if (userRole === "client") {
      setContactInfo((prev) => ({
        ...prev,
        fullName: sidebar?.clientName || prev.fullName,
        email: sidebar?.clientEmail || prev.email,
        company: "Pixel Lab",
        avatar: sidebar?.clientAvatar || prev.avatar,
      }));
      return;
    }
    setContactInfo((prev) => ({
      ...prev,
      fullName: dashboard?.freelancerName || prev.fullName,
      email: dashboard?.freelancerEmail || prev.email,
      company: sidebar?.clientName ? "Pixel Lab" : prev.company,
      avatar: dashboard?.freelancerAvatar || prev.avatar,
    }));
  }, [
    isDemo,
    ready,
    userRole,
    sidebar?.clientName,
    sidebar?.clientEmail,
    sidebar?.clientAvatar,
    dashboard?.freelancerName,
    dashboard?.freelancerEmail,
    dashboard?.freelancerAvatar,
  ]);

  const refreshFromServer = useCallback(async () => {
    const r = await getPortalProjectSettings(String(projectId));
    if (!r.ok) {
      toast.error(r.error || "Could not refresh settings");
      return false;
    }
    ingest(r);
    return true;
  }, [projectId, ingest]);

  const handleSaveProjectInfo = async () => {
    setSavingProject(true);
    try {
      const r = await updatePortalProjectSettings(String(projectId), {
        name: projectInfo.name,
        description: projectInfo.description,
        startDate: projectInfo.startDate ?? null,
        dueDate: projectInfo.dueDate ?? null,
        status: projectInfo.status,
      });
      if (!r.ok) {
        toast.error(r.error || "Could not update project");
        return;
      }
      toast.success("Project information updated");
      await refreshFromServer();
    } finally {
      setSavingProject(false);
    }
  };

  const handleSaveBranding = async () => {
    setSavingBranding(true);
    try {
      const logoDataUrl =
        typeof projectInfo.logo === "string" && projectInfo.logo.startsWith("data:image")
          ? projectInfo.logo
          : undefined;
      const r = await updatePortalProjectSettings(String(projectId), {
        name: projectInfo.name,
        description: projectInfo.description,
        startDate: projectInfo.startDate ?? null,
        dueDate: projectInfo.dueDate ?? null,
        status: projectInfo.status,
        ...(logoDataUrl ? { logoDataUrl } : {}),
        brandColor: projectInfo.brandColor,
      });
      if (!r.ok) {
        toast.error(r.error || "Could not update branding");
        return;
      }
      toast.success("Branding updated");
      await refreshFromServer();
      router.refresh();
    } finally {
      setSavingBranding(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    try {
      const r = await savePortalNotificationPreferences(String(projectId), notifications);
      if (!r.ok) {
        toast.error(r.error || "Could not save preferences");
        return;
      }
      toast.success("Notification preferences updated");
      await refreshFromServer();
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleSaveContactInfo = async () => {
    setSavingContact(true);
    try {
      const r = await savePortalClientContact(String(projectId), {
        fullName: contactInfo.fullName,
        phone: contactInfo.phone,
      });
      if (!r.ok) {
        toast.error(r.error || "Could not save contact information");
        return;
      }
      toast.success("Contact information updated");
      await refreshFromServer();
    } finally {
      setSavingContact(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5MB or smaller");
      return;
    }
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await uploadPortalClientAvatar(String(projectId), fd);
      if (!r.ok) {
        toast.error(r.error || "Could not upload photo");
        return;
      }
      if (typeof r.publicUrl === "string") {
        setContactInfo((prev) => ({ ...prev, avatar: r.publicUrl }));
      }
      toast.success("Profile photo updated");
      await refreshFromServer();
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5MB or smaller");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setProjectInfo((prev) => ({ ...prev, logo: reader.result }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const header = (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-2 px-4 sm:h-16 sm:px-6 lg:px-8">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden sm:block">
              <BreadcrumbLink href={`/project/${projectId}/dashboard`}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden sm:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Settings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );

  return (
    <>
      {header}

      <div className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:max-w-4xl lg:px-8">
          {!ready ? (
            <div className="flex items-center gap-2 text-muted-foreground py-12">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              <span>Loading settings…</span>
            </div>
          ) : loadError ? (
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle>Could not load settings</CardTitle>
                <CardDescription>{loadError}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setReady(false);
                    setLoadError(null);
                    void (async () => {
                      const r = await getPortalProjectSettings(String(projectId));
                      if (!r.ok) {
                        setLoadError(r.error || "Could not load settings");
                        setReady(true);
                        return;
                      }
                      ingest(r);
                      setReady(true);
                    })();
                  }}
                >
                  Try again
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs
              key={userRole}
              defaultValue={userRole === "freelancer" ? "project-info" : "overview"}
              className="w-full"
            >
              <TabsList
                className={
                  userRole === "freelancer"
                    ? "grid w-fit grid-cols-4 mb-6"
                    : "grid w-fit grid-cols-3 mb-6"
                }
              >
                {userRole === "freelancer" ? (
                  <>
                    <TabsTrigger value="project-info">Project Information</TabsTrigger>
                    <TabsTrigger value="people">People</TabsTrigger>
                    <TabsTrigger value="branding">Branding</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  </>
                ) : (
                  <>
                    <TabsTrigger value="overview">Project Overview</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="contact">Contact Information</TabsTrigger>
                  </>
                )}
              </TabsList>

              {userRole === "freelancer" && (
                <TabsContent value="project-info">
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Information</CardTitle>
                      <CardDescription>Update your project details and timeline</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="projectName">Project name</Label>
                        <Input
                          id="projectName"
                          value={projectInfo.name}
                          onChange={(e) => setProjectInfo({ ...projectInfo, name: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="projectDescription">Description</Label>
                        <Textarea
                          id="projectDescription"
                          rows={4}
                          value={projectInfo.description}
                          onChange={(e) =>
                            setProjectInfo({
                              ...projectInfo,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start date</Label>
                          <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-between font-normal",
                                  !projectInfo.startDate && "text-muted-foreground"
                                )}
                              >
                                {projectInfo.startDate
                                  ? projectInfo.startDate.toLocaleDateString("en-US", {
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
                                selected={projectInfo.startDate}
                                onSelect={(date) => {
                                  setProjectInfo({ ...projectInfo, startDate: date });
                                  setStartDateOpen(false);
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label>Due date</Label>
                          <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-between font-normal",
                                  !projectInfo.dueDate && "text-muted-foreground"
                                )}
                              >
                                {projectInfo.dueDate
                                  ? projectInfo.dueDate.toLocaleDateString("en-US", {
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
                                selected={projectInfo.dueDate}
                                onSelect={(date) => {
                                  setProjectInfo({ ...projectInfo, dueDate: date });
                                  setDueDateOpen(false);
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="projectStatus">Project status</Label>
                        <Select
                          value={projectInfo.status}
                          onValueChange={(value) => setProjectInfo({ ...projectInfo, status: value })}
                        >
                          <SelectTrigger id="projectStatus">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="on-hold">On hold</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button type="button" onClick={() => void handleSaveProjectInfo()} disabled={savingProject}>
                        {savingProject ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          "Save changes"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {userRole === "freelancer" && (
                <TabsContent value="people">
                  <ProjectPeopleSettings projectId={String(projectId)} disabled={isDemo} />
                </TabsContent>
              )}

              {userRole === "freelancer" && (
                <TabsContent value="branding">
                  <Card>
                    <CardHeader>
                      <CardTitle>Client portal branding</CardTitle>
                      <CardDescription>
                        Logo and accent color shown to your client in the portal, chat, and file discussions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center gap-6">
                        <Avatar className="h-24 w-24 rounded-lg">
                          <AvatarImage src={projectInfo.logo || undefined} alt="Project logo" />
                          <AvatarFallback className="rounded-lg">
                            {(projectInfo.name || "?").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <input
                            type="file"
                            id="logo-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={handleLogoUpload}
                          />
                          <Button
                            variant="outline"
                            type="button"
                            onClick={() => document.getElementById("logo-upload")?.click()}
                            disabled={savingBranding}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Change project logo
                          </Button>
                          <p className="text-sm text-muted-foreground mt-2">
                            JPG, PNG, GIF, or WebP, max 5MB
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <BrandColorFieldGroup
                        value={projectInfo.brandColor}
                        onChange={(brandColor) =>
                          setProjectInfo((prev) => ({ ...prev, brandColor }))
                        }
                        disabled={savingBranding}
                        description="Accent color for buttons, links, and backgrounds in the client portal."
                      />

                      <PortalBrandPreview
                        brandColor={projectInfo.brandColor}
                        projectLogo={projectInfo.logo}
                        projectName={projectInfo.name}
                      />

                      <Button
                        type="button"
                        onClick={() => void handleSaveBranding()}
                        disabled={savingBranding}
                      >
                        {savingBranding ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          "Save branding"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {userRole === "client" && (
                <TabsContent value="overview" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Project branding</CardTitle>
                      <CardDescription>Logo and name as your freelancer set them for this portal</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-6">
                        <Avatar className="h-24 w-24 rounded-lg">
                          <AvatarImage src={projectInfo.logo || undefined} alt="Project logo" />
                          <AvatarFallback className="rounded-lg">
                            {(projectInfo.name || "?").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-sm text-muted-foreground max-w-md">
                          Only the project owner can change the project logo. Contact them if something needs
                          updating.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Project details</CardTitle>
                      <CardDescription>View your project information and timeline</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Project name</Label>
                          <p className="font-medium mt-1">{projectInfo.name || "—"}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Status</Label>
                          <div className="mt-1">
                            <Badge variant="secondary" className={statusBadgeClass(projectInfo.status)}>
                              {statusLabel(projectInfo.status)}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Start date</Label>
                          <p className="font-medium mt-1">{formatLongDate(projectInfo.startDate)}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Due date</Label>
                          <p className="font-medium mt-1">{formatLongDate(projectInfo.dueDate)}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Description</Label>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{projectInfo.description || "—"}</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification preferences</CardTitle>
                    <CardDescription>
                      Email preferences and browser alerts for this project
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="fileUploads">File uploads</Label>
                          <p className="text-sm text-muted-foreground">Get notified when new files are uploaded</p>
                        </div>
                        <Switch
                          id="fileUploads"
                          checked={notifications.fileUploads}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, fileUploads: checked })
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="newMessages">New messages</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified when you receive new messages
                          </p>
                        </div>
                        <Switch
                          id="newMessages"
                          checked={notifications.newMessages}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, newMessages: checked })
                          }
                        />
                      </div>

                      <Separator />

                      <BrowserPushSettings />

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="paymentReminders">Payment reminders</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive reminders about upcoming and overdue payments
                          </p>
                        </div>
                        <Switch
                          id="paymentReminders"
                          checked={notifications.paymentReminders}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              paymentReminders: checked,
                            })
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="milestoneDeadlines">Milestone deadlines</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified about approaching milestone deadlines
                          </p>
                        </div>
                        <Switch
                          id="milestoneDeadlines"
                          checked={notifications.milestoneDeadlines}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              milestoneDeadlines: checked,
                            })
                          }
                        />
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Activity notifications</Label>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="fileApprovals">File approvals</Label>
                          <p className="text-sm text-muted-foreground">When files are approved or need changes</p>
                        </div>
                        <Switch
                          id="fileApprovals"
                          checked={notifications.activityNotifications.fileApprovals}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              activityNotifications: {
                                ...notifications.activityNotifications,
                                fileApprovals: checked,
                              },
                            })
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="comments">Comments</Label>
                          <p className="text-sm text-muted-foreground">
                            When someone comments on files or activities
                          </p>
                        </div>
                        <Switch
                          id="comments"
                          checked={notifications.activityNotifications.comments}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              activityNotifications: {
                                ...notifications.activityNotifications,
                                comments: checked,
                              },
                            })
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="milestoneStarted">Milestone started</Label>
                          <p className="text-sm text-muted-foreground">When work begins on a new milestone</p>
                        </div>
                        <Switch
                          id="milestoneStarted"
                          checked={notifications.activityNotifications.milestoneStarted}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              activityNotifications: {
                                ...notifications.activityNotifications,
                                milestoneStarted: checked,
                              },
                            })
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="milestoneCompleted">Milestone completed</Label>
                          <p className="text-sm text-muted-foreground">When a milestone is marked as complete</p>
                        </div>
                        <Switch
                          id="milestoneCompleted"
                          checked={notifications.activityNotifications.milestoneCompleted}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              activityNotifications: {
                                ...notifications.activityNotifications,
                                milestoneCompleted: checked,
                              },
                            })
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="invoiceSent">Invoice sent</Label>
                          <p className="text-sm text-muted-foreground">When a new invoice is sent to you</p>
                        </div>
                        <Switch
                          id="invoiceSent"
                          checked={notifications.activityNotifications.invoiceSent}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              activityNotifications: {
                                ...notifications.activityNotifications,
                                invoiceSent: checked,
                              },
                            })
                          }
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={() => void handleSaveNotifications()}
                      disabled={savingNotifications}
                    >
                      {savingNotifications ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        "Save preferences"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {userRole === "client" && (
                <TabsContent value="contact">
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact information</CardTitle>
                      <CardDescription>Update how you appear in this portal</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center gap-6">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src={contactInfo.avatar || undefined} alt="Profile" />
                          <AvatarFallback>
                            {contactInitial(contactInfo.fullName, contactInfo.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <input
                            type="file"
                            id="avatar-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => void handleAvatarUpload(e)}
                          />
                          <Button
                            variant="outline"
                            type="button"
                            onClick={() => document.getElementById("avatar-upload")?.click()}
                            disabled={uploadingAvatar}
                          >
                            {uploadingAvatar ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading…
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Change photo
                              </>
                            )}
                          </Button>
                          <p className="text-sm text-muted-foreground mt-2">JPG, PNG, GIF, or WebP, max 5MB</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full name</Label>
                        <Input
                          id="fullName"
                          value={contactInfo.fullName}
                          onChange={(e) =>
                            setContactInfo({
                              ...contactInfo,
                              fullName: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" value={contactInfo.email} readOnly disabled />
                          <p className="text-xs text-muted-foreground">Email is managed by your account sign-in.</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={contactInfo.phone}
                            onChange={(e) =>
                              setContactInfo({
                                ...contactInfo,
                                phone: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company">Project</Label>
                        <Input id="company" value={contactInfo.company} disabled />
                        <p className="text-xs text-muted-foreground">
                          Shown as captured on the project; ask your freelancer to update the project if it is wrong.
                        </p>
                      </div>

                      <Button type="button" onClick={() => void handleSaveContactInfo()} disabled={savingContact}>
                        {savingContact ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          "Save changes"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      </div>
    </>
  );
}
