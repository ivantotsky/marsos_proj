// components/buyer/orders/Orders.jsx
"use client";

import { useEffect, useState, useRef } from "react";
import useAuth from "@/hooks/useAuth";
import { db } from "@/firebase/config";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import Link from "next/link";
import { toast } from "sonner";

export default function BuyerOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const notifiedBills = useRef(new Set());
  const isFirstSnapshot = useRef(true);

  // 1️⃣ Load this buyer’s orders once
  useEffect(() => {
    if (authLoading || !user?.uid) return;

    async function fetchOrders() {
      const uid = user.uid;
      const snap = await getDocs(collection(db, "orders"));
      const filtered = [];

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const isBuyer =
          data.buyerId === uid ||
          data.customer?.uid === uid ||
          data.items?.some((it) => it.buyerId === uid);
        if (!isBuyer) return;

        const totalAmount = data.total ?? data.totalAmount ?? 0;
        const vat = data.vat ?? 0;
        const net = totalAmount - vat;
        const createdAt = data.createdAt?.seconds
          ? new Date(data.createdAt.seconds * 1000).toLocaleString()
          : typeof data.createdAt === "string"
          ? new Date(data.createdAt).toLocaleString()
          : "Unknown";

        filtered.push({
          id: docSnap.id,
          sadadNumber: data.sadadNumber || "N/A",
          billNumber: data.billNumber || "N/A",
          totalAmount,
          vat,
          net,
          orderStatus: data.orderStatus || "Pending",
          createdAt,
        });
      });

      setOrders(filtered);
      setLoading(false);
    }

    fetchOrders().catch((err) => {
      console.error("Error fetching orders:", err);
      setLoading(false);
    });
  }, [authLoading, user]);

  // 2️⃣ Listen for payment status changes, but skip the first batch
  useEffect(() => {
    if (!user?.uid) return;

    const unsub = onSnapshot(collection(db, "payments"), (snap) => {
      snap.docChanges().forEach((change) => {
        const bill = change.doc.id;
        const payment = change.doc.data();

        // Always update orderStatus in our list
        setOrders((prev) =>
          prev.map((o) =>
            o.billNumber === bill
              ? { ...o, orderStatus: payment.paymentStatus }
              : o
          )
        );

        // After initial load, notify on APPROVED once per bill
        if (
          !isFirstSnapshot.current &&
          (change.type === "added" || change.type === "modified") &&
          payment.paymentStatus === "APPROVED" &&
          !notifiedBills.current.has(bill) &&
          orders.some((o) => o.billNumber === bill)
        ) {
          toast.success(`✅ Payment approved for #${bill}`);
          notifiedBills.current.add(bill);
        }
      });
      isFirstSnapshot.current = false;
    });

    return () => unsub();
  }, [user, orders]);

  const renderStatusClass = (s) =>
    s === "APPROVED" ? "text-green-600 font-medium" : "text-yellow-600";

  // 3️⃣ Handle loading & no-auth
  if (authLoading || loading) {
    return (
      <div className='flex justify-center py-12'>
        <p className='text-sm text-muted-foreground'>Loading orders…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='text-center py-12'>
        <p className='text-red-600'>Please sign in to view your orders.</p>
      </div>
    );
  }

  return (
    <div className='max-w-6xl mx-auto p-6'>
      <h2 className='text-2xl font-semibold mb-6'>My Orders</h2>

      {orders.length === 0 ? (
        <p className='text-center text-sm text-muted-foreground'>
          No orders found.
        </p>
      ) : (
        <Card className='p-4'>
          {/* Desktop Table */}
          <div className='hidden md:block'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SADAD</TableHead>
                  <TableHead>Bill</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>VAT</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>{o.sadadNumber}</TableCell>
                    <TableCell>{o.billNumber}</TableCell>
                    <TableCell>{o.net.toFixed(2)} SR</TableCell>
                    <TableCell>{o.vat.toFixed(2)} SR</TableCell>
                    <TableCell>{o.totalAmount.toFixed(2)} SR</TableCell>
                    <TableCell className={renderStatusClass(o.orderStatus)}>
                      {o.orderStatus}
                    </TableCell>
                    <TableCell>{o.createdAt}</TableCell>
                    <TableCell>
                      <Link
                        href={
                          o.orderStatus === "APPROVED"
                            ? `/review-invoice/${o.billNumber}`
                            : "#"
                        }
                      >
                        <Button
                          size='sm'
                          variant={
                            o.orderStatus === "APPROVED"
                              ? "default"
                              : "secondary"
                          }
                          disabled={o.orderStatus !== "APPROVED"}
                        >
                          Review Invoice
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className='md:hidden space-y-4'>
            {orders.map((o) => (
              <Card key={o.id} className='p-4 shadow-md'>
                <h3 className='text-sm font-medium mb-2'>
                  Invoice:{" "}
                  <span className='text-muted-foreground'>{o.billNumber}</span>
                </h3>
                <p className='text-sm text-muted-foreground'>
                  SADAD: {o.sadadNumber}
                </p>
                <p className='text-sm text-muted-foreground'>
                  Net: {o.net.toFixed(2)} SR
                </p>
                <p className='text-sm text-muted-foreground'>
                  VAT: {o.vat.toFixed(2)} SR
                </p>
                <p className='text-sm text-muted-foreground mb-2'>
                  Total: {o.totalAmount.toFixed(2)} SR
                </p>
                <p className='text-sm text-muted-foreground mb-2'>
                  Status:{" "}
                  <span className={renderStatusClass(o.orderStatus)}>
                    {o.orderStatus}
                  </span>
                </p>
                <p className='text-sm text-muted-foreground mb-2'>
                  Date: {o.createdAt}
                </p>
                <Link
                  href={
                    o.orderStatus === "APPROVED"
                      ? `/review-invoice/${o.billNumber}`
                      : "#"
                  }
                >
                  <Button
                    size='sm'
                    className='w-full'
                    disabled={o.orderStatus !== "APPROVED"}
                  >
                    Review Invoice
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
