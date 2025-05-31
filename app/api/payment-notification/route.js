// // app/api/payment-notification/route.js
// import { NextResponse } from "next/server";
// import admin from "firebase-admin";

// // ── Initialize Firebase Admin if not already done ─────────────
// if (!admin.apps.length) {
//   const serviceAccount = process.env.GCP_SERVICE_ACCOUNT_JSON
//     ? JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON)
//     : require("../../serviceAccountKey.json");
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
// }

// const db = admin.firestore();

// export async function POST(request) {
//   try {
//     const { billNumber, paymentStatus, paymentAmount, paymentDate } =
//       await request.json();

//     if (!billNumber || !paymentStatus) {
//       return NextResponse.json(
//         { error: "Missing fields: billNumber and paymentStatus are required" },
//         { status: 400 }
//       );
//     }

//     await db
//       .collection("payments")
//       .doc(billNumber)
//       .set(
//         {
//           paymentStatus,
//           paymentAmount: paymentAmount ?? 0,
//           paymentDate: paymentDate || new Date().toISOString(),
//           updatedAt: admin.firestore.FieldValue.serverTimestamp(),
//         },
//         { merge: true }
//       );

//     return NextResponse.json(
//       { status: 200, message: "Payment notification recorded" },
//       { status: 200 }
//     );
//   } catch (e) {
//     console.error("🔥 payment-notification error:", e);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }
