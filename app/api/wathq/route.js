import OAuth from "oauth-1.0a";
import crypto from "crypto";
import { NextResponse } from "next/server";
import fetch from "node-fetch";

// Production base path for CR endpoints
const BASE_URL = process.env.WATHQ_BASE_URL;

if (!BASE_URL) {
  console.error("Missing WATHQ_BASE_URL in environment!");
}

export async function GET(request) {
  if (!BASE_URL) {
    return NextResponse.json(
      { error: "Server misconfiguration: missing WATHQ_BASE_URL" },
      { status: 500 }
    );
  }

  const nun = new URL(request.url).searchParams.get("nun");
  if (!nun) {
    return NextResponse.json({ error: "Missing nun" }, { status: 400 });
  }

  // 2-legged OAuth1 HMAC-SHA1
  const oauth = new OAuth({
    consumer: {
      key: process.env.WATHQ_CONSUMER_KEY,
      secret: process.env.WATHQ_CONSUMER_SECRET,
    },
    signature_method: "HMAC-SHA1",
    hash_function(baseString, key) {
      return crypto.createHmac("sha1", key).update(baseString).digest("base64");
    },
  });

  // Build & sign the GET URL
  const url = `${BASE_URL}/search?crNumber=${encodeURIComponent(nun)}`;
  console.log("🔗 Calling production URL:", url);

  const authHeader = oauth.toHeader(
    oauth.authorize({ url, method: "GET", data: { crNumber: nun } })
  );

  try {
    const wres = await fetch(url, {
      method: "GET",
      headers: {
        ...authHeader,
        Accept: "application/json",
      },
    });
    const data = await wres.json();

    if (!wres.ok) {
      console.error("Wathq production error:", wres.status, data);
      return NextResponse.json({ error: data }, { status: wres.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Wathq production proxy exception:", err);
    return NextResponse.json(
      { error: "Internal server error", detail: err.message },
      { status: 500 }
    );
  }
}
