"use client";
import { useParams } from "next/navigation";
import ProductChatClient from "@/components/chat/ProductChatClient";

export default function Page() {
  const { chatId } = useParams();
  return <ProductChatClient chatId={chatId} />;
}
