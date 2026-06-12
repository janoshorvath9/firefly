"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Bell, Share2, Ticket } from "lucide-react";
import { saveEvent, unsaveEvent } from "@/lib/actions/saves";
import { trackShare } from "@/lib/actions/analytics";
import { SUPABASE_DISABLED_MESSAGE } from "@/lib/supabase/config";

const STORAGE_KEY = "firefly:saved";

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

type Props = {
  eventId: string;
  eventTitle: string;
  initialSaved: boolean;
  ticketUrl: string | null;
};

export function EventActions({
  eventId,
  eventTitle,
  initialSaved,
  ticketUrl,
}: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setSaved(initialSaved || readSavedIds().has(eventId));
  }, [eventId, initialSaved]);

  const toggleSaved = useCallback(() => {
    startTransition(async () => {
      const next = !saved;
      setSaved(next);

      const ids = readSavedIds();
      if (next) ids.add(eventId);
      else ids.delete(eventId);
      writeSavedIds(ids);

      const result = next
        ? await saveEvent(eventId)
        : await unsaveEvent(eventId);

      if (
        !result.success &&
        result.error !== SUPABASE_DISABLED_MESSAGE
      ) {
        setSaved(!next);
        if (next) ids.delete(eventId);
        else ids.add(eventId);
        writeSavedIds(ids);
      }
    });
  }, [eventId, saved]);

  const share = useCallback(async () => {
    const url = window.location.href;

    if (navigator.share) {
      await navigator.share({ title: eventTitle, url });
    } else {
      await navigator.clipboard.writeText(url);
    }

    void trackShare("event", eventId);
  }, [eventId, eventTitle]);

  return (
    <aside className="space-y-3 self-start lg:sticky lg:top-24">
      {ticketUrl ? (
        <a
          href={`/api/out/${eventId}`}
          className="flex items-center justify-center gap-2 rounded-full bg-firefly px-6 py-4 font-medium text-primary-foreground transition-all hover:firefly-glow"
        >
          <Ticket className="h-5 w-5" />
          Get tickets
        </a>
      ) : null}

      <button
        type="button"
        onClick={toggleSaved}
        disabled={pending}
        className={`flex w-full items-center justify-center gap-2 rounded-full border px-6 py-4 font-medium transition-all ${
          saved
            ? "border-firefly bg-firefly/10 text-firefly"
            : "border-firefly/30 text-foreground hover:bg-firefly/5"
        }`}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={saved ? "#FEF7A3" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {saved ? "Saved to your jar" : "Save this night"}
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-full border border-firefly/20 px-4 py-3 text-sm transition-colors hover:border-firefly/50"
        >
          <Bell className="h-4 w-4" />
          Remind
        </button>
        <button
          type="button"
          onClick={() => void share()}
          className="flex items-center justify-center gap-2 rounded-full border border-firefly/20 px-4 py-3 text-sm transition-colors hover:border-firefly/50"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>

      <p className="pt-3 text-center text-xs text-foreground/40">
        Tickets handled by external partners. Secure checkout.
      </p>
    </aside>
  );
}
