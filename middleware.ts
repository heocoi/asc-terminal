import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = new Set(["/login", "/api/auth"]);

function getSecret() {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) return null;
  // Use dedicated JWT_SECRET if set, otherwise derive from password + static salt
  const raw = process.env.JWT_SECRET || `orchard:${password}:session-signing-key`;
  return new TextEncoder().encode(raw);
}

export async function middleware(request: NextRequest) {
  const secret = getSecret();
  if (!secret) return NextResponse.next(); // No password = no auth

  const { pathname } = request.nextUrl;

  // Allow login page and auth endpoint
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // Verify signed session token
  const authCookie = request.cookies.get("asc-auth");
  if (authCookie?.value) {
    try {
      await jwtVerify(authCookie.value, secret);
      return NextResponse.next();
    } catch {
      // Invalid/expired token - fall through to redirect
    }
  }

  // API routes return 401 instead of redirect
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Redirect to login
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
