// lib/fetchCart.js
import { db } from "@/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";

/**
 * Fetch all cart items under /carts/{userId}/items for a given supplier.
 */
export async function getCartForSupplier(userId, supplierId) {
  // Point at the subcollection for this user
  const itemsCol = collection(db, "carts", userId, "items");
  // Filter to only this supplier’s items
  const q = query(itemsCol, where("supplierId", "==", supplierId));
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const total = items.reduce(
    (sum, i) => sum + (i.subtotal ?? i.price * i.quantity),
    0
  );
  return { items, total };
}
