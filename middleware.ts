import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) return NextResponse.next(); // No password = no auth

  // Skip auth for API routes (they're server-side only)
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get("asc-auth");
  if (authCookie?.value === password) {
    return NextResponse.next();
  }

  // Check if this is a login attempt
  if (request.method === "POST" && request.nextUrl.pathname === "/login") {
    return NextResponse.next();
  }

  // Redirect to login
  if (request.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
