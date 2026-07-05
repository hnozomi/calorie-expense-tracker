import { type NextRequest, NextResponse } from "next/server";

/** Auth-aware proxy: refreshes session, redirects based on auth state */
export const proxy = async (request: NextRequest) => {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next();
  }

  // Skip the Supabase auth round-trip for router prefetch requests and
  // client-side navigations (RSC payload fetches). Pages are static shells
  // with no user data — actual data is fetched client-side under RLS — and
  // the getUser() round-trip here would otherwise block tab switches for
  // hundreds of ms whenever the router cache has expired. Document loads
  // below still enforce the auth redirects.
  if (
    request.headers.get("next-router-prefetch") ||
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("RSC") === "1"
  ) {
    return NextResponse.next();
  }

  const { updateSession } = await import("@/lib/supabase/middleware");
  const { response, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Unauthenticated users accessing protected routes → redirect to /login
  const protectedPrefixes = ["/home", "/plan", "/recipes", "/other"];
  if (!user && protectedPrefixes.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Authenticated users accessing auth pages → redirect to /home
  if (user && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // Root → redirect based on auth state
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(user ? "/home" : "/login", request.url),
    );
  }

  return response;
};

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|sw.js|manifest.webmanifest|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
