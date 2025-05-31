// /app/chat/product-details/[chatId]/page.jsx
"use client";

import { use } from "react";
import ProductDetailsChatClient from "@/components/chat/ProductDetailsChatClient";

export default function Page({ params }) {
  const { chatId } = use(params); // unwrap the params promise
  return <ProductDetailsChatClient chatId={chatId} />;
}
