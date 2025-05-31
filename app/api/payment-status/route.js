// app/api/registration-status/route.js

import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const resourcePath = searchParams.get("resourcePath");
  if (!resourcePath) {
    return NextResponse.json(
      { error: "Missing resourcePath query parameter" },
      { status: 400 }
    );
  }

  const base = process.env.HYPERPAY_BASE_URL || "https://eu-test.oppwa.com";
  const entityId = process.env.HYPERPAY_ENTITY_ID;
  const token = process.env.HYPERPAY_ACCESS_TOKEN;

  if (!entityId || !token) {
    console.error("❌ Missing HyperPay credentials");
    return NextResponse.json(
      { error: "Server misconfiguration: missing HyperPay credentials" },
      { status: 500 }
    );
  }

  try {
    // Hit the HyperPay resource path to get the registration details
    const url = `${base}${resourcePath}`;
    const response = await axios.get(url, {
      params: { entityId },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // According to the Registration Token docs, the response will include:
    // data.registration.id
    const registrationId = response.data?.registration?.id;
    if (!registrationId) {
      console.error(
        "❌ No registration.id in HyperPay response",
        response.data
      );
      return NextResponse.json(
        { error: "Invalid HyperPay response" },
        { status: 502 }
      );
    }

    return NextResponse.json({ registrationId });
  } catch (err) {
    console.error(
      "❌ /api/registration-status error:",
      err.response?.data || err.message
    );
    const message = err.response?.data || err.message || "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
