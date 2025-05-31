// components/chat/RfqChatClient.jsx
"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { useSelector } from "react-redux";
import { db } from "@/firebase/config";
import ChatMessages from "@/components/chat/ChatMessages";

export default function RfqChatClient({ chatId }) {
  // Read currentUser from Redux instead of useAuth()
  const currentUser = useSelector((state) => state.auth.user);

  const [chatMeta, setChatMeta] = useState(null);
  const [rfqList, setRfqList] = useState([]);

  // 1️⃣ Load chat metadata
  useEffect(() => {
    if (!chatId) return;
    getDoc(doc(db, "rfqChats", chatId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setChatMeta({
          ...data,
          createdAt: data.createdAt?.toDate()?.toISOString() || null,
        });
      }
    });
  }, [chatId]);

  // 2️⃣ Subscribe to all RFQs matching buyerId & supplierId
  useEffect(() => {
    if (!chatMeta?.buyerId || !chatMeta?.supplierId) return;

    const q = query(
      collection(db, "rfqs"),
      where("buyerId", "==", chatMeta.buyerId),
      where("supplierId", "==", chatMeta.supplierId)
    );

    const unsub = onSnapshot(q, (snap) => {
      setRfqList(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            timestamp: data.timestamp?.toDate?.().toISOString() || "",
          };
        })
      );
    });

    return () => unsub();
  }, [chatMeta]);

  if (!chatMeta) return null;

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 p-6 max-w-6xl mx-auto'>
      {/* RFQ Details Pane */}
      <aside className='col-span-1 border rounded p-4 bg-white space-y-4'>
        <h2 className='text-lg font-semibold text-[#2c6449]'>RFQ Details</h2>
        {rfqList.length === 0 ? (
          <p className='text-sm text-red-500'>No RFQ records found.</p>
        ) : (
          rfqList.map((item) => (
            <div key={item.id} className='border-b pb-2'>
              <p>
                <strong>Details:</strong> {item.productDetails}
              </p>
              <p>
                <strong>Category:</strong> {item.category}
              </p>
              <p>
                <strong>Subcategory:</strong> {item.subcategory}
              </p>
              <p>
                <strong>Size:</strong> {item.size}
              </p>
              <p>
                <strong>Color:</strong> {item.color}
              </p>
              <p>
                <strong>Shipping To:</strong> {item.shipping}
              </p>
              {item.fileURL && (
                <p>
                  <a
                    href={item.fileURL}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-600 underline text-sm'
                  >
                    Download Attachment
                  </a>
                </p>
              )}
              <p className='text-xs text-gray-500'>
                Sent: {new Date(item.timestamp).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </aside>

      {/* Chat Pane */}
      <section className='col-span-2 flex flex-col'>
        <h2 className='text-lg font-semibold mb-3 text-[#2c6449]'>
          Chat with Supplier
        </h2>
        <div className='h-[480px] pb-2 border rounded-lg overflow-hidden'>
          <ChatMessages chatId={chatId} chatMeta={chatMeta} />
        </div>
      </section>
    </div>
  );
}
