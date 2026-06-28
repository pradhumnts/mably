"use client";

import { useEffect, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listLibraryFileVersions } from "@/lib/actions/project-library";
import { formatLibraryVersionLabel } from "@/lib/library/file-versions";
import { cn } from "@/lib/utils";

/**
 * @param {{
 *   projectId: string;
 *   fileId: string;
 *   value: string | null;
 *   onChange: (versionId: string | null, versionNumber: number) => void;
 *   className?: string;
 * }} props
 */
export function LibraryFileVersionSelect({
  projectId,
  fileId,
  value,
  onChange,
  className,
}) {
  const [items, setItems] = useState(/** @type {any[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const res = await listLibraryFileVersions(String(projectId), String(fileId));
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        setItems([]);
        return;
      }
      const nextItems = res.items || [];
      setItems(nextItems);
      if (!value) {
        const current = nextItems.find((v) => v.is_current) || nextItems[0];
        if (current) {
          onChangeRef.current(
            current.id ? String(current.id) : null,
            Number(current.version_number) || 1
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, fileId, value]);

  if (loading || items.length <= 1) return null;

  const selected = value || items.find((v) => v.is_current)?.id || items[0]?.id;

  return (
    <Select
      value={selected ? String(selected) : undefined}
      onValueChange={(next) => {
        const row = items.find((v) => String(v.id) === next);
        onChange(next, Number(row?.version_number) || 1);
      }}
    >
      <SelectTrigger className={cn("h-8 w-[5.5rem] shrink-0 text-xs font-medium", className)}>
        <SelectValue placeholder="Version" />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={String(item.id)} value={String(item.id)}>
            {formatLibraryVersionLabel(item.version_number)}
            {item.is_current ? " · current" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
