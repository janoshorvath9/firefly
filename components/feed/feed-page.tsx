"use client";

import { useMemo, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { EventCard } from "@/components/EventCard";
import { Nav } from "@/components/Nav";
import { formatGenreLabel, GENRES } from "@/lib/constants/genres";
import type { Genre } from "@/types";
import type { EventListItem } from "@/types/events";

type Props = {
  events: EventListItem[];
};

type GenreFilter = Genre | "All";

export function FeedPageClient({ events }: Props) {
  const [genre, setGenre] = useState<GenreFilter>("All");

  const filtered = useMemo(
    () =>
      genre === "All" ? events : events.filter((event) => event.genre === genre),
    [events, genre]
  );

  return (
    <main data-route="feed" className="relative min-h-screen pb-24 md:pb-12">
      <Nav />

      <section className="mx-auto max-w-7xl px-6 pt-32">
        <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
          ◦ The feed
        </div>
        <h1 className="text-balance font-heading text-5xl font-bold leading-[0.95] md:text-7xl">
          Tonight, tomorrow,
          <br />{" "}
          <span className="text-gradient-firefly">and beyond.</span>
        </h1>
        <p className="mt-6 max-w-xl text-foreground/65">
          Scroll through every glowing dot on the map, beautifully unrolled.
        </p>

        <div className="-mx-6 mt-10 flex gap-2 overflow-x-auto px-6 pb-2 scrollbar-none">
          {(["All", ...GENRES] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setGenre(option)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-all ${
                genre === option
                  ? "border-firefly bg-firefly text-primary-foreground firefly-glow"
                  : "border-firefly/20 text-foreground/70 hover:border-firefly/50"
              }`}
            >
              {option === "All" ? "All" : formatGenreLabel(option)}
            </button>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-20 text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-firefly-pulse rounded-full border border-firefly/30 bg-firefly/10" />
            <p className="text-foreground/60">No parties match your vibe… yet.</p>
          </div>
        ) : null}
      </section>

      <BottomNav />
    </main>
  );
}
