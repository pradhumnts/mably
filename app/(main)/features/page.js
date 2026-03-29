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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeatureRequestsList } from "@/components/features/feature-requests-list";
import { FeatureRoadmap } from "@/components/features/feature-roadmap";
import { AddFeatureForm } from "@/components/features/add-feature-form";

export default function FeaturesPage() {
  const [statusFilter, setStatusFilter] = useState("open");
  const [activeTab, setActiveTab] = useState("requests");

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex h-16 items-center gap-2 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4 my-auto mr-2" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/features">Features</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Feature Requests</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex-1">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between mb-6">
                <TabsList>
                  <TabsTrigger value="requests" className="gap-2">
                    Feature Requests
                  </TabsTrigger>
                  <TabsTrigger value="roadmap" className="gap-2">
                    Roadmap
                  </TabsTrigger>
                </TabsList>

                {/* Open/Done tabs - only show on Feature Requests tab */}
                {activeTab === "requests" && (
                  <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
                    <TabsList>
                      <TabsTrigger value="open">Open</TabsTrigger>
                      <TabsTrigger value="done">Done</TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}
              </div>

              <TabsContent value="requests" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 items-start">
                  {/* Left Side - Add Feature Form */}
                  <div className="lg:sticky lg:top-24 h-fit">
                    <AddFeatureForm />
                  </div>

                  {/* Right Side - Feature Requests List */}
                  <div>
                    <FeatureRequestsList filter={statusFilter} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="roadmap" className="mt-0">
                <FeatureRoadmap />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

