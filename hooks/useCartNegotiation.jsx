"use client";

import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { db } from "@/firebase/config";
import { doc, setDoc, getDoc } from "firebase/firestore";

export function useCartNegotiation() {
  // pull `user` (or however you named it) from your auth slice
  const user = useSelector((state) => state.auth.user);
  const router = useRouter();

  const startNegotiation = async (supplierId, items) => {
    if (!user) {
      toast.error("Please login to negotiate.");
      return;
    }

    const chatId = `cart_${user.uid}_${supplierId}`;
    const chatRef = doc(db, "cartChats", chatId);

    try {
      const existingChat = await getDoc(chatRef);

      const cartSnapshot = items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        deliveryLocation: item.deliveryLocation,
        originalPrice: item.price,
        originalSubtotal: item.subtotal,
        shippingCost: item.shippingCost || 0,
        editedByBuyer: true,
      }));

      if (!existingChat.exists()) {
        await setDoc(chatRef, {
          buyerId: user.uid,
          supplierId,
          createdAt: new Date(),
          status: "pending",
          cartSnapshot,
        });
      } else {
        await setDoc(
          chatRef,
          {
            updatedAt: new Date(),
            cartSnapshot,
          },
          { merge: true }
        );
      }

      toast.success("Negotiation started with supplier.");
      router.push(`/chat/cart/${chatId}`);
    } catch (error) {
      console.error("❌ Negotiation chat error:", error);
      toast.error("Failed to initiate negotiation.");
    }
  };

  return { startNegotiation };
}
