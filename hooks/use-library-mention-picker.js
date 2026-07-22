"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildLibraryMentionItems,
  filterLibraryMentionItems,
} from "@/components/chat-library-mention-picker";
import {
  listLibraryFiles,
  listLibraryLinks,
} from "@/lib/actions/project-library";
import { isDemoProjectId } from "@/lib/data/demo-project";

/**
 * Shared @ mention picker state for chat, discussion, and action description.
 * @param {{ projectId: string; enabled?: boolean }} opts
 */
export function useLibraryMentionPicker({ projectId, enabled = true }) {
  /** @type {[any[], import("react").Dispatch<any>]} */
  const [libraryItems, setLibraryItems] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  /** @type {[{ start: number; query: string } | null, import("react").Dispatch<any>]} */
  const [mentionState, setMentionState] = useState(null);
  const [mentionIndex, setMentionIndex] = useState(0);

  const canUse = Boolean(enabled && projectId && !isDemoProjectId(String(projectId)));

  const ensureLibraryLoaded = useCallback(async () => {
    if (!canUse || libraryLoaded || libraryLoading) return;
    setLibraryLoading(true);
    try {
      const [filesRes, linksRes] = await Promise.all([
        listLibraryFiles(String(projectId)),
        listLibraryLinks(String(projectId)),
      ]);
      setLibraryItems(
        buildLibraryMentionItems(
          filesRes.ok ? filesRes.items : [],
          linksRes.ok ? linksRes.items : []
        )
      );
      setLibraryLoaded(true);
    } finally {
      setLibraryLoading(false);
    }
  }, [canUse, libraryLoaded, libraryLoading, projectId]);

  const onMentionQueryChange = useCallback(
    (active) => {
      if (!canUse) {
        setMentionState(null);
        return;
      }
      setMentionState(active);
      if (active) void ensureLibraryLoaded();
    },
    [canUse, ensureLibraryLoaded]
  );

  const filteredMentions = useMemo(
    () => filterLibraryMentionItems(libraryItems, mentionState?.query || "", 8),
    [libraryItems, mentionState?.query]
  );

  useEffect(() => {
    setMentionIndex(0);
  }, [mentionState?.query, mentionState?.start, filteredMentions.length]);

  /**
   * @param {React.KeyboardEvent} e
   * @param {(item: any) => void} onSelect
   * @returns {boolean} true if the event was handled
   */
  const handleMentionKeyDown = useCallback(
    (e, onSelect) => {
      if (!mentionState || !canUse) return false;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (filteredMentions.length === 0) return true;
        setMentionIndex((i) => (i + 1) % filteredMentions.length);
        return true;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (filteredMentions.length === 0) return true;
        setMentionIndex(
          (i) => (i - 1 + filteredMentions.length) % filteredMentions.length
        );
        return true;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionState(null);
        return true;
      }
      if (
        (e.key === "Enter" || e.key === "Tab") &&
        filteredMentions[mentionIndex]
      ) {
        e.preventDefault();
        onSelect(filteredMentions[mentionIndex]);
        setMentionState(null);
        return true;
      }
      return false;
    },
    [mentionState, canUse, filteredMentions, mentionIndex]
  );

  return {
    canUse,
    mentionState,
    setMentionState,
    mentionIndex,
    setMentionIndex,
    filteredMentions,
    libraryLoading,
    libraryEmpty: libraryLoaded && libraryItems.length === 0,
    onMentionQueryChange,
    handleMentionKeyDown,
    pickerOpen: Boolean(mentionState) && canUse,
    pickerLoading: libraryLoading && libraryItems.length === 0,
  };
}
