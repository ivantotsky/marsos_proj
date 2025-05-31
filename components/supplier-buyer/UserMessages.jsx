"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase/config";
import {
  collection,
  query,
  where,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";

export default function UserMessages() {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribes = [];

    (async () => {
      // 1️⃣ Fetch current user's role
      const userSnap = await getDoc(doc(db, "users", currentUser.uid));
      if (!userSnap.exists()) {
        setLoading(false);
        return;
      }
      const role = userSnap.data().role;
      setUserRole(role);

      // 2️⃣ Define each chat source with correct App-Router path
      const chatSources = [
        {
          collectionName: "rfqChats",
          label: "RFQ Inquiry",
          pathBuilder: (id) => `/chat/rfq/${id}`,
          filterKey: role === "supplier" ? "supplierId" : "buyerId",
        },
        {
          collectionName: "productChats",
          label: "Product Inquiry",
          pathBuilder: (id) => `/chat/product/${id}`,
          filterKey: role === "supplier" ? "supplierId" : "buyerId",
        },
        {
          collectionName: "cartChats",
          label: "Cart Inquiry",
          pathBuilder: (id) => `/chat/cart/${id}`,
          filterKey: role === "supplier" ? "supplierId" : "buyerId",
        },
        {
          collectionName: "orderChats",
          label: "Order Inquiry",
          // order-chat lives at /order-chat/[chatId]
          pathBuilder: async (id, data) => {
            const billNumber = data.billNumber || "";
            let totalAmount = "",
              orderStatus = "";
            if (billNumber) {
              const oSnap = await getDoc(doc(db, "orders", billNumber));
              if (oSnap.exists()) {
                totalAmount = oSnap.data().totalAmount;
                orderStatus = oSnap.data().orderStatus;
              }
            }
            const extra = encodeURIComponent(
              JSON.stringify({ billNumber, totalAmount, orderStatus })
            );
            return `/order-chat/${id}?extraData=${extra}`;
          },
          filterKey: role === "supplier" ? "supplierId" : "buyerId",
        },
      ];

      // 3️⃣ Set up realtime listeners for each collection
      for (const src of chatSources) {
        const q = query(
          collection(db, src.collectionName),
          where(src.filterKey, "==", currentUser.uid)
        );
        const unsub = onSnapshot(q, async (snap) => {
          const updated = [];
          for (const docSnap of snap.docs) {
            const data = docSnap.data();
            const otherId =
              role === "supplier" ? data.buyerId : data.supplierId;

            // lookup counterparty name
            let otherName = "Unknown";
            if (otherId) {
              const uSnap = await getDoc(doc(db, "users", otherId));
              if (uSnap.exists()) otherName = uSnap.data().name;
            }

            const path =
              typeof src.pathBuilder === "function"
                ? await src.pathBuilder(docSnap.id, data)
                : src.pathBuilder;

            const lastUpdated = data.lastUpdated?.toDate?.() || new Date(0);
            const unread = !(data.readBy || []).includes(currentUser.uid);

            updated.push({
              id: docSnap.id,
              name: otherName,
              concernType: src.label,
              chatPath: path,
              lastUpdated,
              unread,
              collectionName: src.collectionName,
            });
          }

          setChats((prev) => {
            // remove old of this type, then add new, then sort
            const filtered = prev.filter((c) => c.concernType !== src.label);
            return [...filtered, ...updated].sort(
              (a, b) => b.lastUpdated - a.lastUpdated
            );
          });
        });
        unsubscribes.push(unsub);
      }

      setLoading(false);
      // cleanup on unmount
      return () => unsubscribes.forEach((u) => u());
    })();
  }, [currentUser]);

  const handleMarkAsRead = async (chatId, col) => {
    await updateDoc(doc(db, col, chatId), {
      readBy: arrayUnion(currentUser.uid),
    });
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unread: false } : c))
    );
  };

  if (loading) {
    return (
      <p className='text-center mt-6 text-sm text-muted-foreground'>
        Loading messages…
      </p>
    );
  }

  const badgeColors = {
    "RFQ Inquiry": "yellow",
    "Product Inquiry": "blue",
    "Cart Inquiry": "purple",
    "Order Inquiry": "green",
  };

  // apply search + type filter
  const filtered = chats.filter((c) => {
    return (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedType === "All" || c.concernType === selectedType)
    );
  });

  return (
    <div className='max-w-6xl mx-auto p-6 space-y-4'>
      <h2 className='text-2xl font-semibold'>Messages</h2>

      <div className='flex gap-4 flex-wrap'>
        <Input
          placeholder='Search by name…'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='w-64'
        />

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className='w-48'>
            <SelectValue placeholder='Filter by type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='All'>All Types</SelectItem>
            {Object.keys(badgeColors).map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className='rounded border'>
        <table className='min-w-full text-sm'>
          <thead className='bg-[#2c6449] text-white'>
            <tr>
              <th className='px-4 py-2 text-left'>
                {userRole === "supplier" ? "Buyer" : "Supplier"}
              </th>
              <th className='px-4 py-2 text-left'>Type</th>
              <th className='px-4 py-2 text-left'>Updated</th>
              <th className='px-4 py-2 text-left'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className={c.unread ? "bg-yellow-50" : ""}>
                <td className='px-4 py-2'>{c.name}</td>
                <td className='px-4 py-2'>
                  <Badge
                    variant='outline'
                    className={`text-${badgeColors[c.concernType]}-800`}
                  >
                    {c.concernType}
                  </Badge>
                </td>
                <td className='px-4 py-2'>{c.lastUpdated.toLocaleString()}</td>
                <td className='px-4 py-2 flex gap-2'>
                  <Link href={c.chatPath}>
                    <Button size='sm'>Open</Button>
                  </Link>
                  {c.unread && (
                    <Button
                      size='sm'
                      variant='outline'
                      className='text-xs border-yellow-400 text-yellow-800 hover:bg-yellow-100'
                      onClick={() => handleMarkAsRead(c.id, c.collectionName)}
                    >
                      Mark as Read
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>

      {filtered.length === 0 && (
        <p className='text-muted-foreground text-center mt-4 text-sm'>
          No messages found.
        </p>
      )}
    </div>
  );
}
