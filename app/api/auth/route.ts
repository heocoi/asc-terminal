import { NextResponse } from "next/server";
import { SignJWT } from "jose";

export async function POST(request: Request) {
  const { password } = await request.json();
  const expected = process.env.DASHBOARD_PASSWORD;

  if (!expected || password !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Sign a JWT session token instead of storing raw password
  const secret = new TextEncoder().encode(expected);
  const token = await new SignJWT({ auth: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret);

  const response = NextResponse.json({ ok: true });
  response.cookies.set("asc-auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return response;
}
