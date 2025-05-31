// app/api/sessionUser/route.js
import { NextResponse } from "next/server";
import admin from "@/firebase/admin";

const firestore = admin.firestore();

export async function GET(req) {
  const cookie = req.cookies.get("session")?.value;
  if (!cookie) {
    return NextResponse.json({ user: null });
  }

  try {
    // 1) Verify session cookie
    const decoded = await admin.auth().verifySessionCookie(cookie, true);

    // 2) Fetch Firestore user doc
    const userDoc = await firestore.collection("users").doc(decoded.uid).get();
    const data = userDoc.exists ? userDoc.data() : {};

    // 3) Pick the best display name
    const displayName =
      data.displayName ??
      data.name ??
      data.companyName ??
      data.companyNameEn ??
      data.companyNameAr ??
      decoded.name ??
      "";

    // 4) Return full user object
    return NextResponse.json({
      user: {
        uid: decoded.uid,
        email: decoded.email,
        displayName,
        role: data.role ?? "",
        // ...any other fields you want to include
      },
    });
  } catch (err) {
    console.error("sessionUser error:", err);
    return NextResponse.json({ user: null });
  }
}
