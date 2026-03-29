"use client";

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
import { ProjectCard } from "@/components/project-card";
import { TourProvider, TourStep, TourTrigger } from "@/components/guided-tour";

import { Button } from "@/components/ui/button";
import { Plus, Play, Sparkles } from "lucide-react";
import Link from "next/link";

// Dummy project data
const dummyProjects = [
  {
    id: 1,
    name: "Filmmakers' Academy",
    description: "Track progress, deadlines, and tasks",
    budget: 3500.0,
    status: "Active",
    dueDate: "16 Sep",
    logo: "/images/webflow-logo.jpeg",
    clientAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    clientName: "Sarah Johnson",
  },
  {
    id: 2,
    name: "E-Commerce Platform",
    description: "Build scalable online shopping experience",
    budget: 8500.0,
    status: "Active",
    dueDate: "28 Sep",
    logo: "/images/webflow-logo.jpeg",
    clientAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    clientName: "Michael Chen",
  },
  {
    id: 3,
    name: "Mobile Banking App",
    description: "Secure and intuitive banking solution",
    budget: 12000.0,
    status: "Active",
    dueDate: "15 Oct",
    logo: "/images/webflow-logo.jpeg",
    clientAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    clientName: "Emma Wilson",
  },
  {
    id: 4,
    name: "Healthcare Dashboard",
    description: "Patient management and analytics",
    budget: 6200.0,
    status: "On Hold",
    dueDate: "05 Oct",
    logo: "/images/webflow-logo.jpeg",
    clientAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    clientName: "David Park",
  },
  {
    id: 5,
    name: "Real Estate Portal",
    description: "Property listings and virtual tours",
    budget: 9800.0,
    status: "Active",
    dueDate: "22 Oct",
    logo: "/images/webflow-logo.jpeg",
    clientAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    clientName: "Lisa Anderson",
  },
  {
    id: 6,
    name: "Fitness Tracker",
    description: "Workout planning and progress tracking",
    budget: 4500.0,
    status: "Active",
    dueDate: "18 Sep",
    logo: "/images/webflow-logo.jpeg",
    clientAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    clientName: "James Smith",
  },
];

export default function ProjectsPage() {
  return (
    <TourProvider
      autoStart={true}
      ranOnce={true}
      storageKey="mably-projects-tour"
      onTourComplete={() => console.log('Projects tour completed!')}
      onTourSkip={() => console.log('Projects tour skipped!')}
    >
      <SidebarProvider>
        <TourStep
          id="sidebar"
          title="Welcome to Mably! 👋"
          content="This is your main navigation. Access Projects, Clients, Feature Requests, and Settings from here. Let's take a quick tour to show you around!"
          order={1}
          position="right"
        >
          <AppSidebar />
        </TourStep>
        <SidebarInset>
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="flex h-16 items-center gap-2 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="h-4 my-auto mr-2"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/projects">
                      Projects
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>All Projects</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="flex-1" />
              <TourStep
                id="create-project"
                title="Create New Projects"
                content="Click here to create a new project. You'll be guided through a 5-step process to set up project details, pricing, branding, client kickoff, and sending invitations."
                order={2}
                position="bottom"
              >
                <Button asChild className="flex items-center gap-1 font-semibold rounded-lg">
                  <Link href="/projects/new">
                    <Plus className="h-5 w-5 stroke-2" />
                    <span className="hidden sm:inline">Create new project</span>
                  </Link>
                </Button>
              </TourStep>
            </div>
          </header>
          
          <div className="flex-1">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              {/* Tour Start Prompt - Always Visible */}
              <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">New to Mably?</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Take a quick 2-minute tour to learn how to manage your freelance projects, collaborate with clients, and streamline your workflow.
                    </p>
                    <TourTrigger className="w-fit">
                      <Button size="sm">
                        <Play className="h-4 w-4 mr-1.5" />
                        Start Interactive Tour
                      </Button>
                    </TourTrigger>
                  </div>
                </div>
              </div>

              {/* Projects Grid */}
              <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                <TourStep
                  id="project-card"
                  title="Your Project Cards"
                  content="Each card shows your project details: name, client info, budget, status, and deadline. Click any card to enter the client's project dashboard with activity, files, payments, and more."
                  order={3}
                  position="bottom"
                >
                  <ProjectCard project={dummyProjects[0]} />
                </TourStep>
                
                {dummyProjects.slice(1, 3).map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
                
                <TourStep
                  id="project-actions"
                  title="Project Actions"
                  content="Click the three dots on any project card to access quick actions like viewing the project, editing details, archiving, or deleting."
                  order={4}
                  position="top"
                >
                  <ProjectCard project={dummyProjects[3]} />
                </TourStep>
                
                {dummyProjects.slice(4).map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TourProvider>
  );
}
