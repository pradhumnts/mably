"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Phone,
  MapPin,
  Clock,
  Mail,
  MoreVertical,
  Calendar,
  Plus,
  Link as LinkIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Social media icons
const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#0A66C2">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
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

// Helper function to detect platform from URL and return appropriate icon
const getPlatformIcon = (url, label) => {
  const urlLower = url.toLowerCase();
  const labelLower = label.toLowerCase();
  
  if (urlLower.includes('twitter.com') || urlLower.includes('x.com') || labelLower.includes('twitter') || labelLower.includes('x.com')) {
    return <XIcon />;
  }
  if (urlLower.includes('linkedin.com') || labelLower.includes('linkedin')) {
    return <LinkedInIcon />;
  }
  if (urlLower.includes('wa.me') || urlLower.includes('whatsapp') || labelLower.includes('whatsapp')) {
    return <WhatsAppIcon />;
  }
  if (urlLower.includes('tiktok.com') || labelLower.includes('tiktok')) {
    return <TikTokIcon />;
  }
  // Default: generic link icon
  return <LinkIcon className="h-5 w-5" />;
};

export function ClientDetailsDialog({
  client,
  projects,
  projectsLoading = false,
  open,
  onOpenChange,
}) {
  if (!client) return null;

  // Convert old socials format to new links format if needed
  const clientLinks = client.links || (client.socials ? [
    { label: 'Twitter', url: client.socials.twitter },
    { label: 'LinkedIn', url: client.socials.linkedin },
    { label: 'WhatsApp', url: client.socials.whatsapp },
    { label: 'TikTok', url: client.socials.tiktok },
  ].filter(link => link.url) : []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl min-w-[500px] max-h-[90vh] overflow-y-auto bg-zinc-50">
        <DialogHeader className="-space-y-1">
          <DialogTitle className="text-2xl font-semibold">Client Details</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Send or share Invitation to client for the project.
          </p>
        </DialogHeader>

        <div className="space-y-[20px]">
          {/* Client Info Card */}
          <div className="bg-white rounded-lg p-[16px] space-y-[16px] border border-zinc-00">
            {/* Avatar, Name, Email */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={client.avatar || undefined} alt={client.name} />
                <AvatarFallback className="text-xl">
                  {(client.name || "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-base font-semibold">{client.name}</h3>
                <p className="text-muted-foreground">{client.email}</p>
              </div>
            </div>

            <Separator />

            {/* Phone, Last Active, Location */}
            <div className="flex flex-col md:flex-row md:items-stretch gap-[32px]">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>Phone</span>
                </div>
                <p className="font-medium break-words">
                  {client.phone?.trim() ? client.phone : "—"}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Last Active</span>
                </div>
                <p className="font-medium">{client.lastActive}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Location</span>
                </div>
                <p className="font-medium break-words">
                  {client.location?.trim() ? client.location : "—"}
                </p>
              </div>
            </div>
            <Separator />
            {/* Links */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                asChild
                title="Email"
              >
                <a href={`mailto:${client.email}`} target="_blank" rel="noopener noreferrer">
                  <Mail className="h-5 w-5" />
                </a>
              </Button>
              {clientLinks.map((link, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  asChild
                  title={link.label}
                >
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {getPlatformIcon(link.url, link.label)}
                  </a>
                </Button>
              ))}
            </div>
          </div>

          {/* Projects Section */}
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-xl font-semibold">Projects</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  List of all the projects you have with{" "}
                  {(client.name || "").trim().split(/\s+/)[0] || "this client"}.
                </p>
              </div>
              <Button
                className="ml-auto flex items-center gap-1 mb-[2px] font-semibold rounded-lg"
                asChild
              >
                <Link
                  href={`/projects/new?clientId=${encodeURIComponent(client.id)}`}
                >
                  <Plus className="h-5 w-5 stroke-2" />
                  <span className="hidden sm:inline">Start Project</span>
                </Link>
              </Button>
            </div>

            {/* Projects List */}
            <div className="space-y-3">
              {projectsLoading ? (
                <div className="rounded-lg border border-zinc-200 bg-white py-10 text-center text-sm text-muted-foreground">
                  Loading projects…
                </div>
              ) : projects && projects.length > 0 ? (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white rounded-lg p-[16px] border border-zinc-200 space-y-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Avatar className="h-11 w-11 shrink-0 rounded-md border border-zinc-200 bg-muted">
                          <AvatarImage
                            src={project.logo || undefined}
                            alt=""
                            className="object-cover"
                          />
                          <AvatarFallback className="rounded-md text-sm font-medium">
                            {(project.name || "?").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1 min-w-0 flex-1">
                          <h4 className="font-semibold truncate">{project.name}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {project.description}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 -mt-1"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/project/${project.id}/dashboard`}
                              className="cursor-pointer"
                            >
                              View project
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled>Edit project</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            Remove from Client
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <Separator />

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span>$</span>
                        <span>{Number(project.budget ?? 0).toLocaleString()}</span>
                      </div>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center gap-2 font-medium">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            project.status === "Active"
                              ? "bg-green-500"
                              : "bg-gray-400"
                          }`}
                        />
                        {project.status}
                      </div>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar className="h-4 w-4" />
                        <span>Due {project.dueDate}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No projects found for this client.
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

