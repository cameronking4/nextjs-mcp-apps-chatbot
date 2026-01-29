import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { guestRegex, isDevelopmentEnvironment } from "./lib/constants";

async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  // MCP endpoints should not hit this proxy at all due to matcher exclusion
  // But adding this as a safeguard
  if (pathname.startsWith("/api/mcp")) {
    return NextResponse.next();
  }

  // Auth routes are handled by NextAuth
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (!token) {
    const redirectUrl = encodeURIComponent(request.url);

    return NextResponse.redirect(
      new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url)
    );
  }

  const isGuest = guestRegex.test(token?.email ?? "");

  if (token && !isGuest && ["/login", "/register"].includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Export as proxy for Next.js
export { proxy };

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /api/mcp/* (MCP endpoints - publicly accessible)
     * - /api/auth/* (handled by NextAuth)
     * - /_next/* (Next.js internals)
     * - /favicon.ico, /sitemap.xml, /robots.txt (static files)
     */
    "/((?!api/mcp/|api/auth/|_next/|favicon\\.ico|sitemap\\.xml|robots\\.txt).*)",
  ],
};
