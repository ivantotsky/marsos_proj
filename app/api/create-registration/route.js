// app/api/create-registration/route.js

import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request) {
  const { amount } = await request.json();
  if (amount == null) {
    return NextResponse.json(
      { error: "Missing amount in request body" },
      { status: 400 }
    );
  }

  const base = process.env.HYPERPAY_BASE_URL;
  const entityId = process.env.HYPERPAY_ENTITY_ID;
  const token = process.env.HYPERPAY_ACCESS_TOKEN;

  if (!entityId || !token) {
    console.error("❌ HYPERPAY_ENTITY_ID or ACCESS_TOKEN not set");
    return NextResponse.json(
      { error: "Server misconfiguration: missing HyperPay credentials" },
      { status: 500 }
    );
  }

  try {
    const url = `${base}/v1/checkouts`;
    const params = new URLSearchParams({
      entityId,
      amount: amount.toString(),
      currency: "SAR",
      createRegistration: "true",
    }).toString();

    console.log("🔔 HyperPay request URL:", `${url}?${params}`);

    const response = await axios.post(`${url}?${params}`, null, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("🔔 HyperPay response data:", response.data);

    const checkoutId = response.data.id;
    if (!checkoutId) {
      console.error("❌ No 'id' in HyperPay response");
      return NextResponse.json(
        { error: "No checkoutId returned from HyperPay" },
        { status: 502 }
      );
    }

    return NextResponse.json({ checkoutId });
  } catch (err) {
    console.error(
      "❌ create-registration error:",
      err.response?.data || err.message
    );
    const message = err.response?.data || err.message || "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
