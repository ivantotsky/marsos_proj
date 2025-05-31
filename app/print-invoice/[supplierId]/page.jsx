// app/print-invoice/[supplierId]/page.jsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useParams } from "next/navigation";
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
import Currency from "@/components/global/CurrencySymbol";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function PrintInvoicePage() {
  const { supplierId } = useParams();
  const currentUser = useSelector((s) => s.auth.user);
  const uid = currentUser?.uid;
  const containerRef = useRef();

  const [supplier, setSupplier] = useState({});
  const [buyer, setBuyer] = useState({});
  const [items, setItems] = useState([]);
  const [totals, setTotals] = useState({ sub: 0, vat: 0, grand: 0 });

  const now = new Date();
  const formattedDate = now.toLocaleDateString("en-CA").replace(/-/g, "/");
  const formattedTime = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  useEffect(() => {
    if (!uid || !supplierId) return;
    (async () => {
      const itemsQ = query(
        collection(db, "carts", uid, "items"),
        where("supplierId", "==", supplierId)
      );
      const snap = await getDocs(itemsQ);
      const loaded = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(loaded);

      const sub = loaded.reduce(
        (a, i) => a + i.price * i.quantity + (i.shippingCost || 0),
        0
      );
      const vat = +(sub * 0.15).toFixed(2);
      setTotals({ sub, vat, grand: sub + vat });

      const cartDoc = await getDoc(doc(db, "carts", uid));
      if (cartDoc.exists()) {
        const data = cartDoc.data();
        if (data.buyerId) {
          const bSnap = await getDoc(doc(db, "users", data.buyerId));
          if (bSnap.exists()) setBuyer(bSnap.data());
        }
      }

      const sSnap = await getDoc(doc(db, "users", supplierId));
      if (sSnap.exists()) setSupplier(sSnap.data());
    })();
  }, [uid, supplierId]);

  const handlePrint = () => window.print();

  const handleDownload = async () => {
    if (!containerRef.current) return;

    // 1) Clone the node so we don't mutate the real one
    const clone = containerRef.current.cloneNode(true);
    // absolutely position it offscreen so styles still apply
    clone.style.position = "fixed";
    clone.style.top = "-9999px";
    clone.style.left = "-9999px";
    document.body.appendChild(clone);

    // 2) Find & strip all Tailwind bg-* classes by inlining a white background
    clone.querySelectorAll("[class*='bg-']").forEach((el) => {
      el.style.backgroundColor = "#fff";
    });
    // Ensure the root is white too
    clone.style.backgroundColor = "#fff";

    try {
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: null, // we set inline, so let html2canvas pick it up
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`invoice_${supplierId}.pdf`);
    } catch (err) {
      console.error("Download failed:", err);
      // fallback to print dialog
      window.print();
    } finally {
      // 3) Clean up our offscreen clone
      document.body.removeChild(clone);
    }
  };

  return (
    <div
      ref={containerRef}
      className='w-[70vw] mx-auto min-h-screen p-4 bg-white text-gray-800 text-xs print:w-[100vw] print:p-0'
    >
      {/* Header */}
      <header className='flex justify-between items-center mb-6'>
        <img src='/logo.png' alt='Logo' className='h-20' />
        <div className='text-center text-sm'>
          <div className='font-semibold'>Tax Invoice</div>
          <div className='mt-2 flex space-x-2'>
            <div className='border px-2 py-1'>
              <div>Date &amp; Time</div>
              <div>
                {formattedDate} {formattedTime}
              </div>
            </div>
            <div className='border px-2 py-1'>
              <div>Invoice #</div>
              <div>{Date.now()}</div>
            </div>
          </div>
        </div>
        <QRCodeCanvas value={window.location.href} size={80} />
      </header>

      {/* Supplier Info */}
      <section className='mb-4'>
        <h2 className='text-sm font-semibold border-b pb-1 mb-2'>
          Supplier Information
        </h2>
        <table className='w-full table-fixed border-collapse text-xs'>
          <thead>
            <tr className='bg-gray-100'>
              <th className='border px-2 py-1 text-left'>Name</th>
              <th className='border px-2 py-1 text-left'>Address</th>
              <th className='border px-2 py-1 text-left'>VAT No.</th>
              <th className='border px-2 py-1 text-left'>CR No.</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className='border px-2 py-1'>{supplier.name || "—"}</td>
              <td className='border px-2 py-1'>{supplier.address || "—"}</td>
              <td className='border px-2 py-1'>{supplier.vatNumber || "—"}</td>
              <td className='border px-2 py-1'>{supplier.crNumber || "—"}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Buyer Info */}
      <section className='mb-4'>
        <h2 className='text-sm font-semibold border-b pb-1 mb-2'>
          Buyer Information
        </h2>
        <table className='w-full table-fixed border-collapse text-xs'>
          <thead>
            <tr className='bg-gray-100'>
              <th className='border px-2 py-1 text-left'>Name</th>
              <th className='border px-2 py-1 text-left'>Address</th>
              <th className='border px-2 py-1 text-left'>VAT No.</th>
              <th className='border px-2 py-1 text-left'>CR No.</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className='border px-2 py-1'>{buyer.name || "—"}</td>
              <td className='border px-2 py-1'>{buyer.address || "—"}</td>
              <td className='border px-2 py-1'>{buyer.vatNumber || "—"}</td>
              <td className='border px-2 py-1'>{buyer.crNumber || "—"}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Product Details */}
      <section className='mb-4'>
        <h2 className='text-sm font-semibold border-b pb-1 mb-2'>
          Product Details
        </h2>
        <table className='w-full table-fixed border-collapse text-xs'>
          <thead>
            <tr className='bg-gray-100'>
              <th className='border px-2 py-1 text-left'>Image</th>
              <th className='border px-2 py-1 text-left'>Product Name</th>
              <th className='border px-2 py-1 text-left'>Unit Price</th>
              <th className='border px-2 py-1 text-left'>Qty</th>
              <th className='border px-2 py-1 text-left'>Ship</th>
              <th className='border px-2 py-1 text-left'>Total Excl.</th>
              <th className='border px-2 py-1 text-left'>Tax</th>
              <th className='border px-2 py-1 text-left'>Total Incl.</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => {
              const excl = i.quantity * i.price + (i.shippingCost || 0);
              const taxAmt = excl * 0.15;
              const incl = excl + taxAmt;
              return (
                <tr key={i.id}>
                  <td className='border px-2 py-1'>
                    <img
                      src={i.productImage || "/placeholder.png"}
                      alt={i.productName}
                      className='h-6 w-6 object-cover'
                    />
                  </td>
                  <td className='border px-2 py-1'>{i.productName}</td>
                  <td className='border px-2 py-1'>
                    <Currency amount={i.price} />
                  </td>
                  <td className='border px-2 py-1'>{i.quantity}</td>
                  <td className='border px-2 py-1'>
                    <Currency amount={i.shippingCost || 0} />
                  </td>
                  <td className='border px-2 py-1'>
                    <Currency amount={excl} />
                  </td>
                  <td className='border px-2 py-1'>15%</td>
                  <td className='border px-2 py-1'>
                    <Currency amount={incl} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Totals */}
      <footer className='text-right space-y-1 text-xs mb-4'>
        <div>
          Total: <Currency amount={totals.sub} />
        </div>
        <div>
          VAT (15%): <Currency amount={totals.vat} />
        </div>
        <div className='text-sm font-semibold'>
          Grand Total: <Currency amount={totals.grand} />
        </div>
      </footer>

      {/* Terms & Conditions */}
      <section className='mt-4 text-sm leading-tight mb-6'>
        <h3 className='font-semibold mb-1'>Terms &amp; Conditions</h3>
        <ul className='list-disc list-inside space-y-1'>
          <li>Payment due within 30 days from the invoice date.</li>
          <li>Goods remain the property of the supplier until paid in full.</li>
          <li>All disputes must be reported within 7 days of delivery.</li>
          <li>Late payment may incur a 5% monthly surcharge.</li>
        </ul>
      </section>

      {/* Buttons right under Terms & Conditions */}
      <div className='flex justify-end space-x-2 print:hidden mt-4'>
        <Button variant='outline' size='sm' onClick={handleDownload}>
          Download PDF
        </Button>
        <Button size='sm' onClick={handlePrint}>
          Print
        </Button>
      </div>
    </div>
  );
}
