"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Clock, MoreVertical, ArrowUpDown } from "lucide-react";

function accessBadgeLabel(client) {
  if (client?.accessRole === "primary") return "Primary client";
  if (client?.accessRole === "additional") return "Additional access";
  return null;
}

function ClientRowMenu({ client, onView, onEdit, onDelete }) {
  const canManageCrm = !client.isPortalOnly;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="border border-slate-200">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 p-0"
          aria-label="Open client menu"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border border-slate-200">
        {canManageCrm && !client.isSample ? (
          <DropdownMenuItem asChild>
            <Link
              href={`/projects/new?clientId=${encodeURIComponent(client.id)}`}
              className="cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              Start New Project
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onView(client);
          }}
        >
          View Details
        </DropdownMenuItem>
        {canManageCrm ? (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEdit(client);
            }}
          >
            Edit Client
          </DropdownMenuItem>
        ) : null}
        {canManageCrm ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(client);
              }}
            >
              Delete Client
            </DropdownMenuItem>
          </>
        ) : null}
        {!canManageCrm && client.portalProjectIds?.[0] ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={`/project/${client.portalProjectIds[0]}/settings`}
                className="cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                Manage in project
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ClientIdentity({ client, avatarClassName = "h-9 w-9" }) {
  const accessLabel = accessBadgeLabel(client);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <Avatar className={`${avatarClassName} shrink-0`}>
        <AvatarImage src={client.avatar || undefined} alt={client.name} />
        <AvatarFallback>{(client.name || "?").charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium">{client.name}</span>
          {client.isSample ? (
            <Badge
              variant="secondary"
              className="h-5 shrink-0 px-1.5 text-[10px] font-medium text-muted-foreground"
            >
              Sample
            </Badge>
          ) : null}
        </div>
        <div className="mt-0.5 flex min-w-0 items-center gap-2">
          <p className="truncate text-sm text-muted-foreground">{client.email}</p>
          {accessLabel ? (
            <Badge
              variant="secondary"
              className="h-5 shrink-0 px-1.5 text-[10px] font-medium text-muted-foreground"
            >
              {accessLabel}
            </Badge>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ClientsListViews({ clients, onClientClick, onEditClient, onRequestDelete }) {
  if (clients.length === 0) {
    return (
      <div className="rounded-lg border bg-card py-12 text-center">
        <p className="text-muted-foreground">No clients found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 md:hidden">
        {clients.map((client) => (
          <div
            key={client.id}
            role="button"
            tabIndex={0}
            className="flex w-full cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/40"
            onClick={() => onClientClick(client)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClientClick(client);
              }
            }}
          >
            <ClientIdentity client={client} avatarClassName="h-10 w-10" />
            <ClientRowMenu
              client={client}
              onView={onClientClick}
              onEdit={onEditClient}
              onDelete={onRequestDelete}
            />
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="h-12 hover:bg-transparent">
              <TableHead className="min-w-[220px]">
                <button
                  type="button"
                  className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground"
                >
                  Name
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  Phone
                </div>
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  Location
                </div>
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Last active
                </div>
              </TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow
                key={client.id}
                className="group min-h-16 cursor-pointer border-none hover:bg-zinc-100"
                onClick={() => onClientClick(client)}
              >
                <TableCell className="py-3">
                  <ClientIdentity client={client} />
                </TableCell>
                <TableCell className="text-foreground">
                  {client.phone?.trim() ? client.phone : "—"}
                </TableCell>
                <TableCell className="hidden text-foreground lg:table-cell">
                  {client.location?.trim() ? client.location : "—"}
                </TableCell>
                <TableCell className="hidden text-foreground sm:table-cell">
                  {client.lastActive}
                </TableCell>
                <TableCell className="pr-4" onClick={(e) => e.stopPropagation()}>
                  <ClientRowMenu
                    client={client}
                    onView={onClientClick}
                    onEdit={onEditClient}
                    onDelete={onRequestDelete}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
