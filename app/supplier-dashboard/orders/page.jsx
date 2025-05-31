"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { db } from "@/firebase/config";
import { useSelector } from "react-redux";
import { collection, getDocs, onSnapshot, doc } from "firebase/firestore";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

export default function SupplierOrdersPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useSelector(
    (s) => s.auth
  );

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredOrderId, setHoveredOrderId] = useState(null);
  const [notifiedBills, setNotifiedBills] = useState(new Set());

  // fetch orders once
  useEffect(() => {
    if (!currentUser?.uid) return;
    (async () => {
      const snap = await getDocs(collection(db, "orders"));
      const filtered = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data.items?.some((i) => i.supplierId === currentUser.uid)) return;

        let createdAt = t("orders.unknownDate");
        if (data.createdAt?.seconds) {
          createdAt = new Date(data.createdAt.seconds * 1000).toLocaleString();
        } else if (data.createdAt) {
          createdAt = new Date(data.createdAt).toLocaleString();
        }

        const billNumber = data.billNumber || data.orderId || t("orders.na");
        const sadadNumber = data.sadadNumber || t("orders.na");

        const rawTotal = data.totalAmount ?? data.total ?? 0;
        const total =
          typeof rawTotal === "string" ? parseFloat(rawTotal) : rawTotal;

        const rawVat = data.vat ?? 0;
        const vat = typeof rawVat === "string" ? parseFloat(rawVat) : rawVat;

        const net = total - vat;
        const status = data.paymentStatus || data.orderStatus || "PENDING";

        const buyerId =
          data.buyerId || data.customer?.uid || data.items[0]?.buyerId;

        filtered.push({
          id: docSnap.id,
          sadadNumber,
          billNumber,
          total,
          vat,
          net,
          status,
          createdAt,
          buyerId,
        });
      });
      setOrders(filtered);
      setLoading(false);
    })();
  }, [currentUser, t]);

  // listen payments
  useEffect(() => {
    let first = true;
    const unsub = onSnapshot(collection(db, "payments"), (snap) => {
      snap.docChanges().forEach((chg) => {
        const bill = chg.doc.id;
        const payment = chg.doc.data();
        setOrders((prev) =>
          prev.map((o) =>
            o.billNumber === bill ? { ...o, status: payment.paymentStatus } : o
          )
        );
        if (
          !first &&
          payment.paymentStatus === "APPROVED" &&
          !notifiedBills.has(bill) &&
          orders.some((o) => o.billNumber === bill)
        ) {
          toast.success(
            `${t("orders.paymentApproved")} #${bill}: ${
              payment.paymentAmount
            } SR`
          );
          setNotifiedBills((s) => new Set(s).add(bill));
        }
      });
      first = false;
    });
    return () => unsub();
  }, [orders, notifiedBills, t]);

  const goToChat = (order) => {
    const chatId = `order_${order.buyerId}_${currentUser.uid}`;
    const extra = encodeURIComponent(
      JSON.stringify({
        billNumber: order.billNumber,
        total: order.total,
        status: order.status,
      })
    );
    router.push(`/order-chat/${chatId}?extraData=${extra}`);
  };

  const statusClass = (s) =>
    s === "APPROVED" ? "text-green-600 font-medium" : "text-yellow-600";

  if (authLoading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <Loader2 className='animate-spin h-6 w-6' />
      </div>
    );
  }

  return (
    <div className='w-full max-w-6xl mx-auto px-4 py-6'>
      <h2 className='text-2xl font-semibold mb-6'>{t("orders.title")}</h2>

      {loading ? (
        <p className='text-center text-sm text-muted-foreground'>
          {t("orders.loading")}
        </p>
      ) : orders.length === 0 ? (
        <p className='text-center text-sm text-muted-foreground'>
          {t("orders.none")}
        </p>
      ) : (
        <>
          {/* Desktop */}
          <div className='hidden md:block'>
            <Card className='p-4'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("orders.sadad")}</TableHead>
                    <TableHead>{t("orders.bill")}</TableHead>
                    <TableHead>{t("orders.net")}</TableHead>
                    <TableHead>{t("orders.fee")}</TableHead>
                    <TableHead>{t("orders.total")}</TableHead>
                    <TableHead>{t("orders.status")}</TableHead>
                    <TableHead>{t("orders.date")}</TableHead>
                    <TableHead>{t("orders.actions")}</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>{o.sadadNumber}</TableCell>
                      <TableCell>{o.billNumber}</TableCell>
                      <TableCell>{o.net.toFixed(2)} SR</TableCell>
                      <TableCell>0.00 SR</TableCell>
                      <TableCell>{o.total.toFixed(2)} SR</TableCell>
                      <TableCell className={statusClass(o.status)}>
                        {t(`orders.statuses.${o.status.toLowerCase()}`)}
                      </TableCell>
                      <TableCell>{o.createdAt}</TableCell>
                      <TableCell className='space-x-2'>
                        <Link
                          href={
                            o.status === "APPROVED"
                              ? `/review-invoice/${o.billNumber}`
                              : "#"
                          }
                        >
                          <Button
                            size='sm'
                            variant={
                              o.status === "APPROVED" ? "default" : "secondary"
                            }
                            disabled={o.status !== "APPROVED"}
                          >
                            {t("orders.reviewInvoice")}
                          </Button>
                        </Link>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => goToChat(o)}
                          onMouseEnter={() => setHoveredOrderId(o.id)}
                          onMouseLeave={() => setHoveredOrderId(null)}
                          className={`transition ${
                            hoveredOrderId === o.id
                              ? "bg-[#2c6449] text-white"
                              : ""
                          } border-[#2c6449] text-[#2c6449]`}
                        >
                          {t("orders.contactBuyer")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Mobile */}
          <div className='md:hidden space-y-4'>
            {orders.map((o) => (
              <Card key={o.id} className='p-4 shadow-md'>
                <h3 className='text-sm font-medium mb-2'>
                  {t("orders.invoice")}{" "}
                  <span className='text-muted-foreground'>{o.billNumber}</span>
                </h3>
                <p className='text-sm text-muted-foreground'>
                  {t("orders.sadad")}: {o.sadadNumber}
                </p>
                <p className='text-sm text-muted-foreground'>
                  {t("orders.net")}: {o.net.toFixed(2)} SR
                </p>
                <p className='text-sm text-muted-foreground'>
                  {t("orders.fee")}: 0.00 SR
                </p>
                <p className='text-sm text-muted-foreground'>
                  {t("orders.total")}: {o.total.toFixed(2)} SR
                </p>
                <p className='text-sm text-muted-foreground'>
                  {t("orders.status")}:{" "}
                  <span className={statusClass(o.status)}>
                    {t(`orders.statuses.${o.status.toLowerCase()}`)}
                  </span>
                </p>
                <p className='text-sm text-muted-foreground mb-2'>
                  {t("orders.date")}: {o.createdAt}
                </p>
                <Link
                  href={
                    o.status === "APPROVED"
                      ? `/review-invoice/${o.billNumber}`
                      : "#"
                  }
                >
                  <Button
                    size='sm'
                    className='w-full mb-2'
                    disabled={o.status !== "APPROVED"}
                  >
                    {t("orders.reviewInvoice")}
                  </Button>
                </Link>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => goToChat(o)}
                  onMouseEnter={() => setHoveredOrderId(o.id)}
                  onMouseLeave={() => setHoveredOrderId(null)}
                  className={`w-full ${
                    hoveredOrderId === o.id ? "bg-[#2c6449] text-white" : ""
                  } border-[#2c6449] text-[#2c6449]`}
                >
                  {t("orders.contactBuyer")}
                </Button>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
