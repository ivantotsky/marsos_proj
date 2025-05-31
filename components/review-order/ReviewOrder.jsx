// components/ReviewOrderModal.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  doc,
  getDoc,
  query,
  where,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { QRCodeCanvas } from "qrcode.react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import Currency from "@/components/global/CurrencySymbol";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ReviewOrderModal({ isOpen, onClose, supplierId }) {
  const currentUser = useSelector((s) => s.auth.user);
  const [cartItems, setCartItems] = useState([]);
  const [totals, setTotals] = useState({ subtotal: 0, vat: 0, grand: 0 });
  const [supplierInfo, setSupplierInfo] = useState(null);
  const [buyerInfo, setBuyerInfo] = useState(null);
  const { t } = useTranslation();

  const getCurrentDateTime = () => {
    const now = new Date();
    return `${now
      .toLocaleDateString("en-CA")
      .replace(/-/g, "/")} ${now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  useEffect(() => {
    if (!isOpen || !currentUser?.uid || !supplierId) return;
    (async () => {
      // 1) Load line items
      const itemsQ = query(
        collection(db, "carts", currentUser.uid, "items"),
        where("supplierId", "==", supplierId)
      );
      const snap = await getDocs(itemsQ);
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCartItems(items);

      // 2) Totals
      const subtotal = items.reduce(
        (s, i) => s + i.price * i.quantity + (i.shippingCost || 0),
        0
      );
      const vat = +(subtotal * 0.15).toFixed(2);
      setTotals({ subtotal, vat, grand: subtotal + vat });

      // 3) Buyer info
      const cartDoc = await getDoc(doc(db, "carts", currentUser.uid));
      if (cartDoc.exists()) {
        const data = cartDoc.data();
        if (data.buyerId) {
          const bSnap = await getDoc(doc(db, "users", data.buyerId));
          if (bSnap.exists()) setBuyerInfo(bSnap.data());
        }
      }

      // 4) Supplier info
      const sSnap = await getDoc(doc(db, "users", supplierId));
      if (sSnap.exists()) setSupplierInfo(sSnap.data());
    })();
  }, [isOpen, currentUser, supplierId]);

  const handlePrint = () => window.print();
  const handleCheckout = async () => {
    if (!currentUser || cartItems.length === 0) {
      alert(t("review_order.errors.empty_cart"));
      return;
    }
    const method = prompt(t("review_order.select_payment"));
    if (!method) return;
    try {
      const payload = {
        userId: currentUser.uid,
        supplierId,
        cartItems: cartItems.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
          discount: i.discount || 0,
          vat: "0.15",
        })),
        grandTotal: totals.grand,
        email: currentUser.email,
        name: buyerInfo?.name,
        phone: buyerInfo?.phone,
        paymentMethod: method,
      };
      const { data } = await axios.post("/api/checkout", payload);
      if (data.paymentUrl) window.location.href = data.paymentUrl;
      else alert(t("review_order.errors.no_url"));
    } catch {
      alert(t("review_order.errors.fetch_failed"));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className='fixed inset-0 bg-black/50 z-40' />

        {/* Full viewport width & height */}
        <DialogContent
          className='
            fixed inset-0 z-50 
            w-screen h-screen
            bg-white p-8
            overflow-y-auto
          '
        >
          <DialogHeader>
            <DialogTitle className='text-2xl'>
              🧾 {t("review_order.title")}
            </DialogTitle>
            <DialogDescription className='text-sm text-gray-500'>
              {t("review_order.subtitle")}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-8 mt-6'>
            {/* Header row */}
            <div className='flex justify-between items-center'>
              <img src='/logo.png' alt='Logo' className='h-12' />
              <div className='text-center'>
                <h5 className='font-semibold'>
                  {t("review_order.invoice.tax_invoice")}
                </h5>
                <div className='flex gap-4 mt-2'>
                  <div className='bg-gray-100 p-4 rounded'>
                    <div className='font-medium'>
                      {t("review_order.invoice.date_time")}
                    </div>
                    <div>{getCurrentDateTime()}</div>
                  </div>
                  <div className='bg-gray-100 p-4 rounded'>
                    <div className='font-medium'>
                      {t("review_order.invoice.serial_number")}
                    </div>
                    <div>{Date.now()}</div>
                  </div>
                </div>
              </div>
              <QRCodeCanvas value={window.location.href} size={120} />
            </div>

            {/* Supplier Info */}
            <section>
              <h3 className='text-xl font-semibold border-b pb-2'>
                Supplier Information
              </h3>
              <table className='w-full table-fixed text-sm mt-4'>
                <thead className='bg-gray-100'>
                  <tr>
                    <th className='p-3'>Supplier Name</th>
                    <th className='p-3'>Supplier Address</th>
                    <th className='p-3'>VAT Reg. No.</th>
                    <th className='p-3'>CR Reg.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className='bg-white'>
                    <td className='p-3'>{supplierInfo?.name || "—"}</td>
                    <td className='p-3'>{supplierInfo?.address || "—"}</td>
                    <td className='p-3'>{supplierInfo?.vatNumber || "—"}</td>
                    <td className='p-3'>{supplierInfo?.crNumber || "—"}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Buyer Info */}
            <section>
              <h3 className='text-xl font-semibold border-b pb-2'>
                Buyer Information
              </h3>
              <table className='w-full table-fixed text-sm mt-4'>
                <thead className='bg-gray-100'>
                  <tr>
                    <th className='p-3'>Buyer Name</th>
                    <th className='p-3'>Buyer Address</th>
                    <th className='p-3'>VAT Reg. No.</th>
                    <th className='p-3'>CR Reg.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className='bg-white'>
                    <td className='p-3'>{buyerInfo?.name || "—"}</td>
                    <td className='p-3'>{buyerInfo?.address || "—"}</td>
                    <td className='p-3'>{buyerInfo?.vatNumber || "—"}</td>
                    <td className='p-3'>{buyerInfo?.crNumber || "—"}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Product Details */}
            <section>
              <h3 className='text-xl font-semibold border-b pb-2'>
                Product Details
              </h3>
              <table className='w-full table-fixed text-sm mt-4'>
                <thead className='bg-gray-100'>
                  <tr>
                    <th className='p-3'>Product</th>
                    <th className='p-3'>Unit Price</th>
                    <th className='p-3'>Quantity</th>
                    <th className='p-3'>Shipping</th>
                    <th className='p-3'>Total excl. VAT</th>
                    <th className='p-3'>Tax Rate</th>
                    <th className='p-3'>Total incl. VAT</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((i) => {
                    const excl = i.quantity * i.price + (i.shippingCost || 0);
                    const taxAmt = excl * 0.15;
                    const incl = excl + taxAmt;
                    return (
                      <tr key={i.id} className='bg-white'>
                        <td className='p-3'>{i.name}</td>
                        <td className='p-3'>
                          <Currency amount={i.price} />
                        </td>
                        <td className='p-3'>{i.quantity}</td>
                        <td className='p-3'>
                          <Currency amount={i.shippingCost || 0} />
                        </td>
                        <td className='p-3'>
                          <Currency amount={excl} />
                        </td>
                        <td className='p-3'>15%</td>
                        <td className='p-3'>
                          <Currency amount={incl} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>

            {/* Totals */}
            <div className='flex justify-end space-x-12 mt-8 text-lg font-medium'>
              <div>
                Total: <Currency amount={totals.subtotal} />
              </div>
              <div>
                VAT (15%): <Currency amount={totals.vat} />
              </div>
              <div className='text-2xl font-semibold'>
                Grand Total: <Currency amount={totals.grand} />
              </div>
            </div>
          </div>

          <DialogFooter className='flex justify-end space-x-4 mt-10'>
            <Button variant='outline' onClick={handlePrint}>
              {t("review_order.actions.print")}
            </Button>
            <Button onClick={handleCheckout}>
              {t("review_order.actions.checkout")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
