// app/api/create-checkout/route.js
import { NextResponse } from "next/server";

export async function POST(request) {
  const { supplierId, userEmail } = await request.json();

  const params = new URLSearchParams({
    entityId: process.env.HYPERPAY_ENTITY_ID,
    createRegistration: "true",
    merchantTransactionId: `${supplierId}_${Date.now()}`,
    "customer.email": userEmail,
  });

  const hpRes = await fetch(`${process.env.HYPERPAY_BASE_URL}/v1/checkouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${process.env.HYPERPAY_ACCESS_TOKEN}`,
    },
    body: params.toString(),
  });

  const json = await hpRes.json();
  if (hpRes.status !== 200 || !json.id) {
    return NextResponse.json({ error: json }, { status: 502 });
  }

  return NextResponse.json({ checkoutId: json.id });
}
