// app/payment-details/page.jsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Currency from "@/components/global/CurrencySymbol";
import { db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";

export default function PaymentDetailsPage() {
  return (
    <Suspense fallback={<p className='p-6'>Loading…</p>}>
      <InnerPaymentDetailsPage />
    </Suspense>
  );
}

function InnerPaymentDetailsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setError("No order reference provided.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const snap = await getDoc(doc(db, "orders", orderId));
        if (!snap.exists()) throw new Error("Order not found");
        setOrder(snap.data());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  if (loading) return <p className='p-6'>Loading…</p>;

  if (error) {
    return (
      <div className='max-w-md mx-auto mt-12 text-center'>
        <h2 className='text-destructive text-xl font-semibold'>{error}</h2>
        <Button onClick={() => router.push("/orders")}>Go to Orders</Button>
      </div>
    );
  }

  return (
    <div className='max-w-md mx-auto mt-12 space-y-6'>
      <h2 className='text-success text-2xl font-semibold text-center'>
        Invoice Created!
      </h2>
      <Card className='p-6 shadow-lg'>
        <CardHeader>
          <CardTitle>🔢 Bill Number</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='font-bold text-xl'>{order.orderId}</p>

          <CardTitle className='mt-6'>💳 Payment Method</CardTitle>
          <p>{order.method.toUpperCase()}</p>

          <CardTitle className='mt-6'>💰 Amount Due</CardTitle>
          <Currency amount={order.total} />

          <CardTitle className='mt-6'>📦 Shipping</CardTitle>
          <Currency amount={order.shippingCost} />

          <CardTitle className='mt-6'>🧾 VAT (15%)</CardTitle>
          <Currency amount={order.vat} />

          <CardTitle className='mt-6'>👤 Billed To</CardTitle>
          <p className='text-sm'>{order.customer.name}</p>
          <p className='text-sm'>{order.customer.phone}</p>

          <Button
            variant='default'
            className='mt-8 w-full'
            onClick={() => router.push("/orders")}
          >
            View All Orders
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
