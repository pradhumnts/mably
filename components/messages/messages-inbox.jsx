"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, isThisYear, isToday, isYesterday } from "date-fns";
import { ArrowLeft, ExternalLink, MessageCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RealtimeChat } from "@/components/realtime-chat";
import {
  getProjectChatBootstrap,
  markProjectChatRead,
} from "@/lib/actions/project-chat";
import { cn } from "@/lib/utils";

/**
 * @param {string | null | undefined} iso
 */
function formatListDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (isToday(d)) return format(d, "h:mma").toLowerCase();
  if (isYesterday(d)) return "Yesterday";
  if (isThisYear(d)) return format(d, "MMM d");
  return format(d, "MMM d, yyyy");
}

/**
 * @param {string} name
 */
function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

/**
 * @param {string | null | undefined} value
 */
function cleanUrl(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

/**
 * @param {{
 *   src?: string | null;
 *   name: string;
 *   projectLogo?: string | null;
 *   className?: string;
 * }} props
 */
function ClientAvatarWithProject({
  src,
  name,
  projectLogo = null,
  className,
}) {
  const avatarSrc = cleanUrl(src);
  const logoSrc = cleanUrl(projectLogo);
  const [avatarReady, setAvatarReady] = useState(false);
  const [logoReady, setLogoReady] = useState(false);
  const label = initials(name);

  useEffect(() => {
    setAvatarReady(false);
  }, [avatarSrc]);

  useEffect(() => {
    setLogoReady(false);
  }, [logoSrc]);

  return (
    <div className={cn("relative size-12 shrink-0", className)}>
      <div
        className="relative flex size-12 items-center justify-center overflow-hidden rounded-full border border-border/80 bg-muted text-sm font-medium text-muted-foreground"
        aria-label={name}
      >
        {/* Initials always paint underneath; photo only covers once it loads */}
        <span className="select-none">{label}</span>
        {avatarSrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote client avatars
          <img
            key={avatarSrc}
            src={avatarSrc}
            alt=""
            className={cn(
              "absolute inset-0 size-full object-cover",
              avatarReady ? "opacity-100" : "pointer-events-none opacity-0"
            )}
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth > 1 && img.naturalHeight > 1) {
                setAvatarReady(true);
              }
            }}
            onError={() => setAvatarReady(false)}
          />
        ) : null}
      </div>
      {logoSrc ? (
        <div className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-background bg-muted text-[6px] font-medium text-muted-foreground">
          <span className="select-none" aria-hidden>
            P
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={logoSrc}
            src={logoSrc}
            alt=""
            className={cn(
              "absolute inset-0 size-full object-cover",
              logoReady ? "opacity-100" : "pointer-events-none opacity-0"
            )}
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth > 1 && img.naturalHeight > 1) {
                setLogoReady(true);
              }
            }}
            onError={() => setLogoReady(false)}
          />
        </div>
      ) : null}
    </div>
  );
}

