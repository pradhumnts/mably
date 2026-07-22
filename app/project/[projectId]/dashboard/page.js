"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Calendar,
  CheckSquare2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Folder,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { usePortalProject } from "../project-portal-shell";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { portalMobileNavBarClass } from "@/lib/ui/page-chrome";
import { BookCallCard } from "@/components/book-call-card";
import { PortalBrandBackdrop } from "@/components/portal-brand-backdrop";
import { getPortalHomeBriefing } from "@/lib/actions/project-portal-briefing";
import { cn } from "@/lib/utils";

function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * @param {string} type
 */
function attentionIcon(type) {
  if (type === "approval") return Folder;
  if (type === "invoice") return CreditCard;
  return CheckSquare2;
}

/**
 * @param {{ items: Array<{ id: string; type: string; title: string; subtitle: string; href: string }> }} props
 */
function AttentionList({ items }) {
  const scrollRef = useRef(/** @type {HTMLUListElement | null} */ (null));
  const [canScrollMore, setCanScrollMore] = useState(false);
  const scrollable = items.length > 5;

  useEffect(() => {
    if (!scrollable) {
      setCanScrollMore(false);
      return;
    }

    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      setCanScrollMore(remaining > 8);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [scrollable, items]);

  const scrollForMore = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ top: Math.round(el.clientHeight * 0.75), behavior: "smooth" });
  };

  return (
    <div className="relative">
      <ul
        ref={scrollRef}
        className={cn(
          "divide-y divide-zinc-200/70",
          scrollable && "max-h-[22.5rem] overflow-y-auto overscroll-contain"
        )}
      >
        {items.map((item) => {
          const Icon = attentionIcon(item.type);
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-white/70"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-100/90 text-zinc-700">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-zinc-900">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-zinc-500">
                    {item.subtitle}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
              </Link>
            </li>
          );
        })}
      </ul>

      <div
        aria-hidden={!canScrollMore}
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-16 transition-opacity duration-300",
          canScrollMore ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent" />
        <button
          type="button"
          tabIndex={canScrollMore ? 0 : -1}
          aria-label="Scroll for more items"
          onClick={scrollForMore}
          className={cn(
            "pointer-events-auto absolute bottom-2.5 left-1/2 inline-flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-zinc-200/80 bg-white text-zinc-600 shadow-[0_6px_18px_-8px_rgba(24,24,27,0.55)] transition-[transform,box-shadow] hover:scale-105 hover:text-zinc-900 hover:shadow-[0_8px_22px_-8px_rgba(24,24,27,0.6)]",
            !canScrollMore && "pointer-events-none"
          )}
        >
          <ChevronDown className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

/**
 * @param {{
 *   projectId: string;
 *   isFreelancer: boolean;
 *   greetName: string;
 *   otherPartyName: string;
 *   projectName: string;
 * }} props
 */
