"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { clearSupplierCart } from "@/store/cartThunks";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const search = useSearchParams();
  const supplierId = search.get("supplierId");
  const router = useRouter();

  const dispatch = useDispatch();
  const userId = useSelector((s) => s.auth.user?.uid);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1️⃣ Clear the supplier's cart in Redux
  useEffect(() => {
    if (userId && supplierId) {
      dispatch(clearSupplierCart({ userId, supplierId }));
    }
  }, [userId, supplierId, dispatch]);

  // 2️⃣ Fetch the order from Firestore
  useEffect(() => {
    async function fetchOrder() {
      try {
        const ref = doc(db, "orders", orderId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setError("Order not found");
          setLoading(false);
          return;
        }
        setOrder(snap.data());
      } catch (e) {
        console.error(e);
        setError("Failed to load order");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p>Loading order…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center p-8'>
        <h1 className='text-2xl font-bold text-red-600 mb-4'>Error</h1>
        <p className='mb-6'>{error}</p>
        <button
          onClick={() => router.push("/")}
          className='px-4 py-2 bg-blue-600 text-white rounded'
        >
          Back to Home
        </button>
      </div>
    );
  }

  // Destructure with safe defaults
  const {
    transactionId,
    paymentMethod,
    orderStatus,
    totalAmount,
    cardBrand = "N/A",
    userName = "Guest Buyer",
    userEmail = "N/A",
    createdAt,
    items = [],
    billing = {},
  } = order;

  const {
    street1 = "N/A",
    city = "N/A",
    state = "N/A",
    postcode = "N/A",
  } = billing;

  return (
    <div className='max-w-2xl mx-auto p-8'>
      <h1 className='text-2xl font-bold mb-4'>Order Details</h1>

      <dl className='grid grid-cols-2 gap-x-4 gap-y-2 mb-6 text-sm'>
        <dt className='font-medium'>Order ID:</dt>
        <dd>{transactionId}</dd>
        <dt className='font-medium'>Status:</dt>
        <dd>{orderStatus}</dd>
        <dt className='font-medium'>Payment Method:</dt>
        <dd>{paymentMethod}</dd>
        <dt className='font-medium'>Total Amount:</dt>
        <dd>{totalAmount}</dd>
        <dt className='font-medium'>Card Brand:</dt>
        <dd>{cardBrand}</dd>
        <dt className='font-medium'>Customer:</dt>
        <dd>
          {userName} ({userEmail})
        </dd>
        <dt className='font-medium'>Ordered At:</dt>
        <dd>{createdAt?.toDate().toLocaleString() || "N/A"}</dd>
      </dl>

      <h2 className='text-xl font-semibold mt-6 mb-2'>Items</h2>
      {items.length > 0 ? (
        <ul className='space-y-2 mb-6'>
          {items.map((item, i) => (
            <li key={i} className='flex justify-between text-sm'>
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>
                {(
                  (item.price ?? 0) * (item.quantity ?? 0) +
                  (item.shippingCost ?? 0)
                ).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className='text-sm mb-6'>No items found.</p>
      )}

      <h2 className='text-xl font-semibold mt-6 mb-2'>Billing Address</h2>
      <p className='text-sm'>
        {street1}, {city}, {state}, {postcode}
      </p>

      <div className='mt-8'>
        <button
          onClick={() => router.push("/")}
          className='text-blue-600 hover:underline'
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
