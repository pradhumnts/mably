"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, MoreVertical, Pencil, Trash2, Eye, Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { DescriptionClamp } from "@/components/description-clamp";

export function ProjectCard({ project, onRequestDelete }) {
  const isDemo = Boolean(project?.isDemo);

  return (
    <Link href={`/project/${project.id}/dashboard`}>
    <Card className="overflow-hidden hover:shadow-lg shadow-sm transition-shadow p-[16px] duration-200 cursor-pointer">
      <CardHeader className="px-0">
        <div className="flex items-start justify-between">
          {/* Overlapping Avatars */}
          <div className="flex items-center -space-x-3">
            <Avatar className="size-[48px] border-background">
              <AvatarImage src={project.logo} alt="Project logo" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {(project.name || "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Avatar className="size-[48px] border-background">
              <AvatarImage src={project.clientAvatar} alt="Client" />
              <AvatarFallback className="bg-muted">
                {project.clientName?.charAt(0) || "C"}
              </AvatarFallback>
            </Avatar>
          </div>

          {isDemo ? (
            <Badge
              variant="outline"
              className="gap-1 py-3 border-orange-200/60 bg-gradient-to-br from-orange-50/80 via-background to-violet-50/40 text-orange-700 dark:border-orange-900/30 dark:from-orange-950/30 dark:via-background dark:to-violet-950/20 dark:text-orange-200"
            >
              <Sparkles className="h-3 w-3 text-orange-500" aria-hidden />
              Demo project
            </Badge>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="border border-slate-200">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0"
                  aria-label="Open project menu"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border border-slate-200">
                <DropdownMenuItem asChild>
                  <Link href={`/project/${project.id}/dashboard`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.preventDefault()}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    onRequestDelete?.(project);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

        </div>
      </CardHeader>

      <CardContent className="space-y-4  px-0">
        {/* Project Title & Description */}
        <div className="space-y-1">
          <h3 className="font-semibold text-base leading-tight">
            {project.name}
          </h3>
          <DescriptionClamp
            text={project.description}
            className="text-sm text-muted-foreground"
          />
        </div>

        {/* Separator */}
        <div className="border-t" />

        {/* Project Info */}
        <div className="flex items-center justify-left gap-4 text-sm">
          {/* Price */}
          <div className="flex items-center gap-0 font-medium">
            <span>$</span>
            <span>{project.budget.toLocaleString()}</span>
          </div>
          <Separator
              orientation="vertical"
              className="h-4 my-auto"
            />
          {/* Status Badge */}
          <div className="flex items-center gap-2 font-medium">
          <span
              className={`h-2 w-2 rounded-full shadow-sm ${
                project.status === "Active" ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            {project.status}
          </div>
            
          <Separator
              orientation="vertical"
              className="h-4 my-auto"
            />
          {/* Due Date */}
          <div className="flex items-center gap-1.5 font-medium">
            <Calendar className="h-4 w-4" />
            <span>Due {project.dueDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
}

