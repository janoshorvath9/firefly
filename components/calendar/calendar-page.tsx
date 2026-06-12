"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { BottomNav } from "@/components/BottomNav";
import { Nav } from "@/components/Nav";
import { landingImages } from "@/lib/landing/images";
import {
  buildEventsByDate,
  isToday,
  monthMatrix,
  toDateKey,
  WEEKDAYS,
} from "@/lib/utils/calendar";
import { formatTimeRange } from "@/lib/utils/event-format";
import type { EventListItem } from "@/types/events";

type Props = {
  events: EventListItem[];
};

export function CalendarPageClient({ events }: Props) {
  const today = new Date();
  const [cursor, setCursor] = useState({
    y: today.getFullYear(),
    m: today.getMonth(),
  });
  const [selected, setSelected] = useState(toDateKey(today));

  const cells = useMemo(
    () => monthMatrix(cursor.y, cursor.m),
    [cursor.y, cursor.m]
  );
  const eventsByDate = useMemo(() => buildEventsByDate(events), [events]);
  const selectedEvents = eventsByDate.get(selected) ?? [];

  const monthName = new Date(cursor.y, cursor.m).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const shift = (delta: number) => {
    const next = new Date(cursor.y, cursor.m + delta);
    setCursor({ y: next.getFullYear(), m: next.getMonth() });
  };

  const selectedDate = new Date(`${selected}T00:00:00`);

  return (
    <main data-route="calendar" className="relative min-h-screen pb-24 md:pb-12">
      <Nav />

      <section className="mx-auto max-w-7xl px-6 pt-32">
        <div className="mb-3 font-mono text-xs uppercase tracking-wider-2 text-firefly">
          ◦ Calendar
        </div>
        <h1 className="text-balance font-heading text-5xl font-bold leading-none md:text-6xl">
          Time, made <span className="text-gradient-firefly">visible.</span>
        </h1>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-heading text-2xl">{monthName}</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCursor({
                      y: today.getFullYear(),
                      m: today.getMonth(),
                    })
                  }
                  className="rounded-full border border-firefly/30 px-3 py-1.5 font-mono text-xs uppercase tracking-wider-2 text-firefly transition-colors hover:bg-firefly/10"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => shift(-1)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-firefly/20 transition-colors hover:border-firefly/50"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => shift(1)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-firefly/20 transition-colors hover:border-firefly/50"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mb-3 grid grid-cols-7 gap-2">
              {WEEKDAYS.map((weekday) => (
                <div
                  key={weekday}
                  className="text-center font-mono text-[10px] uppercase tracking-wider-2 text-foreground/40"
                >
                  {weekday}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {cells.map((date, index) => {
                if (!date) return <div key={index} />;

                const key = toDateKey(date);
                const dayEvents = eventsByDate.get(key) ?? [];
                const isSelected = key === selected;
                const todayCell = isToday(key, today);

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelected(key)}
                    className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-all ${
                      isSelected
                        ? "border border-firefly bg-firefly/15 text-firefly"
                        : "border border-firefly/10 bg-surface-1/40 hover:border-firefly/30"
                    } ${todayCell && !isSelected ? "ring-1 ring-firefly/50" : ""}`}
                  >
                    <span
                      className={
                        todayCell
                          ? "font-semibold text-firefly"
                          : "text-foreground/80"
                      }
                    >
                      {date.getDate()}
                    </span>
                    {dayEvents.length > 0 ? (
                      <div className="absolute bottom-1.5 flex gap-0.5">
                        {dayEvents.slice(0, 3).map((_, dotIndex) => (
                          <span
                            key={dotIndex}
                            className="h-1 w-1 animate-firefly-pulse rounded-full bg-firefly"
                            style={{
                              animationDelay: `${dotIndex * 0.3}s`,
                              boxShadow: "0 0 6px #FEF7A3",
                            }}
                          />
                        ))}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="glass self-start rounded-3xl p-6">
            <div className="mb-2 font-mono text-xs uppercase tracking-wider-2 text-firefly">
              {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
            </div>
            <h2 className="mb-6 font-heading text-3xl font-bold">
              {selectedDate.toLocaleDateString("en-US", {
                day: "numeric",
                month: "long",
              })}
            </h2>

            {selectedEvents.length === 0 ? (
              <div className="text-sm text-foreground/50">
                A quiet night. Use the time to rest — or check tomorrow.
              </div>
            ) : (
              <ul className="space-y-3">
                {selectedEvents.map((event) => {
                  const image =
                    event.coverImageUrl ?? landingImages.editorialCrowd;

                  return (
                    <li key={event.id}>
                      <Link
                        href={`/events/${event.slug}`}
                        className="group flex gap-3 rounded-2xl border-l-2 border-firefly bg-surface-2/50 p-3 transition-colors hover:bg-firefly/10"
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                          <Image
                            src={image}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-heading font-semibold transition-colors group-hover:text-firefly">
                            {event.title}
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-xs text-foreground/55">
                            <MapPin className="h-3 w-3" />
                            {event.venueName}
                          </div>
                          <div className="mt-1 flex items-center gap-1 font-mono text-xs text-firefly">
                            <Clock className="h-3 w-3" />
                            {formatTimeRange(event.startsAt, event.endsAt)}
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
