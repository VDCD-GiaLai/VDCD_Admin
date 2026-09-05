"use client";

import { useCallback, useState } from "react";
import type { DocumentContent } from "../model/document.types";

const MAX_HISTORY = 50;

/**
 * Undo/redo history hook for the Visual Editor.
 * Stores JSON snapshots of DocumentContent (max 50 entries).
 * Uses useState so canUndo/canRedo trigger re-renders cleanly.
 */
export function useEditorHistory(
  content: DocumentContent,
  onChange: (content: DocumentContent) => void,
) {
  const [past, setPast] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);

  /** Snapshot current state before a mutation */
  const pushState = useCallback(() => {
    const snapshot = JSON.stringify(content);
    setPast((prev) => {
      const next = [...prev, snapshot];
      if (next.length > MAX_HISTORY) next.shift();
      return next;
    });
    setFuture([]); // Clear redo stack on new action
  }, [content]);

  /** Undo: restore previous state */
  const undo = useCallback(() => {
    if (past.length === 0) return;

    const currentSnapshot = JSON.stringify(content);
    const newPast = [...past];
    const previous = newPast.pop()!;
    const parsed = JSON.parse(previous) as DocumentContent;

    setPast(newPast);
    setFuture((prev) => [...prev, currentSnapshot]);
    onChange(parsed);
  }, [content, onChange, past]);

  /** Redo: restore next state */
  const redo = useCallback(() => {
    if (future.length === 0) return;

    const currentSnapshot = JSON.stringify(content);
    const newFuture = [...future];
    const next = newFuture.pop()!;
    const parsed = JSON.parse(next) as DocumentContent;

    setFuture(newFuture);
    setPast((prev) => [...prev, currentSnapshot]);
    onChange(parsed);
  }, [content, future, onChange]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  return { pushState, undo, redo, canUndo, canRedo };
}
