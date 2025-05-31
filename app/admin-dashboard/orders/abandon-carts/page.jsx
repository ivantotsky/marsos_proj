"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { db } from "@/firebase/config";
import { toast } from "sonner";

export default function AbandonedCartsPage() {
  const router = useRouter();

  // grab auth state from Redux
  const { user, loading: authLoading } = useSelector((state) => state.auth);
  const role = user?.role;

  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);

  // redirect non-admins
  useEffect(() => {
    if (!authLoading && (!user || role !== "admin")) {
      router.replace("/admin-login");
    }
  }, [authLoading, user, role, router]);

  // fetch abandoned carts
  useEffect(() => {
    if (authLoading || !user || role !== "admin") return;

    const fetchAbandoned = async () => {
      try {
        const snap = await getDocs(collection(db, "carts"));
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const nonEmpty = all.filter(
          (c) => Array.isArray(c.items) && c.items.length
        );
        setCarts(nonEmpty);
      } catch (e) {
        console.error(e);
        toast.error("Failed to fetch abandoned carts.");
      } finally {
        setLoading(false);
      }
    };

    fetchAbandoned();
  }, [authLoading, user, role]);

  if (loading) {
    return <p className='text-center py-6'>Loading abandoned carts…</p>;
  }

  return (
    <div className='max-w-5xl mx-auto px-4 py-6'>
      <h2 className='text-xl font-semibold text-[#2c6449] mb-4'>
        Abandoned Carts
      </h2>

      {carts.length === 0 ? (
        <p>No abandoned carts found.</p>
      ) : (
        <div className='space-y-4'>
          {carts.map((cart) => (
            <div
              key={cart.id}
              className='border rounded-md p-4 bg-white shadow-sm'
            >
              <h4 className='text-sm font-medium text-gray-800 mb-1'>
                Buyer ID: <span className='text-[#2c6449]'>{cart.buyerId}</span>
              </h4>
              <p className='text-xs text-gray-500 mb-2'>
                Last updated{" "}
                {cart.updatedAt?.toDate
                  ? formatDistanceToNow(cart.updatedAt.toDate(), {
                      addSuffix: true,
                    })
                  : "unknown"}
              </p>

              <ul className='list-disc ml-4 text-sm text-gray-700'>
                {cart.items.map((item, idx) => (
                  <li key={idx}>
                    {item.name} — Qty: {item.quantity}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
