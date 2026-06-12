"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { saveEvent, unsaveEvent } from "@/lib/actions/saves";
import { SUPABASE_DISABLED_MESSAGE } from "@/lib/supabase/config";

const STORAGE_KEY = "firefly:saved";
const EMPTY_SAVED_IDS: readonly string[] = [];

function readSavedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeSavedIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

function mergeSavedIds(serverSavedIds: readonly string[]): Set<string> {
  return new Set([...serverSavedIds, ...readSavedIds()]);
}

function sameSet(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const id of a) {
    if (!b.has(id)) return false;
  }
  return true;
}

export function useSavedEvents(
  serverSavedIds: readonly string[] = EMPTY_SAVED_IDS
) {
  const [savedIds, setSavedIds] = useState<Set<string>>(() =>
    mergeSavedIds(serverSavedIds)
  );
  const [pending, startTransition] = useTransition();

  const serverKey = serverSavedIds.join("\0");

  useEffect(() => {
    const merged = mergeSavedIds(serverSavedIds);
    setSavedIds((prev) => (sameSet(prev, merged) ? prev : merged));
  }, [serverKey]);

  const ids = useMemo(() => [...savedIds], [savedIds]);

  const has = useCallback(
    (eventId: string) => savedIds.has(eventId),
    [savedIds]
  );

  const toggle = useCallback((eventId: string) => {
    startTransition(async () => {
      const nextIds = readSavedIds();
      const next = !nextIds.has(eventId);

      if (next) nextIds.add(eventId);
      else nextIds.delete(eventId);
      writeSavedIds(nextIds);
      setSavedIds(new Set(nextIds));

      const result = next
        ? await saveEvent(eventId)
        : await unsaveEvent(eventId);

      if (
        !result.success &&
        result.error !== SUPABASE_DISABLED_MESSAGE
      ) {
        const reverted = readSavedIds();
        if (next) reverted.delete(eventId);
        else reverted.add(eventId);
        writeSavedIds(reverted);
        setSavedIds(new Set(reverted));
      }
    });
  }, []);

  return { has, toggle, pending, ids };
}