function ConversationSkeleton() {
  return (
    <div
      className="flex h-full flex-col justify-end gap-4 px-4 py-5 sm:px-5"
      aria-busy="true"
    >
      <p className="sr-only">Loading conversation</p>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn("flex gap-2", i % 2 === 1 ? "justify-end" : "justify-start")}
        >
          {i % 2 === 0 ? (
            <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
          ) : null}
          <div
            className={cn(
              "h-10 animate-pulse rounded-[24px] bg-muted/80",
              i % 2 === 0 ? "w-[55%]" : "w-[42%]"
            )}
          />
          {i % 2 === 1 ? (
            <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

/**
 * @param {{
 *   initialConversations: Array<{
 *     conversationId: string;
 *     projectId: string;
 *     projectName: string;
 *     projectLogo: string | null;
 *     clientName: string;
 *     clientAvatar: string | null;
 *     preview: string;
 *     lastMessageAt: string | null;
 *     unreadCount: number;
 *   }>;
 *   initialProjectId?: string | null;
 * }} props
 */
export function MessagesInbox({ initialConversations, initialProjectId = null }) {
  const router = useRouter();
  const loadSeq = useRef(0);
  const [conversations, setConversations] = useState(initialConversations);
  const [search, setSearch] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(
    () =>
      initialProjectId ||
      initialConversations.find((c) => c.unreadCount > 0)?.projectId ||
      initialConversations[0]?.projectId ||
      null
  );
  const [boot, setBoot] = useState(null);
  const [bootError, setBootError] = useState(null);
  const [loadingThread, setLoadingThread] = useState(Boolean(
    initialProjectId ||
      initialConversations.find((c) => c.unreadCount > 0)?.projectId ||
      initialConversations[0]?.projectId
  ));
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.clientName.toLowerCase().includes(q) ||
        c.projectName.toLowerCase().includes(q) ||
        c.preview.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const selected = useMemo(
    () => conversations.find((c) => c.projectId === selectedProjectId) ?? null,
    [conversations, selectedProjectId]
  );

  const loadThread = useCallback(async (projectId) => {
    if (!projectId) {
      loadSeq.current += 1;
      setBoot(null);
      setBootError(null);
      setLoadingThread(false);
      return;
    }
    const seq = ++loadSeq.current;
    setLoadingThread(true);
    setBoot(null);
    setBootError(null);
    try {
      const r = await getProjectChatBootstrap(projectId);
      if (seq !== loadSeq.current) return;
      if (!r.ok) {
        setBoot(null);
        setBootError(r.error || "Could not load chat");
        return;
      }
      setBoot(r);
      const mark = await markProjectChatRead(projectId, r.conversationId);
      if (seq !== loadSeq.current) return;
      if (mark.ok) {
        setConversations((prev) =>
          prev.map((c) =>
            c.projectId === projectId ? { ...c, unreadCount: 0 } : c
          )
        );
      }
    } finally {
      if (seq === loadSeq.current) setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    loadThread(selectedProjectId);
  }, [selectedProjectId, loadThread]);

  const selectConversation = useCallback(
    (projectId) => {
      if (projectId === selectedProjectId) return;
      setBoot(null);
      setBootError(null);
      setLoadingThread(true);
      setSelectedProjectId(projectId);
      startTransition(() => {
        const url = new URL(window.location.href);
        url.searchParams.set("projectId", projectId);
        router.replace(`${url.pathname}?${url.searchParams.toString()}`, {
          scroll: false,
        });
      });
    },
    [router, selectedProjectId]
  );

  const clearSelectionOnMobile = useCallback(() => {
    loadSeq.current += 1;
    setBoot(null);
    setBootError(null);
    setLoadingThread(false);
    setSelectedProjectId(null);
    startTransition(() => {
      router.replace("/messages", { scroll: false });
    });
  }, [router]);

  const onRemoteMessage = useCallback(() => {
    // Keep list preview fresh when a new message lands in the open thread
    if (!selectedProjectId || !boot) return;
    setConversations((prev) => {
      const next = prev.map((c) => {
        if (c.projectId !== selectedProjectId) return c;
        return {
          ...c,
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
        };
      });
      return next.sort((a, b) => {
        const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return tb - ta;
      });
    });
  }, [boot, selectedProjectId]);

  const showThread = Boolean(selectedProjectId);
  const h = boot?.header;
  const clientName = h?.clientName?.trim() || selected?.clientName || "Client";
  const projectName = h?.projectName?.trim() || selected?.projectName || "Project";
  // Prefer list data so header matches the conversation card (boot can briefly
  // differ / return a broken avatar URL that hides initials).
  const clientAvatar = selected?.clientAvatar ?? h?.clientAvatar ?? null;
  const projectLogo = selected?.projectLogo ?? h?.projectLogo ?? null;
  const freelancerAvatar = h?.freelancerAvatar ?? null;
  const freelancerName = h?.freelancerName?.trim() || "You";

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-background">
      {/* Conversation list */}
      <aside
        className={cn(
          "flex w-full shrink-0 flex-col border-r border-border/70 bg-background md:w-[22rem] lg:w-[24rem]",
          showThread ? "hidden md:flex" : "flex"
        )}
      >
        <div className="shrink-0 space-y-3 border-b border-border/70 px-4 py-4">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Messages
          </h1>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for name"
              className="h-10 rounded-full border-border/80 bg-muted/40 pl-9"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {conversations.length === 0
                  ? "No project chats yet"
                  : "No matches"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {conversations.length === 0
                  ? "Start a project to message clients here."
                  : "Try a different search."}
              </p>
              {conversations.length === 0 ? (
                <Button asChild className="mt-5 rounded-full" size="sm">
                  <Link href="/projects">Go to projects</Link>
                </Button>
              ) : null}
            </div>
          ) : (
            <ul className="py-1">
              {filtered.map((c) => {
                const active = c.projectId === selectedProjectId;
                const unread = c.unreadCount > 0;
                return (
                  <li key={c.conversationId}>
                    <button
                      type="button"
                      onClick={() => selectConversation(c.projectId)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                        active ? "bg-muted/80" : "hover:bg-muted/50"
                      )}
                    >
                      <ClientAvatarWithProject
                        src={c.clientAvatar}
                        name={c.clientName}
                        projectLogo={c.projectLogo}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p
                            className={cn(
                              "truncate text-sm text-foreground",
                              unread ? "font-semibold" : "font-medium"
                            )}
                          >
                            {c.clientName}
                          </p>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {formatListDate(c.lastMessageAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {c.projectName}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <p
                            className={cn(
                              "min-w-0 flex-1 truncate text-sm",
                              unread
                                ? "font-medium text-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            {c.preview}
                          </p>
                          {unread ? (
                            <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[11px] font-semibold text-white">
                              {c.unreadCount > 99 ? "99+" : c.unreadCount}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Thread pane */}
      <section
        className={cn(
          "min-h-0 min-w-0 flex-1 flex-col bg-background",
          showThread ? "flex" : "hidden md:flex"
        )}
      >
        {!selectedProjectId ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <MessageCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-foreground">
              Select a conversation
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              All your project chats live here. Pick one on the left to reply.
            </p>
          </div>
        ) : (
          <>
            <header className="flex shrink-0 items-center gap-2 border-b border-border/70 px-3 py-3 sm:gap-3 sm:px-5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 md:hidden"
                onClick={clearSelectionOnMobile}
                aria-label="Back to conversations"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <ClientAvatarWithProject
                key={selectedProjectId}
                src={clientAvatar}
                name={clientName}
                projectLogo={projectLogo}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {clientName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {projectName}
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden shrink-0 rounded-full sm:inline-flex"
              >
                <Link href={`/project/${selectedProjectId}/dashboard`}>
                  Open project
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </header>

            <div className="relative min-h-0 flex-1">
              {bootError && !loadingThread ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                  <p className="text-sm font-medium text-foreground">
                    Couldn’t load this chat
                  </p>
                  <p className="text-sm text-muted-foreground">{bootError}</p>
                </div>
              ) : loadingThread || !boot?.conversationId ? (
                <ConversationSkeleton />
              ) : (
                <RealtimeChat
                  key={boot.conversationId}
                  projectId={selectedProjectId}
                  conversationId={boot.conversationId}
                  currentUserId={boot.currentUserId}
                  initialMessages={boot.messages ?? []}
                  userRole="freelancer"
                  clientAvatar={clientAvatar}
                  freelancerAvatar={freelancerAvatar}
                  projectLogo={projectLogo}
                  senderDisplayName={freelancerName}
                  selfAvatarUrl={freelancerAvatar}
                  onRemoteMessage={onRemoteMessage}
                />
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
