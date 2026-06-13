import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { landingImages } from "@/lib/landing/images";
import type { EventListItem } from "@/types/events";

type Props = {
  event: EventListItem;
  featured?: boolean;
};

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatGenre(genre: EventListItem["genre"]) {
  return genre.replace(/_/g, " ");
}

export function EventCard({ event, featured = false }: Props) {
  const image = event.coverImageUrl ?? landingImages.editorialCrowd;

  return (
    <Link
      href={`/events/${event.slug}`}
      className={`group block overflow-hidden rounded-3xl border border-firefly/10 bg-card transition-all hover:border-firefly/30 hover:firefly-glow${
        featured ? " flex h-full flex-col" : " h-full"
      }`}
    >
      <div
        className={`relative overflow-hidden${
          featured ? " min-h-[240px] flex-1" : " aspect-[16/10]"
        }`}
      >
        <Image
          src={image}
          alt={event.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
        {event.isPromoted && (
          <span className="absolute left-4 top-4 rounded-full bg-firefly/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider-2 text-firefly">
            Promoted
          </span>
        )}
      </div>

      <div className="shrink-0 space-y-2 p-5">
        <div className="font-mono text-[10px] uppercase tracking-wider-2 text-firefly">
          {formatWhen(event.startsAt)}
        </div>
        <h3 className="font-heading text-xl font-bold leading-tight transition-colors group-hover:text-firefly">
          {event.title}
        </h3>
        <div className="flex items-center justify-between gap-3 text-sm text-foreground/60">
          <span>
            {event.venueName} · {formatGenre(event.genre)}
          </span>
          {event.price != null && (
            <span className="rounded-full bg-amber-warm/15 px-2 py-0.5 text-[10px] font-medium text-amber-warm">
              {event.price} lei
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
