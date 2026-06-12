import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Supabase middleware/auth — re-enable when SUPABASE_ENABLED = true
// import { updateSession } from "@/lib/supabase/middleware";
// import { canAccessPath, stripLocale } from "@/lib/auth/guards";
// import { createServerClient } from "@supabase/ssr";
// import type { Database } from "@/types/database.types";
// import type { UserRole } from "@/types";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  const intlResponse = intlMiddleware(request);

  // Skip Supabase session refresh and role guards while database is disabled.
  // All routes are accessible so you can build UI without auth.
  if (!isSupabaseConfigured()) {
    return intlResponse;
  }

  // --- Supabase auth (uncomment when SUPABASE_ENABLED = true) ---
  // const { updateSession } = await import("@/lib/supabase/middleware");
  // const { canAccessPath, stripLocale } = await import("@/lib/auth/guards");
  // const { createServerClient } = await import("@supabase/ssr");
  // const supabaseResponse = await updateSession(request);
  // const supabase = createServerClient(
  //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  //   { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
  // );
  // const { data: { user } } = await supabase.auth.getUser();
  // let role: UserRole | "guest" = "guest";
  // if (user) {
  //   const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  //   role = (profile?.role as UserRole) ?? "user";
  // }
  // const access = canAccessPath(pathname, role);
  // if (!access.allowed && access.redirect) {
  //   const locale = pathname.match(/^\/(en|ro)/)?.[1] ?? "en";
  //   const url = request.nextUrl.clone();
  //   url.pathname = `/${locale}${stripLocale(access.redirect)}`;
  //   return NextResponse.redirect(url);
  // }
  // supabaseResponse.cookies.getAll().forEach((cookie) => {
  //   intlResponse.cookies.set(cookie.name, cookie.value);
  // });

  return intlResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
