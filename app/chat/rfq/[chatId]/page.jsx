// app/chat/rfq/[chatId]/page.jsx
"use client";
import { useParams } from "next/navigation";
import RfqChatClient from "@/components/chat/RfqChatClient";

export default function Page() {
  const { chatId } = useParams();
  return <RfqChatClient chatId={chatId} />;
}
