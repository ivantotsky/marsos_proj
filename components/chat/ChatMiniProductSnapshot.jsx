"use client";

import React from "react";
import Currency from "@/components/global/CurrencySymbol";

export default function ChatMiniProductSnapshot({ data }) {
  return (
    <div className='space-y-2'>
      <img src={data.mainImageUrl} alt={data.name} className='w-full rounded' />
      <h3 className='font-semibold'>{data.name}</h3>
      <p className='text-sm text-gray-600'>{data.category}</p>
      {data.priceRanges?.map((r, i) => (
        <div key={i} className='flex justify-between text-sm'>
          <span>
            {r.minQty}
            {r.maxQty ? `–${r.maxQty}` : "+"} pcs
          </span>
          {r.price && <Currency amount={Number(r.price)} />}
        </div>
      ))}
      <p className='text-xs text-gray-500'>Supplier: {data.supplierName}</p>
    </div>
  );
}
