"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
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
  // Grab the current user and role from Redux
  const currentUser = useSelector((state) => state.auth.user);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");

  useEffect(() => {
    if (!currentUser) return;
    let unsubscribes = [];

    (async () => {
      // We already have user in Redux, so just pull role off it:
      setUserRole(currentUser.role);

      const sources = [
        {
          col: "rfqChats",
          label: "RFQ Inquiry",
          key: currentUser.role === "supplier" ? "supplierId" : "buyerId",
          path: (id) => `/chat/rfq/${id}`,
        },
        {
          col: "productChats",
          label: "Product Inquiry",
          key: currentUser.role === "supplier" ? "supplierId" : "buyerId",
          path: (id) => `/chat/product/${id}`,
        },
        {
          col: "cartChats",
          label: "Cart Inquiry",
          key: currentUser.role === "supplier" ? "supplierId" : "buyerId",
          path: (id) => `/chat/cart/${id}`,
        },
        {
          col: "orderChats",
          label: "Order Inquiry",
          key: currentUser.role === "supplier" ? "supplierId" : "buyerId",
          path: async (id, data) => {
            // fetch order extras
            const bill = data.billNumber;
            let extra = {};
            if (bill) {
              const oSnap = await getDoc(doc(db, "orders", bill));
              if (oSnap.exists()) {
                const od = oSnap.data();
                extra.totalAmount = od.totalAmount;
                extra.orderStatus = od.orderStatus;
              }
            }
            return (
              `/order-chat/${id}` +
              (bill ? `?data=${encodeURIComponent(JSON.stringify(extra))}` : "")
            );
          },
        },
      ];

      sources.forEach((src) => {
        const q = query(
          collection(db, src.col),
          where(src.key, "==", currentUser.uid)
        );

        const unsub = onSnapshot(q, async (snap) => {
          const updated = await Promise.all(
            snap.docs.map(async (d) => {
              const data = d.data();
              const otherId =
                currentUser.role === "supplier"
                  ? data.buyerId
                  : data.supplierId;

              // pull the other user's name
              let otherName = "Unknown";
              if (otherId) {
                const uSnap = await getDoc(doc(db, "users", otherId));
                if (uSnap.exists()) otherName = uSnap.data().name || "Unknown";
              }

              // build path
              const path =
                typeof src.path === "function"
                  ? await src.path(d.id, data)
                  : src.path;

              return {
                id: d.id,
                name: otherName,
                concernType: src.label,
                chatPath: path,
                lastUpdated: data.lastUpdated?.toDate() || new Date(0),
                unread: !(data.readBy || []).includes(currentUser.uid),
                collectionName: src.col,
              };
            })
          );

          setChats((prev) => {
            // remove any old entries of this type, then merge
            const filtered = prev.filter((c) => c.concernType !== src.label);
            return [...filtered, ...updated].sort(
              (a, b) => b.lastUpdated - a.lastUpdated
            );
          });
        });

        unsubscribes.push(unsub);
      });

      setLoading(false);
      return () => unsubscribes.forEach((u) => u());
    })();
  }, [currentUser]);

  const handleMarkAsRead = async (chatId, col) => {
    await updateDoc(doc(db, col, chatId), {
      readBy: arrayUnion(currentUser.uid),
    });
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              unread: false,
            }
          : c
      )
    );
  };

  const filtered = chats.filter((c) => {
    const matchesName = c.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType =
      selectedType === "All" || c.concernType === selectedType;
    return matchesName && matchesType;
  });

  if (loading || !userRole) {
    return <p className='text-center py-8'>Loading messages…</p>;
  }

  return (
    <div className='max-w-6xl mx-auto p-4 space-y-4'>
      <h1 className='text-2xl font-semibold'>Messages</h1>

      <div className='flex flex-col sm:flex-row gap-3'>
        <Input
          placeholder='Search by name…'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='flex-1'
        />
        <Select
          value={selectedType}
          onValueChange={setSelectedType}
          className='w-full sm:w-48'
        >
          <SelectTrigger>
            <SelectValue placeholder='All Types' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='All'>All Types</SelectItem>
            {[
              "RFQ Inquiry",
              "Product Inquiry",
              "Cart Inquiry",
              "Order Inquiry",
            ].map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Table */}
      <div className='hidden md:block border rounded'>
        <ScrollArea>
          <table className='min-w-full text-sm'>
            <thead className='bg-green-800 text-white'>
              <tr>
                <th className='px-4 py-2'>Name</th>
                <th className='px-4 py-2'>Concern Type</th>
                <th className='px-4 py-2'>Last Updated</th>
                <th className='px-4 py-2'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className={c.unread ? "bg-yellow-50" : "bg-white"}
                >
                  <td className='px-4 py-2'>{c.name}</td>
                  <td className='px-4 py-2'>
                    <Badge variant='outline'>{c.concernType}</Badge>
                  </td>
                  <td className='px-4 py-2'>
                    {c.lastUpdated.toLocaleString()}
                  </td>
                  <td className='px-4 py-2 space-x-2'>
                    <Link href={c.chatPath}>
                      <Button size='sm'>Open</Button>
                    </Link>
                    {c.unread && (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleMarkAsRead(c.id, c.collectionName)}
                      >
                        Mark read
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </div>

      {/* Mobile Cards */}
      <div className='space-y-3 md:hidden'>
        {filtered.map((c) => (
          <div
            key={c.id}
            className={`p-4 border rounded-lg ${
              c.unread ? "bg-yellow-50" : "bg-white"
            }`}
          >
            <div className='flex justify-between items-center'>
              <h2 className='font-medium'>{c.name}</h2>
              <Badge variant='outline'>{c.concernType}</Badge>
            </div>
            <p className='text-sm text-gray-500'>
              {c.lastUpdated.toLocaleString()}
            </p>
            <div className='mt-2 flex gap-2'>
              <Link href={c.chatPath}>
                <Button size='sm' className='flex-1'>
                  Open
                </Button>
              </Link>
              {c.unread && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => handleMarkAsRead(c.id, c.collectionName)}
                  className='flex-1'
                >
                  Mark read
                </Button>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className='text-center py-8 text-gray-500'>No messages found.</p>
        )}
      </div>
    </div>
  );
}
