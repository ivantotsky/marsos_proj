// ─── FILE: app/payment-success/page.js ───
import { Suspense } from "react";
import PaymentSuccessClient from "./PaymentSuccessClient";

export const dynamic = "force-dynamic";

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<p className='p-6 text-center'>Loading…</p>}>
      <PaymentSuccessClient />
    </Suspense>
  );
}
