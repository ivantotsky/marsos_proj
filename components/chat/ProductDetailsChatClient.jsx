"use client";

import React, { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatMiniProductSnapshot from "@/components/chat/ChatMiniProductSnapshot";
import { toast } from "sonner";

export default function ProductDetailsChatClient({ chatId }) {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useSelector(
    (s) => s.auth
  );

  const [chatMeta, setChatMeta] = useState(null);
  const [miniProduct, setMiniProduct] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notification, setNotification] = useState(null);

  // Load & subscribe to chat metadata
  useEffect(() => {
    if (authLoading || !currentUser || !chatId) return;

    const chatRef = doc(db, "productDetailsChats", chatId);

    getDoc(chatRef)
      .then((snap) => {
        if (!snap.exists()) {
          setNotification("Chat not found.");
        } else {
          const data = snap.data();
          setChatMeta(data);
          setMessages(data.messages || []);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Could not load chat.");
      });

    const unsub = onSnapshot(
      chatRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setChatMeta(data);
          setMessages(data.messages || []);
        }
      },
      (err) => {
        console.error(err);
        toast.error("Chat connection error.");
      }
    );

    return () => unsub();
  }, [authLoading, currentUser, chatId]);

  // Once we have chatMeta, enforce that only buyer or supplier can stay
  useEffect(() => {
    if (!chatMeta || !currentUser) return;

    const { buyerId, supplierId } = chatMeta;
    if (currentUser.uid !== buyerId && currentUser.uid !== supplierId) {
      // you can push to a generic “Not Authorized” page, or home
      router.replace("/unauthorized");
    }
  }, [chatMeta, currentUser, router]);

  // Load the product snapshot
  useEffect(() => {
    if (!chatId) return;
    const miniRef = doc(db, "miniProductsDetails", chatId);
    getDoc(miniRef)
      .then((snap) => {
        if (snap.exists()) {
          setMiniProduct(snap.data());
        } else {
          setNotification("Product snapshot not found.");
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Could not load product info.");
      });
  }, [chatId]);

  // Show loading until everything is ready
  if (authLoading || !currentUser || !chatMeta || !miniProduct) {
    return <p className='p-6 text-center text-gray-500'>Loading…</p>;
  }

  const isBuyer = currentUser.uid === chatMeta.buyerId;
  const otherLabel = isBuyer ? "Supplier" : "Buyer";

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 p-6 max-w-6xl mx-auto'>
      <aside className='col-span-1 border rounded p-4 bg-white space-y-4'>
        <h2 className='text-lg font-semibold text-[#2c6449]'>
          Product Details
        </h2>
        <ChatMiniProductSnapshot data={miniProduct} />
      </aside>

      <section className='col-span-2 flex flex-col'>
        {notification && (
          <div className='mb-2 p-2 bg-red-100 text-red-700 text-sm rounded'>
            {notification}
          </div>
        )}
        <h2 className='text-lg font-semibold mb-3 text-[#2c6449]'>
          Chat with {otherLabel}
        </h2>
        <div className='h-[480px] pb-2 border rounded-lg overflow-hidden'>
          <ChatMessages chatId={chatId} chatMeta={chatMeta} />
        </div>
      </section>
    </div>
  );
}
