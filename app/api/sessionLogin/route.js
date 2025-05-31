// app/api/sessionLogin/route.js
import { NextResponse } from "next/server";
import admin from "@/firebase/admin";

export async function POST(req) {
  const { idToken } = await req.json();

  // 24 hours in milliseconds
  const expiresIn = 24 * 60 * 60 * 1000;

  // Create the session cookie
  const sessionCookie = await admin
    .auth()
    .createSessionCookie(idToken, { expiresIn });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: expiresIn / 1000,
    path: "/",
  });
  return res;
}
