// // app/api/settlement-notification/route.js
// import { NextResponse } from "next/server";
// import admin from "firebase-admin";

// // ── Initialize Firebase Admin if not already done ─────────────
// if (!admin.apps.length) {
//   const serviceAccount = process.env.FIREBASE_CREDENTIALS_BASE64
//     ? JSON.parse(process.env.FIREBASE_CREDENTIALS_BASE64)
//     : require("../../serviceAccountKey.json");
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
// }

// const db = admin.firestore();

// export async function POST(request) {
//   try {
//     const { billNumber, settlementStatus, paymentAmount, paymentDate, bankId } =
//       await request.json();

//     if (!billNumber || !settlementStatus) {
//       return NextResponse.json(
//         {
//           error: "Missing fields: billNumber and settlementStatus are required",
//         },
//         { status: 400 }
//       );
//     }

//     await db
//       .collection("settlements")
//       .doc(billNumber)
//       .set(
//         {
//           settlementStatus,
//           paymentAmount: paymentAmount ?? 0,
//           paymentDate: paymentDate || new Date().toISOString(),
//           bankId: bankId || "Unknown",
//           updatedAt: admin.firestore.FieldValue.serverTimestamp(),
//         },
//         { merge: true }
//       );

//     return NextResponse.json(
//       { status: 200, message: "Settlement notification recorded" },
//       { status: 200 }
//     );
//   } catch (e) {
//     console.error("🔥 settlement-notification error:", e);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }
