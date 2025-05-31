"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLoading } from "@/context/LoadingContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { QRCodeCanvas } from "qrcode.react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const ReviewOrderModal = ({ isOpen, onClose, supplierId }) => {
  const { currentUser } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [vat, setVat] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [supplierInfo, setSupplierInfo] = useState(null);
  const [buyerInfo, setBuyerInfo] = useState(null);
  const { t } = useTranslation();

  const currencySymbol = t("review_order.currency", { defaultValue: "SR" });

  const getCurrentDateTime = () => {
    const now = new Date();
    return `${now
      .toLocaleDateString("en-CA")
      .replace(/-/g, "/")} ${now.toLocaleTimeString()}`;
  };

  useEffect(() => {
    if (!isOpen || !currentUser?.uid || !supplierId) return;

    const fetchData = async () => {
      startLoading();
      try {
        const cartRef = doc(db, "carts", currentUser.uid);
        const cartSnap = await getDoc(cartRef);

        if (cartSnap.exists()) {
          const cartData = cartSnap.data();
          const items = (cartData.items || []).filter(
            (item) => item.supplierId === supplierId
          );
          setCartItems(items);

          const total = items.reduce(
            (sum, item) =>
              sum + item.quantity * item.price + (item.shippingCost || 0),
            0
          );
          const vat = total * 0.15;
          const grand = total + vat;

          setTotal(total);
          setVat(vat);
          setGrandTotal(grand);

          const buyerId = cartData.buyerId;
          if (buyerId) {
            const buyerSnap = await getDoc(doc(db, "users", buyerId));
            if (buyerSnap.exists()) setBuyerInfo(buyerSnap.data());
          }
        }

        const supplierSnap = await getDoc(doc(db, "users", supplierId));
        if (supplierSnap.exists()) setSupplierInfo(supplierSnap.data());
      } catch (err) {
        console.error("Error fetching review modal data", err);
        setCartItems([]);
      } finally {
        stopLoading();
      }
    };

    fetchData();
  }, [isOpen, supplierId, currentUser, startLoading, stopLoading]);

  const handleCheckout = async () => {
    if (!currentUser || cartItems.length === 0) {
      alert(t("review_order.errors.empty_cart"));
      return;
    }

    const paymentMethods = ["Mada", "Visa", "Master", "Apple Pay"];
    const method = prompt(
      `Choose payment method:\n${paymentMethods.join("\n")}`
    );
    if (!method || !paymentMethods.includes(method))
      return alert("Invalid payment method selected.");

    const payload = {
      userId: currentUser.uid,
      supplierId,
      cartItems: cartItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        discount: item.discount || 0,
        discountType: "FIXED",
        vat: "0.15",
      })),
      grandTotal,
      email: currentUser.email,
      name: buyerInfo?.name || "Guest",
      phone: buyerInfo?.phone || "0000000000",
      paymentMethod: method,
    };

    try {
      const res = await axios.post(
        "http://localhost:5000/api/checkout",
        payload
      );
      if (res.data?.paymentUrl) window.location.href = res.data.paymentUrl;
      else alert("Missing payment URL");
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Checkout failed. Try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-5xl max-h-[90vh] p-4 overflow-hidden'>
        <DialogHeader>
          <DialogTitle className='text-base font-bold'>
            {t("review_order.title")}
          </DialogTitle>
          <DialogClose asChild>
            <button className='text-muted-foreground'>&times;</button>
          </DialogClose>
        </DialogHeader>

        <ScrollArea className='h-[70vh] pr-2'>
          {/* Logos */}
          <div className='flex justify-between items-center mb-4'>
            <Image src='/logo.png' alt='Logo' width={80} height={50} />
            {supplierInfo?.logoUrl && (
              <Image
                src={supplierInfo.logoUrl}
                alt='Supplier'
                width={150}
                height={100}
              />
            )}
          </div>

          {/* Invoice Details */}
          <div className='flex justify-between items-start gap-4 text-sm mb-4'>
            <div>
              <p>
                <strong>{t("review_order.invoice.date_time")}:</strong>{" "}
                {getCurrentDateTime()}
              </p>
              <p>
                <strong>{t("review_order.invoice.serial_number")}:</strong> N/A
              </p>
            </div>
            <QRCodeCanvas value='https://example.com/invoice' size={100} />
          </div>

          {/* Supplier Info */}
          <div className='mb-4'>
            <h4 className='font-semibold mb-1 text-sm'>
              {t("review_order.supplier_info.title")}
            </h4>
            <div className='text-xs grid grid-cols-2 md:grid-cols-4 gap-2'>
              <div>
                <strong>{t("review_order.supplier_info.name")}:</strong>{" "}
                {supplierInfo?.name || "-"}
              </div>
              <div>
                <strong>{t("review_order.supplier_info.address")}:</strong>{" "}
                {supplierInfo?.address || "-"}
              </div>
              <div>
                <strong>{t("review_order.supplier_info.vat_number")}:</strong>{" "}
                {supplierInfo?.vatNumber || "-"}
              </div>
              <div>
                <strong>{t("review_order.supplier_info.cr_number")}:</strong>{" "}
                {supplierInfo?.crNumber || "-"}
              </div>
            </div>
          </div>

          {/* Buyer Info */}
          <div className='mb-4'>
            <h4 className='font-semibold mb-1 text-sm'>
              {t("review_order.buyer_info.title")}
            </h4>
            <div className='text-xs grid grid-cols-2 md:grid-cols-4 gap-2'>
              <div>
                <strong>{t("review_order.buyer_info.name")}:</strong>{" "}
                {buyerInfo?.name || "-"}
              </div>
              <div>
                <strong>{t("review_order.buyer_info.address")}:</strong>{" "}
                {buyerInfo?.address || "-"}
              </div>
              <div>
                <strong>{t("review_order.buyer_info.vat_number")}:</strong>{" "}
                {buyerInfo?.vatNumber || "-"}
              </div>
              <div>
                <strong>{t("review_order.buyer_info.cr_number")}:</strong>{" "}
                {buyerInfo?.crNumber || "-"}
              </div>
            </div>
          </div>

          {/* Product Table */}
          <div className='overflow-x-auto'>
            <table className='min-w-full text-xs border border-gray-200'>
              <thead className='bg-gray-100 text-gray-600'>
                <tr>
                  <th className='p-2'>Image</th>
                  <th className='p-2'>Name</th>
                  <th className='p-2'>Unit Price</th>
                  <th className='p-2'>Qty</th>
                  <th className='p-2'>Shipping</th>
                  <th className='p-2'>Total excl. VAT</th>
                  <th className='p-2'>VAT</th>
                  <th className='p-2'>Total incl. VAT</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => {
                  const totalEx =
                    item.quantity * item.price + (item.shippingCost || 0);
                  const tax = totalEx * 0.15;
                  const totalInc = totalEx + tax;
                  return (
                    <tr key={item.cartId} className='border-t'>
                      <td className='p-2'>
                        <img
                          src={
                            item.mainImageUrl ||
                            "https://via.placeholder.com/40"
                          }
                          className='w-10 h-10 object-cover'
                        />
                      </td>
                      <td className='p-2'>{item.name}</td>
                      <td className='p-2'>
                        {currencySymbol} {item.price.toFixed(2)}
                      </td>
                      <td className='p-2'>{item.quantity}</td>
                      <td className='p-2'>
                        {currencySymbol} {item.shippingCost?.toFixed(2)}
                      </td>
                      <td className='p-2'>
                        {currencySymbol} {totalEx.toFixed(2)}
                      </td>
                      <td className='p-2'>15%</td>
                      <td className='p-2'>
                        {currencySymbol} {totalInc.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className='mt-4 space-y-1 text-sm font-medium'>
            <p>
              Total: {currencySymbol} {total.toFixed(2)}
            </p>
            <p>
              VAT (15%): {currencySymbol} {vat.toFixed(2)}
            </p>
            <p>
              Grand Total: {currencySymbol} {grandTotal.toFixed(2)}
            </p>
          </div>

          {/* Actions */}
          <div className='flex justify-end gap-2 mt-4'>
            <Button variant='secondary' onClick={() => window.print()}>
              {t("review_order.actions.print")}
            </Button>
            <Button onClick={handleCheckout}>
              {t("review_order.actions.checkout")}
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewOrderModal;
