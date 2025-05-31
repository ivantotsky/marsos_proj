"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { getProductById } from "@/lib/getProductById";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import Currency from "@/components/global/CurrencySymbol";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { getLocalizedField } from "@/lib/getLocalizedField";
import { toast } from "sonner";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/config";
import Link from "next/link";

import { addOrUpdateCartItem } from "@/store/cartSlice";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();

  // ← Pull the user from Redux now
  const currentUser = useSelector((state) => state.auth.user);

  // ─── State & Memos ────────────────────────────────────────────────
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [qtyError, setQtyError] = useState("");

  const priceRanges = product?.priceRanges || [];

  const minQtyAllowed = useMemo(() => {
    const mins = priceRanges
      .map((r) => parseInt(r.minQty))
      .filter((n) => !isNaN(n))
      .sort((a, b) => a - b);
    return mins[0] || 1;
  }, [priceRanges]);

  const matchedTier = useMemo(() => {
    if (!priceRanges.length) return null;
    return (
      priceRanges.find(
        (r) =>
          r.minQty &&
          quantity >= parseInt(r.minQty) &&
          (!r.maxQty || quantity <= parseInt(r.maxQty))
      ) || priceRanges[0]
    );
  }, [priceRanges, quantity]);

  const isUnlimitedTier = useMemo(
    () => !!matchedTier && !matchedTier.maxQty,
    [matchedTier]
  );

  const hasValidNumericPrice = priceRanges.some(
    (r) => r.price !== undefined && !isNaN(Number(r.price))
  );

  const matchedPrice =
    hasValidNumericPrice && matchedTier?.price
      ? Number(matchedTier.price)
      : null;

  const matchedLocationPrice = useMemo(() => {
    if (!matchedTier || !deliveryLocation) return 0;
    const loc = (matchedTier.locations || []).find(
      (l) =>
        l.location?.trim().toLowerCase() ===
        deliveryLocation.trim().toLowerCase()
    );
    return loc ? Number(loc.locationPrice) : 0;
  }, [matchedTier, deliveryLocation]);

  const shippingCost = matchedLocationPrice;
  const subtotal =
    matchedPrice !== null && !isUnlimitedTier && !isNaN(quantity)
      ? matchedPrice * quantity
      : null;

  // ─── Effects ─────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const data = await getProductById(id);
      if (data) {
        setProduct(data);
        setSelectedImage(data.mainImageUrl);
      }
      setLoading(false);
    };
    if (id) load();
  }, [id]);

  useEffect(() => {
    if (product?.id) {
      router.prefetch(`/product/${product.id}`);
    }
  }, [product, router]);

  if (loading) {
    return (
      <div className='max-w-6xl mx-auto px-4 py-10'>
        <Skeleton className='h-[400px] w-full rounded-xl' />
        {/* …other skeletons */}
      </div>
    );
  }

  if (!product) {
    return (
      <div className='p-8 text-center text-red-600 font-semibold'>
        {t("product_card.not_found")}
      </div>
    );
  }

  // Localized fields
  const productName = getLocalizedField(
    product.productName,
    i18n.language,
    t("product_card.unnamed_product")
  );
  const description = getLocalizedField(
    product.description,
    i18n.language,
    t("product_card.no_description")
  );
  const category = product.category || t("uncategorized");

  const isOwner = currentUser?.uid === product.supplierId;

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    if (quantity < 1) return toast.error(t("product_card.alert_quantity"));
    if (product.sizes?.length && !selectedSize)
      return toast.error(t("product_card.alert_size"));
    if (product.colors?.length && !selectedColor)
      return toast.error(t("product_card.alert_color"));
    if (!deliveryLocation) return toast.error(t("product_card.alert_location"));
    if (!hasValidNumericPrice)
      return toast.warning(t("product_card.contact_for_price"));
    if (!currentUser) return toast.error(t("login_first"));

    dispatch(
      addOrUpdateCartItem({
        userId: currentUser.uid,
        item: {
          productId: id,
          productName,
          productImage: product.mainImageUrl,
          quantity,
          size: selectedSize,
          color: selectedColor,
          deliveryLocation,
          price: matchedPrice,
          shippingCost,
          subtotal,
          supplierId: product.supplierId,
          supplierName: product.supplierName,
          currency: product.currency || "SAR",
        },
      })
    )
      .unwrap()
      .then(() => toast.success(t("product_card.added_to_cart")))
      .catch(() => toast.error(t("product_card.cart_error")));
  };

  const handleContactSupplier = async () => {
    // you can still use Firebase Auth directly here if needed
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      return toast.error(t("login_first"));
    }
    if (!product.supplierId) {
      return toast.error(t("no_supplier"));
    }

    const chatId = `${user.uid}_${product.supplierId}_${id}`;
    const chatRef = doc(db, "productDetailsChats", chatId);
    const miniRef = doc(db, "miniProductsDetails", chatId);

    try {
      const snap = await getDoc(chatRef);
      if (!snap.exists()) {
        await setDoc(chatRef, {
          buyerId: user.uid,
          supplierId: product.supplierId,
          productId: id,
          participants: [user.uid, product.supplierId],
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
        });
      }
      await setDoc(
        miniRef,
        {
          productId: id,
          name: productName,
          mainImageUrl: product.mainImageUrl,
          category: product.category,
          priceRanges: product.priceRanges,
          supplierName: product.supplierName,
          timestamp: serverTimestamp(),
        },
        { merge: true }
      );

      router.push(
        `/chat/product-details/${chatId}?productId=${id}&supplierId=${product.supplierId}`
      );
    } catch (err) {
      console.error("ContactSupplier error:", err);
      toast.error(t("error_occurred"));
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div className='max-w-6xl mx-auto px-4 py-10'>
      <div className='flex flex-col md:flex-row gap-8'>
        {/* LEFT COLUMN */}
        <div className='w-full md:w-1/2 relative'>
          <img
            src={selectedImage || "https://via.placeholder.com/400"}
            alt={productName}
            className='rounded-xl border object-cover w-full h-[400px]'
          />
          {product.additionalImageUrls?.length > 0 && (
            <div className='mt-4 grid grid-cols-4 gap-1'>
              {[product.mainImageUrl, ...product.additionalImageUrls].map(
                (url, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(url)}
                    className={`border rounded overflow-hidden w-[100px] h-[100px] ${
                      selectedImage === url ? "ring-2 ring-[#2c6449]" : ""
                    }`}
                  >
                    <img src={url} className='object-cover w-full h-full' />
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className='flex-1'>
          <h1 className='text-2xl font-bold text-[#2c6449] mb-2 capitalize'>
            {productName}
          </h1>
          <p className='text-sm text-gray-500 mb-1 capitalize'>
            {t("product_card.category")}: {category}
          </p>
          <p className='text-sm text-gray-600 mb-4'>
            {t("product_card.supplier")}:
            <Link href={`/supplier/${product.supplierId}/products`}>
              <span className='ml-1 text-[#2c6449] hover:underline cursor-pointer'>
                {product.supplierName || "N/A"}
              </span>
            </Link>
          </p>

          {priceRanges?.length > 0 && (
            <div className='mb-4'>
              <p className='font-semibold text-sm text-gray-800 mb-2'>
                {t("product_card.pricing")}:
              </p>
              <div className='flex flex-wrap justify-start gap-x-12 gap-y-6'>
                {priceRanges.map((range, index) => {
                  const price = Number(range.price);
                  const isValidPrice = !isNaN(price) && price > 0;
                  const minQty = range.minQty ?? t("product_card.unknown");
                  const maxQty = range.maxQty;
                  const qtyDisplay = maxQty
                    ? `${minQty} - ${maxQty}`
                    : `${minQty} - ${t("product_card.unlimited")}`;

                  return (
                    <div key={index} className='text-center min-w-[100px]'>
                      {isValidPrice ? (
                        <p className='text-xl font-bold text-[#2c6449]'>
                          <Currency amount={price} />
                        </p>
                      ) : (
                        <p className='text-sm text-lime-700 font-medium'>
                          {t(
                            "product_card.negotiable_price",
                            "Pricing Negotiable - Contact Supplier"
                          )}
                        </p>
                      )}
                      <p className='text-sm text-gray-500 mt-1'>
                        {qtyDisplay} {t("product_card.pcs")}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity, Size, Color, Delivery Location */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                {t("product_card.quantity")}
              </label>
              <div className='flex items-center gap-2'>
                {/* “–” button (correct) */}
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </Button>
                <Input
                  type='number'
                  value={quantity}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 1);
                    setQuantity(val);
                    setQtyError(
                      val < minQtyAllowed
                        ? `${t("product_card.minimum_qty")} ${minQtyAllowed}`
                        : ""
                    );
                  }}
                  className='w-24 text-center'
                />

                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => {
                    // increment by 1
                    const newQty = quantity + 1;
                    setQuantity(newQty);
                    setQtyError(
                      newQty < minQtyAllowed
                        ? `${t("product_card.minimum_qty")} ${minQtyAllowed}`
                        : ""
                    );
                  }}
                >
                  +
                </Button>
              </div>
              {qtyError && (
                <p className='text-sm text-red-600 mt-1'>{qtyError}</p>
              )}
            </div>

            {/* Size */}
            {product.sizes?.filter(Boolean).length > 0 && (
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  {t("product_card.select_size")}
                </label>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger className='w-full'>
                    <SelectValue
                      placeholder={t("product_card.choose_option")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {product.sizes
                      .filter((size) => !!size)
                      .map((size, i) => (
                        <SelectItem key={i} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Color */}
            {product.colors?.filter(Boolean).length > 0 && (
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  {t("product_card.select_color")}
                </label>
                <Select value={selectedColor} onValueChange={setSelectedColor}>
                  <SelectTrigger className='w-full'>
                    <SelectValue
                      placeholder={t("product_card.choose_option")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {product.colors
                      .filter((color) => !!color)
                      .map((color, i) => (
                        <SelectItem key={i} value={color}>
                          {color}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Delivery Location */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                {t("product_card.delivery_location")}
              </label>
              <Select
                value={deliveryLocation}
                onValueChange={setDeliveryLocation}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder={t("product_card.choose_option")} />
                </SelectTrigger>
                <SelectContent>
                  {priceRanges
                    .flatMap((range) => range.locations || [])
                    .filter((loc) => !!loc.location)
                    .filter(
                      (loc, index, self) =>
                        index ===
                        self.findIndex((l) => l.location === loc.location)
                    )
                    .map((loc, i) => (
                      <SelectItem key={i} value={loc.location}>
                        {loc.location}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Costs */}
          {hasValidNumericPrice && matchedPrice !== null && (
            <div className='flex flex-wrap items-center justify-start gap-8 mt-6 text-sm'>
              <div className='text-gray-700'>
                <span className='font-medium'>
                  {t("product_card.shipping_cost")}:
                </span>{" "}
                <Currency amount={shippingCost} />
              </div>
              <div className='text-[#2c6449] font-semibold'>
                <span className='font-medium'>
                  {t("product_card.subtotal")}:
                </span>{" "}
                {subtotal !== null ? (
                  <Currency amount={subtotal} />
                ) : (
                  <span className='text-lime-700'>
                    {t(
                      "product_card.negotiable_price",
                      "Pricing Negotiable - Contact Supplier"
                    )}
                  </span>
                )}
              </div>
            </div>
          )}

          {isUnlimitedTier && (
            <p className='text-lime-700 text-sm font-medium mt-2'>
              {t(
                "product_card.negotiable_price",
                "Pricing Negotiable - Contact Supplier"
              )}
            </p>
          )}

          {isOwner ? (
            <p className='text-center text-primary text-xl italic mt-6'>
              {t("product_card.you_own")}
            </p>
          ) : (
            <div className='flex flex-wrap items-center gap-4 mt-4'>
              <Button
                onClick={handleAddToCart}
                disabled={quantity < minQtyAllowed}
              >
                {t("product_card.add_to_cart")}
              </Button>
              <Button
                variant='outline'
                className='text-[#2c6449] border-[#2c6449]'
                onClick={handleContactSupplier}
              >
                {t("product_card.contact_supplier")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className='mt-12 bg-white border rounded-xl shadow-sm p-6'>
        <Tabs defaultValue='description' className='w-full'>
          <TabsList className='flex space-x-4 border-b mb-4'>
            <TabsTrigger value='description'>
              {t("product_card.description")}
            </TabsTrigger>
            <TabsTrigger value='reviews'>
              {t("product_card.reviews")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value='description'>
            <p className='text-gray-700 whitespace-pre-line text-sm'>
              {description}
            </p>
          </TabsContent>
          <TabsContent value='reviews'>
            <p className='text-gray-600 italic text-sm'>
              {t("product_card.no_reviews")}
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
