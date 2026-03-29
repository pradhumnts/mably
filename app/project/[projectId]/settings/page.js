"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ProjectLayoutWrapper } from "../project-layout-wrapper";
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
import { CalendarIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ProjectSettings() {
  const params = useParams();
  const projectId = params.projectId;

  // TODO: Determine user role from auth/context
  const userRole = "client"; // "freelancer" or "client"

  const projectData = {
    projectName: "Sophie & Co.",
    planType: "Enterprise",
    clientName: "Sophie James",
    clientEmail: "sophie@arcmetals.co",
    clientAvatar: "https://plus.unsplash.com/premium_photo-1690034979551-65a363a0e4a6?q=80&w=1287&auto=format&fit=crop",
  };

  // Project Information State (Freelancer only)
  const [projectInfo, setProjectInfo] = useState({
    name: "Sophie & Co. Website Redesign",
    description: "Complete website redesign with modern UI/UX",
    startDate: new Date("2024-01-15"),
    dueDate: new Date("2024-06-30"),
    status: "active",
    logo: "https://images.unsplash.com/photo-1633409361618-c73427e4e206?w=150", // Project logo
  });

  // Notification Preferences State (Both roles)
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

  // Contact Information State (Client only)
  const [contactInfo, setContactInfo] = useState({
    email: "sophie@arcmetals.co",
    phone: "+1 (555) 123-4567",
    company: "Arc Metals Co.",
    avatar: "https://plus.unsplash.com/premium_photo-1690034979551-65a363a0e4a6?q=80&w=1287&auto=format&fit=crop",
  });

  const [startDateOpen, setStartDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);

  const handleSaveProjectInfo = () => {
    // TODO: Save to database
    toast.success("Project information updated successfully");
  };

  const handleSaveNotifications = () => {
    // TODO: Save to database
    toast.success("Notification preferences updated successfully");
  };

  const handleSaveContactInfo = () => {
    // TODO: Save to database
    toast.success("Contact information updated successfully");
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Upload to storage and update URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setContactInfo({ ...contactInfo, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Upload to storage and update URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setProjectInfo({ ...projectInfo, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <ProjectLayoutWrapper projectData={projectData}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex h-16 items-center gap-2 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4 my-auto mr-2" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/project/${projectId}/dashboard`}>
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1">
        <div className="max-w-[1600px] w-[60%] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Page Title */}
          {/* <div className="mb-6">
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your project preferences and information
            </p>
          </div> */}

          {/* Tabs */}
          <Tabs defaultValue={userRole === "freelancer" ? "project-info" : "overview"} className="w-full">
            <TabsList
              className={
                userRole === "freelancer"
                  ? "grid w-fit grid-cols-2 mb-6"
                  : "grid w-fit grid-cols-3 mb-6"
              }
            >
              {userRole === "freelancer" ? (
                <>
                  <TabsTrigger value="project-info">Project Information</TabsTrigger>
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

            {/* Project Information Tab (Freelancer Only) */}
            {userRole === "freelancer" && (
              <TabsContent value="project-info">
              <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                  <CardDescription>
                  Update your project details and timeline
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Project Logo */}
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24 rounded-lg">
                    <AvatarImage src={projectInfo.logo} alt="Project Logo" />
                    <AvatarFallback className="rounded-lg">
                      {projectInfo.name.charAt(0)}
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
                      onClick={() =>
                        document.getElementById("logo-upload")?.click()
                      }
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Change Project Logo
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      JPG, PNG or GIF, max 5MB
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name</Label>
                    <Input
                      id="projectName"
                      value={projectInfo.name}
                      onChange={(e) =>
                        setProjectInfo({ ...projectInfo, name: e.target.value })
                      }
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
                      <Label>Start Date</Label>
                      <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-between font-normal",
                              !projectInfo.startDate && "text-muted-foreground"
                            )}
                          >
                            {projectInfo.startDate ? (
                              projectInfo.startDate.toLocaleDateString("en-US", {
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
                      <Label>Due Date</Label>
                      <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-between font-normal",
                              !projectInfo.dueDate && "text-muted-foreground"
                            )}
                          >
                            {projectInfo.dueDate ? (
                              projectInfo.dueDate.toLocaleDateString("en-US", {
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
                    <Label htmlFor="projectStatus">Project Status</Label>
                    <Select
                      value={projectInfo.status}
                      onValueChange={(value) =>
                        setProjectInfo({ ...projectInfo, status: value })
                      }
                    >
                      <SelectTrigger id="projectStatus">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on-hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleSaveProjectInfo}>
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
              </TabsContent>
            )}

            {/* Project Overview Tab (Client, Read-only) */}
            {userRole === "client" && (
              <TabsContent value="overview" className="space-y-6">
              {/* Project Branding Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Branding</CardTitle>
                  <CardDescription>
                    Update your project logo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24 rounded-lg">
                      <AvatarImage src={projectInfo.logo} alt="Project Logo" />
                      <AvatarFallback className="rounded-lg">
                        {projectInfo.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <input
                        type="file"
                        id="logo-upload-client"
                        className="hidden"
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() =>
                          document.getElementById("logo-upload-client")?.click()
                        }
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Change Project Logo
                      </Button>
                      <p className="text-sm text-muted-foreground mt-2">
                        JPG, PNG or GIF, max 5MB
                      </p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button onClick={handleSaveProjectInfo}>
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Project Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                  <CardDescription>
                    View your project information and timeline
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Project Name</Label>
                      <p className="font-medium mt-1">{projectInfo.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <div className="mt-1">
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700"
                        >
                          Active
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Start Date</Label>
                      <p className="font-medium mt-1">
                        {projectInfo.startDate.toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Due Date</Label>
                      <p className="font-medium mt-1">
                        {projectInfo.dueDate.toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="text-sm mt-1">{projectInfo.description}</p>
                  </div>
                </CardContent>
              </Card>
              </TabsContent>
            )}

            {/* Notification Preferences Tab (Both) */}
            <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what updates you want to receive via email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="fileUploads">File Uploads</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when new files are uploaded
                      </p>
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
                      <Label htmlFor="newMessages">New Messages</Label>
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

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="paymentReminders">Payment Reminders</Label>
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
                      <Label htmlFor="milestoneDeadlines">
                        Milestone Deadlines
                      </Label>
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
                  <Label className="text-base font-semibold">
                    Activity Notifications
                  </Label>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="fileApprovals">File Approvals</Label>
                      <p className="text-sm text-muted-foreground">
                        When files are approved or need changes
                      </p>
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
                      <Label htmlFor="milestoneStarted">Milestone Started</Label>
                      <p className="text-sm text-muted-foreground">
                        When work begins on a new milestone
                      </p>
                    </div>
                    <Switch
                      id="milestoneStarted"
                      checked={
                        notifications.activityNotifications.milestoneStarted
                      }
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
                      <Label htmlFor="milestoneCompleted">
                        Milestone Completed
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        When a milestone is marked as complete
                      </p>
                    </div>
                    <Switch
                      id="milestoneCompleted"
                      checked={
                        notifications.activityNotifications.milestoneCompleted
                      }
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
                      <Label htmlFor="invoiceSent">Invoice Sent</Label>
                      <p className="text-sm text-muted-foreground">
                        When a new invoice is sent to you
                      </p>
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

                <Button onClick={handleSaveNotifications}>
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
            </TabsContent>

            {/* Contact Information Tab (Client Only) */}
            {userRole === "client" && (
              <TabsContent value="contact">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>
                    Update your contact details and profile picture
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={contactInfo.avatar} alt="Profile" />
                      <AvatarFallback>
                        {contactInfo.company.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <input
                        type="file"
                        id="avatar-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                      />
                      <Button
                        variant="outline"
                        onClick={() =>
                          document.getElementById("avatar-upload")?.click()
                        }
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Change Photo
                      </Button>
                      <p className="text-sm text-muted-foreground mt-2">
                        JPG, PNG or GIF, max 5MB
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactInfo.email}
                        onChange={(e) =>
                          setContactInfo({
                            ...contactInfo,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
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
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      value={contactInfo.company}
                      onChange={(e) =>
                        setContactInfo({
                          ...contactInfo,
                          company: e.target.value,
                        })
                      }
                    />
                  </div>

                  <Button onClick={handleSaveContactInfo}>
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </ProjectLayoutWrapper>
  );
}
