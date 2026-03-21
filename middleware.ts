import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/** Auth-aware middleware: redirects unauthenticated users and protects routes */
export async function middleware(request: NextRequest) {
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
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|icons/|manifest.webmanifest|auth/callback).*)",
  ],
};
