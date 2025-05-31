// components/admin/OrdersClient.jsx
"use client";

import { useEffect, useState, useRef } from "react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import useAuth from "@/hooks/useAuth";
import { db } from "@/firebase/config";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function OrdersClient() {
  const { user, loading: authLoading } = useAuth();
  const [ordersByMethod, setOrdersByMethod] = useState({});
  const [seenNotifications, setSeenNotifications] = useState(new Set());
  const firstLoad = useRef(true);

  // Fetch initial snapshot of orders
  useEffect(() => {
    if (authLoading || !user || user.role !== "admin") return;

    const fetchOrders = async () => {
      const snapshot = await getDocs(collection(db, "orders"));
      const grouped = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.seconds
          ? new Date(data.createdAt.seconds * 1000).toLocaleString()
          : "Unknown";

        // Ensure totalAmount is treated as a number before formatting
        const amount = Number(data.totalAmount ?? 0);

        const order = {
          id: doc.id,
          transactionId: data.transactionId || "N/A",
          billNumber: data.billNumber || "N/A",
          totalAmount: amount.toFixed(2),
          orderStatus: data.orderStatus || "Pending",
          createdAt,
          paymentMethod: data.paymentMethod || "Unknown",
          userName: data.userName || "Unknown",
          userEmail: data.userEmail || "Unknown",
        };

        grouped[order.paymentMethod] = grouped[order.paymentMethod] || [];
        grouped[order.paymentMethod].push(order);
      });

      setOrdersByMethod(grouped);
      firstLoad.current = false;
    };

    fetchOrders().catch(console.error);
  }, [authLoading, user]);

  // Listen for payment updates and show toast on approvals
  useEffect(() => {
    if (authLoading || !user || user.role !== "admin") return;

    const unsub = onSnapshot(collection(db, "payments"), (snap) => {
      snap.docChanges().forEach(({ type, doc }) => {
        const bill = doc.id;
        const data = doc.data();

        setOrdersByMethod((prev) => {
          const next = {};
          for (const method in prev) {
            next[method] = prev[method].map((o) =>
              o.billNumber === bill
                ? { ...o, orderStatus: data.paymentStatus }
                : o
            );
          }
          return next;
        });

        if (
          !firstLoad.current &&
          (type === "added" || type === "modified") &&
          data.paymentStatus === "APPROVED" &&
          !seenNotifications.has(bill)
        ) {
          toast.success(`✅ Invoice #${bill} Approved!`);
          setSeenNotifications((s) => new Set(s).add(bill));
        }
      });
      firstLoad.current = false;
    });

    return () => unsub();
  }, [authLoading, user, seenNotifications]);

  // Show loading or unauthorized states
  if (authLoading) {
    return (
      <p className='py-10 text-center text-muted-foreground'>Authenticating…</p>
    );
  }
  if (!user || user.role !== "admin") {
    return <p className='py-10 text-center text-red-500'>❌ Not authorized.</p>;
  }

  const methods = Object.keys(ordersByMethod);
  if (methods.length === 0) {
    return (
      <p className='text-center text-muted-foreground py-10'>
        No orders found.
      </p>
    );
  }

  return (
    <div className='max-w-6xl mx-auto px-4 py-6'>
      <h2 className='text-2xl font-bold mb-6 text-[#2c6449] text-center'>
        All Orders
      </h2>

      {methods.map((method) => (
        <div key={method} className='mb-8'>
          <h3 className='text-lg font-semibold mb-3'>{method} Orders</h3>
          <div className='grid gap-4 sm:grid-cols-2 md:grid-cols-3'>
            {ordersByMethod[method].map((order) => {
              const isApproved = order.orderStatus === "APPROVED";
              return (
                <Card
                  key={order.id}
                  onClick={() =>
                    setSeenNotifications((s) => {
                      const next = new Set(s);
                      next.delete(order.billNumber);
                      return next;
                    })
                  }
                  className='cursor-pointer hover:shadow-md transition'
                >
                  <CardContent className='p-4'>
                    <p className='text-sm font-medium'>
                      <strong>Transaction ID:</strong> {order.transactionId}
                    </p>
                    <p className='text-sm'>
                      <strong>Bill #:</strong> {order.billNumber}
                    </p>
                    <p className='text-sm'>
                      <strong>User:</strong> {order.userName}
                    </p>
                    <p className='text-sm'>
                      <strong>Email:</strong> {order.userEmail}
                    </p>
                    <p className='text-sm'>
                      <strong>Method:</strong> {order.paymentMethod}
                    </p>
                    <p className='text-sm'>
                      <strong>Total:</strong> {order.totalAmount} SR
                    </p>
                    <p className='text-sm'>
                      <strong>Status:</strong>{" "}
                      <span
                        className={
                          isApproved
                            ? "text-green-600 font-semibold"
                            : "text-yellow-600"
                        }
                      >
                        {order.orderStatus}
                      </span>
                    </p>
                    <p className='text-sm mb-3'>
                      <strong>Date:</strong> {order.createdAt}
                    </p>
                    <Button
                      variant={isApproved ? "default" : "secondary"}
                      className='w-full'
                      asChild
                      disabled={!isApproved}
                    >
                      <Link href={`/review-invoice/${order.billNumber}`}>
                        Review Invoice
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
