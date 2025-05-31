import { NextResponse } from "next/server";

export const config = {
  matcher: [
    "/buyer-dashboard/:path*",
    "/supplier-dashboard/:path*",
    "/admin-dashboard/:path*",
    "/checkout/:path*",
  ],
};

export async function middleware(req) {
  const sessionCookie = req.cookies.get("session")?.value;
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/user-login", req.url));
  }

  const apiRes = await fetch(new URL("/api/sessionUser", req.url).toString(), {
    method: "GET",
    headers: { Cookie: `session=${sessionCookie}` },
  });

  if (!apiRes.ok) {
    return NextResponse.redirect(new URL("/user-login", req.url));
  }
  const { user } = await apiRes.json();
  if (!user) {
    return NextResponse.redirect(new URL("/user-login", req.url));
  }

  return NextResponse.next();
}
