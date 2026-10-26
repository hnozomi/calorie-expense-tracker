import { type NextRequest, NextResponse } from "next/server";

/** Auth-aware proxy: refreshes session, redirects based on auth state */
export const proxy = async (request: NextRequest) => {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next();
  }

  const { updateSession } = await import("@/lib/supabase/middleware");
  const { response, isSignedIn } = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Unauthenticated users accessing protected routes → redirect to /login
  const protectedPrefixes = ["/home", "/plan", "/recipes", "/other"];
  if (!isSignedIn && protectedPrefixes.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Authenticated users accessing auth pages → redirect to /home
  if (isSignedIn && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // Root → redirect based on auth state
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isSignedIn ? "/home" : "/login", request.url),
    );
  }

  return response;
};

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|sw.js|manifest.webmanifest|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
