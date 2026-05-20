"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  MABLY_DEFAULT_BRAND_HEX,
  normalizeHexColor,
} from "@/lib/branding/portal-brand-tokens";

/** Shown in pickers when the project has no saved brand color. */
export const DEFAULT_BRAND_COLOR_HEX = MABLY_DEFAULT_BRAND_HEX;

/**
 * @param {{
 *   id?: string;
 *   value: string;
 *   onChange: (value: string) => void;
 *   disabled?: boolean;
 *   className?: string;
 * }}
 */
export function BrandColorField({ id = "brandColor", value, onChange, disabled, className }) {
  const swatchColor = normalizeHexColor(value) ?? DEFAULT_BRAND_COLOR_HEX;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <Input
        id={id}
        type="color"
        value={swatchColor}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-12 w-20 shrink-0 cursor-pointer disabled:cursor-not-allowed"
        aria-label="Brand color"
      />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={DEFAULT_BRAND_COLOR_HEX}
        disabled={disabled}
        className="flex-1"
        aria-labelledby={id}
      />
    </div>
  );
}

/**
 * @param {{
 *   id?: string;
 *   value: string;
 *   onChange: (value: string) => void;
 *   disabled?: boolean;
 *   description?: string;
 *   className?: string;
 * }}
 */
export function BrandColorFieldGroup({
  id = "brandColor",
  value,
  onChange,
  disabled,
  description = "Used for buttons, links, and backgrounds in the client portal.",
  className,
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>Brand color</Label>
      <BrandColorField id={id} value={value} onChange={onChange} disabled={disabled} />
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