function PortalHome({
  projectId,
  isFreelancer,
  greetName,
  otherPartyName,
  projectName,
}) {
  const [loading, setLoading] = useState(true);
  const [attention, setAttention] = useState(/** @type {any[]} */ ([]));
  const [latest, setLatest] = useState(
    /** @type {null | { id: string; label: string; when: string; href: string }} */ (null)
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await getPortalHomeBriefing(projectId);
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        setAttention([]);
        setLatest(null);
        return;
      }
      setAttention(res.attention || []);
      setLatest(res.latest || null);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const greeting = useMemo(() => greetingForNow(), []);
  const hasAttention = attention.length > 0;
  const name = greetName || "there";
  const other = otherPartyName || (isFreelancer ? "your client" : "your freelancer");
  const otherFirst = other.split(/\s+/)[0] || other;

  const openChat = () => {
    window.dispatchEvent(new Event("mably:open-portal-chat"));
  };

  const emptyCopy = isFreelancer
    ? `Everything looks clear for now. You’re all caught up on ${projectName}.`
    : `Everything looks clear for now. ${other} will share the next update here.`;

  const attentionCopy = isFreelancer
    ? "A few things need your attention on this project."
    : "A few things need you to keep the project moving.";

  const shortcuts = [
    {
      id: "library",
      label: "Library",
      href: `/project/${projectId}/library/files`,
      Icon: Folder,
    },
    {
      id: "actions",
      label: "Actions",
      href: `/project/${projectId}/actions`,
      Icon: CheckSquare2,
    },
    {
      id: "message",
      label: `Message ${otherFirst}`,
      onClick: openChat,
      Icon: MessageCircle,
    },
    {
      id: "activity",
      label: "Activity",
      href: `/project/${projectId}/activity`,
      Icon: Calendar,
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center px-4 py-10 sm:px-6 sm:py-12 md:px-12 lg:px-20 lg:py-16">
      <div className="mx-auto w-full max-w-xl [animation-fill-mode:backwards] animate-in fade-in slide-in-from-bottom-4 duration-700">
        <p className="mb-2 text-sm font-medium text-zinc-600/90">{projectName}</p>
        <h1 className="text-pretty text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          {greeting}, {name}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-zinc-600 sm:text-lg">
          {hasAttention ? attentionCopy : emptyCopy}
        </p>

        {loading ? (
          <div className="mt-10 space-y-3">
            <div className="h-28 animate-pulse rounded-[28px] bg-white/50" />
            <div className="h-12 animate-pulse rounded-full bg-white/40" />
          </div>
        ) : (
          <>
            {hasAttention ? (
              <section className="mt-10 overflow-hidden rounded-[28px] border border-white/70 bg-white/75 shadow-[0_12px_40px_-24px_rgba(24,24,27,0.35)] backdrop-blur-md">
                <div className="flex items-center gap-2 border-b border-zinc-200/70 px-5 py-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/15 text-amber-700">
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">
                      Needs your attention
                    </p>
                    <p className="text-xs text-zinc-500">
                      {attention.length === 1
                        ? "1 item"
                        : `${attention.length} items`}
                    </p>
                  </div>
                </div>
                <AttentionList items={attention} />
              </section>
            ) : null}

            {latest ? (
              <Link
                href={latest.href}
                className={cn(
                  "mt-4 flex items-start gap-3 rounded-[24px] border border-white/60 bg-white/55 px-5 py-4 shadow-sm backdrop-blur-md transition-colors hover:bg-white/75",
                  !hasAttention && "mt-10"
                )}
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900/5 text-zinc-600">
                  <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                    Latest
                  </span>
                  <span className="mt-1 block text-sm font-medium leading-snug text-zinc-900">
                    {latest.label}
                  </span>
                  {latest.when ? (
                    <span className="mt-1 block text-xs text-zinc-500">
                      {latest.when}
                    </span>
                  ) : null}
                </span>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-zinc-400" />
              </Link>
            ) : null}

            <div
              className={cn(
                "flex flex-wrap gap-2",
                hasAttention || latest ? "mt-8" : "mt-10"
              )}
            >
              {shortcuts.map((item) => {
                const Icon = item.Icon;
                const className =
                  "inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-[0_8px_24px_-18px_rgba(24,24,27,0.5)] backdrop-blur-md transition-[transform,background-color] hover:bg-white hover:scale-[1.02]";
                if (item.onClick) {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.onClick}
                      className={className}
                    >
                      <Icon className="h-4 w-4 text-zinc-500" strokeWidth={1.75} />
                      {item.label}
                    </button>
                  );
                }
                return (
                  <Link key={item.id} href={item.href} className={className}>
                    <Icon className="h-4 w-4 text-zinc-500" strokeWidth={1.75} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ProjectDashboard() {
  const params = useParams();
  const projectId = String(params.projectId || "");
  const { sidebar, dashboard, meta } = usePortalProject();
  const isFreelancer = Boolean(meta?.isFreelancer);
  const calendarLink = dashboard.calendarLink?.trim() || "";
  const clientFirst = sidebar.clientName?.split(/\s+/)[0] || "there";
  const freelancerFirst =
    dashboard.freelancerName?.trim()?.split(/\s+/)[0] || "there";
  const freelancerName = dashboard.freelancerName?.trim() || "Freelancer";
  const clientName = sidebar.clientName?.trim() || "Client";
  const showBookCall = !isFreelancer && Boolean(calendarLink);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <PortalBrandBackdrop variant="dashboard" />

      <header className={portalMobileNavBarClass}>
        <SidebarTrigger className="-ml-1" />
        <span className="min-w-0 truncate text-sm font-semibold text-gray-900">
          {sidebar.projectName || "Project"}
        </span>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {showBookCall ? (
          <div className="shrink-0 px-4 pt-4 md:absolute md:right-8 md:top-8 md:z-20 md:px-0 md:pt-0">
            <BookCallCard
              freelancerName={freelancerName}
              freelancerAvatar={dashboard.freelancerAvatar || undefined}
              calendarLink={calendarLink}
            />
          </div>
        ) : null}
        <PortalHome
          projectId={projectId}
          isFreelancer={isFreelancer}
          greetName={isFreelancer ? freelancerFirst : clientFirst}
          otherPartyName={isFreelancer ? clientName : freelancerName}
          projectName={sidebar.projectName || "Your project"}
        />
      </div>
    </div>
  );
}
