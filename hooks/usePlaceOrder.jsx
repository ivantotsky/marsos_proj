// hooks/usePlaceOrder.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { removeSupplierItems } from "@/store/cartSlice";

export const usePlaceOrder = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [isPlacing, setIsPlacing] = useState(false);

  const placeOrder = async (groupedItems, userId) => {
    if (!userId) {
      toast.error("You must be logged in to place an order.");
      return;
    }

    setIsPlacing(true);

    try {
      // 1️⃣ Write each supplier order
      for (const [supplierId, items] of Object.entries(groupedItems)) {
        const subtotal = items.reduce(
          (sum, item) => sum + (item.subtotal || 0),
          0
        );
        const shipping = items.reduce(
          (sum, item) => sum + (item.shippingCost || 0),
          0
        );
        const vat = Number(((subtotal + shipping) * 0.15).toFixed(2));
        const total = Number((subtotal + shipping + vat).toFixed(2));

        await addDoc(collection(db, "orders"), {
          buyerId: userId,
          supplierId,
          items,
          subtotal,
          shipping,
          vat,
          total,
          orderStatus: "pending",
          createdAt: serverTimestamp(),
        });

        // 2️⃣ Delete only this supplier’s items from Firestore
        const q = query(
          collection(db, "carts", userId, "items"),
          where("supplierId", "==", supplierId)
        );
        const snap = await getDocs(q);
        await Promise.all(
          snap.docs.map((d) =>
            deleteDoc(doc(db, "carts", userId, "items", d.id))
          )
        );

        // 3️⃣ Remove them from Redux
        dispatch(removeSupplierItems(supplierId));
      }

      toast.success("Order placed successfully!");
      router.push("/orders");
    } catch (error) {
      console.error("❌ Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  };

  return { placeOrder, isPlacing };
};
