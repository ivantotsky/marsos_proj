// /app/chat/cart/[chatId]/page.jsx
import { use } from "react"; // ✅ required to unwrap async resources
import CartChatClient from "@/components/chat/CartChatClient";

export default function Page({ params }) {
  const { chatId } = use(params); // ✅ unwrap the `params` Promise
  return <CartChatClient chatId={chatId} />;
}
