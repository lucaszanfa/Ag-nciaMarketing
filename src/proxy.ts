import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/session";

/**
 * Route protection lives here instead of `middleware.ts` — this Next.js
 * version renamed the file convention to `proxy.ts` (see
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md).
 * Optimistic check only (cookie payload, no DB hit) — the authoritative check
 * is `getCurrentUser()`/`requireRole()` in src/lib/auth.ts.
 */
const PUBLIC_ROUTES = ["/login", "/registrar"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  const session = await getSession();

  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublicRoute && session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/admin") && session?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|svg|ico)$).*)"],
};
