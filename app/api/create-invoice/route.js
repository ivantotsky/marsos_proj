// app/api/create-invoice/route.js
import { NextResponse } from "next/server";
import axios from "axios";
import admin from "@/firebase/admin";

const db = admin.firestore();

function buildBillItems(items) {
  return items.map((item) => ({
    reference: item.id,
    name: item.productName,
    quantity: item.quantity,
    unitPrice: Number(item.subtotal / item.quantity).toFixed(2),
    discount: 0,
    vat: "0.15",
  }));
}

export async function POST(request) {
  try {
    const {
      firstName,
      lastName,
      phone,
      email,
      billNumber,
      issueDate,
      expireDate,
      serviceName,
      items,
      amount,
      shippingCost,
    } = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Empty cart" }, { status: 400 });
    }

    // ── Normalize Saudi mobile (sandbox fallback) ─────────────────────────
    let normalized = String(phone || "").replace(/\D/g, "");
    if (normalized.startsWith("0")) normalized = "966" + normalized.slice(1);
    if (!/^(9665\d{8})$/.test(normalized)) {
      console.warn(
        "⚠️ Invalid KSA mobile; using sandbox fallback 966512345678"
      );
      normalized = "966512345678";
    }

    // ── Build line items ─────────────────────────────────────────────────
    const billItemList = buildBillItems(items);
    if (shippingCost > 0) {
      billItemList.push({
        reference: "shipping",
        name: "Shipping",
        quantity: 1,
        unitPrice: Number(shippingCost).toFixed(2),
        discount: 0,
        vat: "0.15",
      });
    }

    // ── Customer full name ───────────────────────────────────────────────
    let rawName = `${firstName || ""} ${lastName || ""}`.trim();
    if (!rawName) rawName = "Valued Customer";
    const customerFullName = rawName.slice(0, 255);

    // ── GoPay payload ────────────────────────────────────────────────────
    const reqBody = {
      billNumber: billNumber || Date.now().toString(),
      entityActivityId: Number(process.env.ENTITY_ACTIVITY_ID),
      customerIdType: "OTH",
      customerIdNumber: process.env.GOPAY_TEST_ID_NUMBER || "2338946664",
      customerFullName,
      customerEmailAddress: email || "no-reply@domain.com",
      customerMobileNumber: normalized,
      issueDate: issueDate || new Date().toISOString().slice(0, 10),
      expireDate:
        expireDate ||
        new Date(Date.now() + 7 * 86400e3).toISOString().slice(0, 10),
      serviceName: serviceName || "Order Payment",
      billItemList,
      totalAmount: Number(amount).toFixed(2),
      shouldCreateEInvoice: false,
      isPublicView: true,
      showOnlinePayNowButton: true,
    };

    // ── Use HTTP Basic Auth ──────────────────────────────────────────────
    const apiBase = (process.env.API_BASE_URL || "").replace(/\/$/, "");
    const auth = {
      username: process.env.GOPAY_USERNAME,
      password: process.env.GOPAY_PASSWORD,
    };

    // 1️⃣ Upload invoice
    const gp = await axios.post(`${apiBase}/simple/upload`, reqBody, { auth });
    console.log("🔍 GoPay upload response:", JSON.stringify(gp.data, null, 2));

    const data = gp.data?.data;
    const billNo = data?.billNumber;
    const sadadNumber = data?.sadadNumber;
    if (!billNo || !sadadNumber) {
      return NextResponse.json(
        { error: "Missing billNumber or sadadNumber from GoPay" },
        { status: 502 }
      );
    }

    // 2️⃣ Build SADAD payment URL
    const redirectUrl = `https://qa.gopay.sa/sadadWeb/public/pay?sadadNumber=${sadadNumber}`;

    // 3️⃣ Persist in Firestore
    await db
      .collection("orders")
      .doc(billNo)
      .set(
        {
          billNumber: billNo,
          sadadNumber,
          customer: {
            fullName: customerFullName,
            email: reqBody.customerEmailAddress,
            phone: normalized,
          },
          items,
          totalAmount: amount,
          status: "pending",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    // 4️⃣ Return to client
    return NextResponse.json({ billNumber: billNo, redirectUrl });
  } catch (err) {
    console.error(
      "🔴 GoPay error status:",
      err.response?.status || err.message
    );
    console.error("🔴 GoPay error payload:", err.response?.data || err.message);
    const status = err.response?.status || 500;
    const payload = err.response?.data || { error: err.message };
    return NextResponse.json(payload, { status });
  }
}
