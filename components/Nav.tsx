"use client";

import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/components/session-provider";
import { signOut } from "@/lib/actions/auth";

const publicLinks = [
  { href: "/map", label: "Map" },
  { href: "/feed", label: "Feed" },
  { href: "/calendar", label: "Calendar" },
] as const;

const savedLink = { href: "/saved", label: "Saved" } as const;

export function Nav() {
  const session = useSession();
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const isLoggedIn = Boolean(session.userId);
  const links = isLoggedIn ? [...publicLinks, savedLink] : publicLinks;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-firefly animate-firefly-pulse" />
          </span>
          <span className="font-display text-xl tracking-wide">Firefly</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-[11px] uppercase tracking-wider-2 text-foreground/70 transition-colors hover:text-firefly"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Link
                href="/profile"
                className="hidden rounded-full border border-firefly/30 px-4 py-2 font-mono text-[11px] uppercase tracking-wider-2 text-firefly transition-colors hover:bg-firefly/10 sm:inline-flex"
              >
                {session.displayName ?? "Profile"}
              </Link>
              <form action={signOut.bind(null, locale)}>
                <button
                  type="submit"
                  className="hidden rounded-full border border-foreground/20 px-4 py-2 font-mono text-[11px] uppercase tracking-wider-2 text-foreground/60 transition-colors hover:border-foreground/40 hover:text-foreground/90 sm:inline-flex"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/auth"
              className="hidden rounded-full border border-firefly/30 px-4 py-2 font-mono text-[11px] uppercase tracking-wider-2 text-firefly transition-colors hover:bg-firefly/10 sm:inline-flex"
            >
              Sign in
            </Link>
          )}
          <Link
            href="/map"
            className="inline-flex rounded-full bg-firefly px-4 py-2 font-medium text-primary-foreground transition-all hover:firefly-glow hover:scale-[1.02]"
          >
            Open map
          </Link>
        </div>
      </div>
    </header>
  );
}
