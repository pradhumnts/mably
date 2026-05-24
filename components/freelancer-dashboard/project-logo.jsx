import { cn } from "@/lib/utils";

/**
 * Square project logo with soft corners (not a circle). Matches Mably project cards.
 *
 * @param {{
 *   src?: string | null;
 *   name?: string;
 *   className?: string;
 *   size?: "sm" | "md" | "lg";
 * }} props
 */
export function ProjectLogo({ src, name = "Project", className, size = "md" }) {
  const sizeClass =
    size === "sm" ? "h-10 w-10 text-xs" : size === "lg" ? "h-12 w-12 sm:h-[52px] sm:w-[52px] text-sm" : "h-12 w-12 text-sm";
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted shadow-sm",
        sizeClass,
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center font-semibold text-muted-foreground">
          {initial}
        </span>
      )}
    </div>
  );
}
