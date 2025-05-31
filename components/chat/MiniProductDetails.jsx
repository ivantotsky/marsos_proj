"use client";

import React, { useState, useEffect } from "react";
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useTranslation } from "react-i18next";
import Currency from "@/components/global/CurrencySymbol";
import { toast } from "sonner";

export default function MiniProductDetails({
  data,
  chatMeta,
  currentUser,
  chatId,
}) {
  // Fallback when no data
  if (!data) {
    return (
      <p className='text-center text-gray-500'>No product details available!</p>
    );
  }

  const { i18n } = useTranslation();
  const locale = i18n.language.startsWith("ar") ? "ar" : "en";
  const isSupplier = currentUser.uid === chatMeta.supplierId;

  // Local state for editing & selecting
  const [editable, setEditable] = useState(data);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(data.colors?.[0] || "");
  const [selectedSize, setSelectedSize] = useState(data.sizes?.[0] || "");
  const [selectedLocation, setSelectedLocation] = useState(
    data.priceRanges?.[0]?.locations?.[0]?.location || ""
  );
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Keep editable in sync if data prop changes
  useEffect(() => {
    setEditable(data);
  }, [data]);

  // Firestore updater helper
  const handleUpdate = async (path, value) => {
    const ref = doc(db, "miniProductsData", chatId);
    await updateDoc(ref, { [path]: value, lastEditedAt: serverTimestamp() });
    setEditable((cur) => {
      const copy = { ...cur };
      const parts = path.split(".");
      if (parts[0] === "priceRanges") {
        const idx = +parts[1];
        if (parts[2] === "price") copy.priceRanges[idx].price = value;
        else if (parts[2] === "locations")
          copy.priceRanges[idx].locations = value;
      }
      return copy;
    });
  };

  // Add to Cart & delete snapshot
  const handleAddToCart = async () => {
    if (!currentUser?.uid) {
      toast.error("Please log in to add to cart");
      return;
    }

    const tier0 = editable.priceRanges[0] || { price: "0", locations: [] };
    const unitPrice = parseFloat(tier0.price) || 0;
    const shipLoc =
      tier0.locations.find((l) => l.location === selectedLocation) || {};
    const shippingCost = parseFloat(shipLoc.locationPrice) || 0;
    const subtotal = quantity * unitPrice;

    try {
      await addDoc(collection(db, "carts", currentUser.uid, "items"), {
        buyerId: currentUser.uid,
        productId: editable.id,
        productName:
          typeof editable.productName === "string"
            ? editable.productName
            : editable.productName[locale] || editable.productName.en,
        productImage: editable.mainImageUrl,
        quantity,
        color: selectedColor,
        size: selectedSize,
        deliveryLocation: selectedLocation,
        price: unitPrice,
        shippingCost,
        subtotal,
        currency: locale === "ar" ? "SAR" : "USD",
        supplierId: editable.supplierId,
        supplierName: editable.supplierName,
        createdAt: serverTimestamp(),
      });

      // remove the mini‐snapshot
      await deleteDoc(doc(db, "miniProductsData", chatId));

      setOrderPlaced(true);
      toast.success("Your order has been added to the cart. Thank you!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add to cart");
    }
  };

  // After ordering, show thank‐you
  if (orderPlaced) {
    return (
      <div className='text-center text-gray-700'>
        Your order has been added to the cart. Thank you!
      </div>
    );
  }

  // Derive display
  const rawName = editable.productName;
  const name =
    typeof rawName === "string" ? rawName : rawName[locale] || rawName.en || "";
  const tier0 = editable.priceRanges[0] || { price: "0", locations: [] };
  const unitPrice = parseFloat(tier0.price) || 0;
  const shipTier =
    tier0.locations.find((l) => l.location === selectedLocation) || {};
  const shippingCost = parseFloat(shipTier.locationPrice) || 0;
  const subtotal = quantity * unitPrice;

  return (
    <div className='space-y-6'>
      {/* Title & Images */}
      <h2 className='text-lg font-semibold'>{name}</h2>
      <div className='flex space-x-4'>
        <img src={editable.mainImageUrl} alt={name} className='w-1/4 rounded' />
        <div className='flex space-x-2 overflow-x-auto'>
          {editable.additionalImageUrls.map((url, i) => (
            <img key={i} src={url} className='w-16 h-16 rounded' alt='' />
          ))}
        </div>
      </div>

      {/* Selectors */}
      <div className='flex gap-4'>
        <select
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
        >
          {editable.colors.map((c, i) => (
            <option key={i} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={selectedSize}
          onChange={(e) => setSelectedSize(e.target.value)}
        >
          {editable.sizes.map((s, i) => (
            <option key={i} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
        >
          {tier0.locations.map((l, i) => (
            <option key={i} value={l.location}>
              {l.location}
            </option>
          ))}
        </select>
      </div>

      {/* Summary */}
      <div className='space-y-4'>
        <div className='flex items-center gap-2 text-sm'>
          <span className='font-medium'>Qty:</span>
          <input
            type='number'
            min='1'
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
            className='w-16 border rounded px-2 py-1 text-sm'
          />
          <span>×</span>
          <span className='font-medium'>Price:</span>
          {isSupplier ? (
            <input
              type='number'
              value={unitPrice}
              onChange={(e) =>
                handleUpdate("priceRanges.0.price", e.target.value)
              }
              className='w-20 border rounded px-2 py-1 text-sm'
            />
          ) : (
            <Currency amount={unitPrice} />
          )}
        </div>

        <div className='flex justify-between items-center text-sm'>
          <p>
            <span className='font-medium'>Subtotal:</span>{" "}
            <Currency amount={subtotal} />
          </p>
          <p className='flex items-center gap-2'>
            <span className='font-medium'>Shipping:</span>
            {isSupplier ? (
              <input
                type='number'
                value={shippingCost}
                onChange={(e) => {
                  const newLocs = [...tier0.locations];
                  const idx = newLocs.findIndex(
                    (l) => l.location === selectedLocation
                  );
                  if (idx >= 0) newLocs[idx].locationPrice = e.target.value;
                  handleUpdate("priceRanges.0.locations", newLocs);
                }}
                className='w-20 border rounded px-2 py-1 text-sm'
              />
            ) : (
              <Currency amount={shippingCost} />
            )}
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className='flex gap-4'>
        <button
          onClick={handleAddToCart}
          className='bg-primary text-white px-4 py-2 rounded hover:bg-green-700'
        >
          Add to Cart
        </button>
        <button className='border border-gray-300 px-4 py-2 rounded hover:bg-gray-100'>
          Review Order
        </button>
      </div>
    </div>
  );
}
