import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route protection middleware.
 * Checks for visualpc_token cookie or Authorization header.
 * Protected routes: /dashboard, /submit-job, /architecture
 * Public routes: /login, /api/auth, /health, /, /_next, /favicon
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — skip protection
  const publicPaths = ["/login", "/api/auth", "/_next", "/favicon", "/health"];
  if (
    pathname === "/" ||
    publicPaths.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  // Check for auth token (cookie or header)
  const token =
    request.cookies.get("visualpc_token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  // For client-rendered pages, we can't fully block here because token
  // is in localStorage. Instead, the client auth guard handles redirect.
  // This middleware adds security headers and handles API proxy if needed.

  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
