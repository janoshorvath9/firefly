import { Link } from "@/i18n/navigation";

export default function EventNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <div>
        <h1 className="mb-3 font-display text-5xl">This firefly flew away</h1>
        <p className="mb-6 text-foreground/60">We couldn&apos;t find that event.</p>
        <Link
          href="/feed"
          className="inline-flex rounded-full bg-firefly px-5 py-2.5 text-primary-foreground"
        >
          Back to feed
        </Link>
      </div>
    </main>
  );
}
