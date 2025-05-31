// app/orders/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
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
import { toast } from "sonner";
import Link from "next/link";

export default function BuyerOrdersPage() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // fetch only orders where the current user is the buyer
  useEffect(() => {
    async function fetchOrders() {
      if (!currentUser?.uid) return;
      const snap = await getDocs(collection(db, "orders"));
      const filtered = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.buyerId !== currentUser.uid) return;

        const createdAt = data.createdAt?.seconds
          ? new Date(data.createdAt.seconds * 1000).toLocaleString()
          : "Unknown";

        filtered.push({
          id: docSnap.id,
          sadadNumber: data.sadadNumber || "N/A",
          billNumber: data.billNumber || "N/A",
          totalAmount: data.total || 0,
          vat: data.vat || 0,
          orderStatus: data.orderStatus || "Pending",
          createdAt,
        });
      });
      setOrders(filtered);
      setLoading(false);
    }
    fetchOrders();
  }, [currentUser]);

  // listen for payment status updates
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "payments"), (snap) => {
      snap.docChanges().forEach((change) => {
        const payment = change.doc.data();
        const bill = change.doc.id;

        setOrders((prev) =>
          prev.map((o) =>
            o.billNumber === bill
              ? { ...o, orderStatus: payment.paymentStatus }
              : o
          )
        );

        if (
          (change.type === "added" || change.type === "modified") &&
          payment.paymentStatus === "APPROVED"
        ) {
          toast.success(`✅ Payment approved for #${bill}`);
        }
      });
    });
    return () => unsub();
  }, []);

  const renderStatusClass = (s) =>
    s === "APPROVED" ? "text-green-600 font-medium" : "text-yellow-600";

  return (
    <div className='max-w-6xl mx-auto p-6'>
      <h2 className='text-2xl font-semibold mb-6'>My Orders</h2>

      {loading ? (
        <p className='text-center text-sm text-muted-foreground'>
          Loading orders…
        </p>
      ) : orders.length === 0 ? (
        <p className='text-center text-sm text-muted-foreground'>
          No orders found.
        </p>
      ) : (
        <Card className='p-4'>
          {/* desktop table */}
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
                {orders.map((o) => {
                  const net = o.totalAmount - o.vat;
                  return (
                    <TableRow key={o.id}>
                      <TableCell>{o.sadadNumber}</TableCell>
                      <TableCell>{o.billNumber}</TableCell>
                      <TableCell>{net.toFixed(2)} SR</TableCell>
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
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* mobile cards */}
          <div className='md:hidden space-y-4'>
            {orders.map((o) => {
              const net = o.totalAmount - o.vat;
              return (
                <Card key={o.id} className='p-4 shadow-md'>
                  <h3 className='text-sm font-medium mb-2'>
                    Invoice:{" "}
                    <span className='text-muted-foreground'>
                      {o.billNumber}
                    </span>
                  </h3>
                  <p className='text-sm text-muted-foreground'>
                    SADAD: {o.sadadNumber}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Net: {net.toFixed(2)} SR
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
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
