"use client";

import { Calendar, Heart, LayoutGrid, MapPin } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";

const items = [
  { href: "/map", label: "Map", icon: MapPin },
  { href: "/feed", label: "Feed", icon: LayoutGrid },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/saved", label: "Saved", icon: Heart },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-firefly/10 bg-background/90 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 transition-colors ${
                active ? "text-firefly" : "text-foreground/50 hover:text-foreground/80"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-mono text-[9px] uppercase tracking-wider-2">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
