"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import Link from "next/link";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

export default function SupplierMessages() {
  const { t } = useTranslation();
  const { user: currentUser, loading: authLoading } = useSelector(
    (s) => s.auth
  );
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;

    (async () => {
      try {
        const allChats = [];

        const chatSources = [
          {
            collectionName: "rfqChats",
            label: t("messages.labels.rfq"),
            buildPath: (id) => `/chat/rfq/${id}`,
          },
          {
            collectionName: "productChats",
            label: t("messages.labels.product"),
            buildPath: (id) => `/chat/product/${id}`,
          },
          {
            collectionName: "cartChats",
            label: t("messages.labels.cart"),
            buildPath: (id) => `/chat/cart/${id}`,
          },
          {
            collectionName: "orderChats",
            label: t("messages.labels.order"),
            buildPath: async (id, data) => {
              const billNumber = data.billNumber ?? "";
              let totalAmount = null;
              let orderStatus = null;
              if (billNumber) {
                const orderSnap = await getDoc(doc(db, "orders", billNumber));
                if (orderSnap.exists()) {
                  const od = orderSnap.data();
                  totalAmount = od.totalAmount;
                  orderStatus = od.orderStatus;
                }
              }
              const extra = encodeURIComponent(
                JSON.stringify({ billNumber, totalAmount, orderStatus })
              );
              return `/order-chat/${id}?extraData=${extra}`;
            },
          },
        ];

        for (const src of chatSources) {
          const q = query(
            collection(db, src.collectionName),
            where("supplierId", "==", currentUser.uid)
          );
          const snap = await getDocs(q);
          for (const docSnap of snap.docs) {
            const data = docSnap.data();
            let buyerName = t("messages.unknownBuyer");
            if (data.buyerId) {
              const buyerSnap = await getDoc(doc(db, "users", data.buyerId));
              if (buyerSnap.exists()) {
                buyerName = buyerSnap.data().name || buyerName;
              }
            }
            const path =
              typeof src.buildPath === "function"
                ? await src.buildPath(docSnap.id, data)
                : src.buildPath;
            allChats.push({
              id: docSnap.id,
              buyerName,
              concernType: src.label,
              chatPath: path,
            });
          }
        }

        setChats(allChats);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser, t]);

  if (authLoading) {
    return (
      <div className='flex items-center justify-center h-full py-20'>
        <Loader2 className='animate-spin h-6 w-6' />
      </div>
    );
  }
  if (currentUser?.role !== "supplier") {
    return <div className='p-6'>{t("common.notAuthorized")}</div>;
  }

  return (
    <div className='w-full max-w-6xl mx-auto px-4 py-6'>
      <Card className='p-4 sm:p-6'>
        <h2 className='text-xl font-semibold mb-4'>{t("messages.title")}</h2>

        {loading ? (
          <p className='text-center text-sm text-muted-foreground'>
            {t("messages.loading")}
          </p>
        ) : chats.length === 0 ? (
          <p className='text-center text-sm text-muted-foreground'>
            {t("messages.none")}
          </p>
        ) : (
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("messages.table.buyer")}</TableHead>
                  <TableHead>{t("messages.table.type")}</TableHead>
                  <TableHead>{t("messages.table.action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chats.map((chat) => (
                  <TableRow key={chat.id}>
                    <TableCell className='text-sm'>{chat.buyerName}</TableCell>
                    <TableCell className='text-sm'>
                      {chat.concernType}
                    </TableCell>
                    <TableCell>
                      <Link href={chat.chatPath} target='_blank' rel='noopener'>
                        <Button size='sm' className='bg-green-600 text-white'>
                          {t("messages.open")}
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
