"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function authorInitials(name) {
  const parts = (name || "M").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase().slice(0, 2);
  }
  return (parts[0] || "M").slice(0, 2).toUpperCase();
}

function avatarGradient(seed) {
  let h = 0;
  const s = seed || "x";
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  const hue2 = (hue + 40) % 360;
  return `linear-gradient(135deg, hsl(${hue} 70% 45%), hsl(${hue2} 65% 38%))`;
}

/**
 * Avatar with optional URL; deterministic gradient + initials when missing or broken.
 */
export function PersonAvatar({
  name,
  avatarUrl,
  className,
  size = "default",
  alt,
}) {
  const label = (name || "Member").trim() || "Member";
  const safeAlt = alt ?? `${label}’s avatar`;

  return (
    <Avatar size={size} className={cn("shrink-0 ring-2 ring-background shadow-sm", className)}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={safeAlt} /> : null}
      <AvatarFallback
        className={cn(
          "font-bold text-white",
          size === "sm" && "text-[10px]",
          size === "default" && "text-xs",
          size === "lg" && "text-sm"
        )}
        style={{ background: avatarGradient(label) }}
      >
        {authorInitials(label)}
      </AvatarFallback>
    </Avatar>
  );
}
