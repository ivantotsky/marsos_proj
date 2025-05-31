"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { saveCardToken } from "@/store/checkoutSlice";
import { toast } from "sonner";

export default function PaymentSuccessClient() {
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useSearchParams();

  const supplierId = params.get("supplierId");
  const registrationId = params.get("id");
  const userId = useSelector((s) => s.auth.user?.uid);
  const [status, setStatus] = useState("processing");

  useEffect(() => {
    if (!registrationId || !supplierId || !userId) {
      setStatus("error");
      return;
    }
    dispatch(saveCardToken({ supplierId, token: registrationId }))
      .unwrap()
      .then(() => {
        toast.success("Card saved!");
        setStatus("success");
        setTimeout(() => router.push("/checkout"), 1500);
      })
      .catch((err) => {
        console.error("Save card failed:", err);
        toast.error(`Could not save card: ${err}`);
        setStatus("error");
      });
  }, [registrationId, supplierId, userId, dispatch, router]);

  if (status === "processing")
    return <p className='p-6 text-center'>Saving your card, please wait…</p>;
  if (status === "success")
    return (
      <p className='p-6 text-center text-green-600'>Card saved! Redirecting…</p>
    );
  return (
    <p className='p-6 text-center text-red-600'>
      There was an error saving your card.
    </p>
  );
}
