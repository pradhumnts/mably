"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  // Profile & Business Information State
  const [profileInfo, setProfileInfo] = useState({
    name: "Emma Reed",
    email: "emma@designstudio.com",
    phone: "+1 (555) 123-4567",
    avatar: "https://plus.unsplash.com/premium_photo-1675710868549-3c9d54a40219?q=80&w=2670&auto=format&fit=crop",
    title: "UI/UX Designer & Developer",
    location: "New York, USA",
  });

  // Branding State
  const [branding, setBranding] = useState({
    logo: "https://images.unsplash.com/photo-1633409361618-c73427e4e206?w=150",
    brandColor: "#000000",
  });

  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    clientOpenedPortal: true,
    projectCreated: true,
    paymentReceived: true,
    invoiceOverdue: true,
  });

  // Calendar & Availability State
  const [calendar, setCalendar] = useState({
    calendarLink: "https://calendly.com/emma-reed",
  });

  // Client Portal Defaults State
  const [portalDefaults, setPortalDefaults] = useState({
    welcomeMessage: "Welcome! I'm excited to work with you on this project. Here's everything you need to stay updated on our progress.",
  });

  const handleProfileAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileInfo({ ...profileInfo, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBranding({ ...branding, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    // TODO: Save to database
    toast.success("Profile information updated successfully");
  };

  const handleSaveBranding = () => {
    // TODO: Save to database
    toast.success("Branding settings updated successfully");
  };

  const handleSaveNotifications = () => {
    // TODO: Save to database
    toast.success("Notification preferences updated successfully");
  };

  const handleSaveCalendar = () => {
    // TODO: Save to database
    toast.success("Calendar settings updated successfully");
  };

  const handleSavePortalDefaults = () => {
    // TODO: Save to database
    toast.success("Portal defaults updated successfully");
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex h-16 items-center gap-2 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4 my-auto mr-2" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
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
            {/* Tabs */}
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-fit grid-cols-2 lg:grid-cols-5 mb-6">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="branding">Branding</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="portal">Portal Defaults</TabsTrigger>
              </TabsList>

              {/* Profile & Business Information Tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile & Business Information</CardTitle>
                    <CardDescription>
                      Update your personal and professional information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Profile Picture */}
                    <div className="flex items-center gap-6">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={profileInfo.avatar} alt="Profile" />
                        <AvatarFallback>
                          {profileInfo.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <input
                          type="file"
                          id="profile-avatar-upload"
                          className="hidden"
                          accept="image/*"
                          onChange={handleProfileAvatarUpload}
                        />
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() =>
                            document.getElementById("profile-avatar-upload")?.click()
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

                    <Separator />

                    {/* Name & Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profileInfo.name}
                          onChange={(e) =>
                            setProfileInfo({ ...profileInfo, name: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileInfo.email}
                          onChange={(e) =>
                            setProfileInfo({ ...profileInfo, email: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {/* Phone & Title */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={profileInfo.phone}
                          onChange={(e) =>
                            setProfileInfo({ ...profileInfo, phone: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="title">Professional Title</Label>
                        <Input
                          id="title"
                          placeholder="e.g. UI/UX Designer"
                          value={profileInfo.title}
                          onChange={(e) =>
                            setProfileInfo({ ...profileInfo, title: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="e.g. New York, USA"
                        value={profileInfo.location}
                        onChange={(e) =>
                          setProfileInfo({ ...profileInfo, location: e.target.value })
                        }
                      />
                    </div>

                    <Button onClick={handleSaveProfile}>Save Changes</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Branding & Customization Tab */}
              <TabsContent value="branding">
                <Card>
                  <CardHeader>
                    <CardTitle>Branding & Customization</CardTitle>
                    <CardDescription>
                      Customize how your brand appears in client portals
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Logo Upload */}
                    <div className="flex items-center gap-6">
                      <Avatar className="h-24 w-24 rounded-lg">
                        <AvatarImage src={branding.logo} alt="Logo" />
                        <AvatarFallback className="rounded-lg">
                          Logo
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
                          Change Logo
                        </Button>
                        <p className="text-sm text-muted-foreground mt-2">
                          Your logo appears in all client portals
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Brand Color */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-semibold">Brand Color</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          This color will be used throughout client portals
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="brandColor">Brand Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="brandColor"
                            type="color"
                            value={branding.brandColor}
                            onChange={(e) =>
                              setBranding({ ...branding, brandColor: e.target.value })
                            }
                            className="w-20 h-10 cursor-pointer"
                          />
                          <Input
                            value={branding.brandColor}
                            onChange={(e) =>
                              setBranding({ ...branding, brandColor: e.target.value })
                            }
                            placeholder="#000000"
                            className="flex-1"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Used for buttons, links, headers, and highlights
                        </p>
                      </div>
                    </div>

                    <Button onClick={handleSaveBranding}>Save Changes</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notification Preferences Tab */}
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
                          <Label htmlFor="clientOpenedPortal">
                            Client Opened Portal
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified when a client opens their project portal for the first time
                          </p>
                        </div>
                        <Switch
                          id="clientOpenedPortal"
                          checked={notifications.clientOpenedPortal}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              clientOpenedPortal: checked,
                            })
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="projectCreated">New Project Created</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified when you create a new project
                          </p>
                        </div>
                        <Switch
                          id="projectCreated"
                          checked={notifications.projectCreated}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              projectCreated: checked,
                            })
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="paymentReceived">Payment Received</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified when you receive a payment from a client
                          </p>
                        </div>
                        <Switch
                          id="paymentReceived"
                          checked={notifications.paymentReceived}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              paymentReceived: checked,
                            })
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="invoiceOverdue">Invoice Overdue</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified when an invoice becomes overdue
                          </p>
                        </div>
                        <Switch
                          id="invoiceOverdue"
                          checked={notifications.invoiceOverdue}
                          onCheckedChange={(checked) =>
                            setNotifications({
                              ...notifications,
                              invoiceOverdue: checked,
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

              {/* Calendar & Availability Tab */}
              <TabsContent value="calendar">
                <Card>
                  <CardHeader>
                    <CardTitle>Calendar & Availability</CardTitle>
                    <CardDescription>
                      Connect your calendar for easy client booking
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="calendarLink">Calendar Link</Label>
                      <Input
                        id="calendarLink"
                        type="url"
                        placeholder="https://calendly.com/your-username"
                        value={calendar.calendarLink}
                        onChange={(e) =>
                          setCalendar({ ...calendar, calendarLink: e.target.value })
                        }
                      />
                      <p className="text-sm text-muted-foreground">
                        This link will be shown to clients for booking calls with you
                        (e.g., Calendly, Cal.com, Google Calendar)
                      </p>
                    </div>

                    <Button onClick={handleSaveCalendar}>Save Changes</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Client Portal Defaults Tab */}
              <TabsContent value="portal">
                <Card>
                  <CardHeader>
                    <CardTitle>Client Portal Defaults</CardTitle>
                    <CardDescription>
                      Set default settings for new client portals
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="welcomeMessage">
                        Default Welcome Message
                      </Label>
                      <Textarea
                        id="welcomeMessage"
                        rows={4}
                        placeholder="Enter your default welcome message for new clients..."
                        value={portalDefaults.welcomeMessage}
                        onChange={(e) =>
                          setPortalDefaults({
                            ...portalDefaults,
                            welcomeMessage: e.target.value,
                          })
                        }
                      />
                      <p className="text-sm text-muted-foreground">
                        This message will be shown to clients when they first enter
                        their project portal. You can customize it for each project.
                      </p>
                    </div>

                    <Button onClick={handleSavePortalDefaults}>
                      Save Defaults
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
