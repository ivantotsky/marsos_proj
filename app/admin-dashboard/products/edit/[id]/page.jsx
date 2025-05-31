"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase/config";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CreatableSelect } from "@/components/ui/creatable-select";
import {
  defaultLocationOptions,
  defaultSizeOptions,
  defaultColorOptions,
  defaultQuantityOptions,
} from "@/lib/productOptions";

export default function AdminUploadProductForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useSelector(
    (state) => state.auth
  );

  // guard admin
  useEffect(() => {
    if (!authLoading && currentUser?.role !== "admin") {
      router.replace("/");
    }
  }, [authLoading, currentUser, router]);

  if (authLoading) {
    return (
      <div className='p-6 text-center'>
        <Loader2 className='animate-spin mx-auto' /> Checking permissions…
      </div>
    );
  }

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  // Basic Info
  const [nameEn, setNameEn] = useState("");
  const [descEn, setDescEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [descAr, setDescAr] = useState("");

  // Category / sub
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subCategoryMap, setSubCategoryMap] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);

  // Other details
  const [mainLocation, setMainLocation] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);

  // Images
  const [mainImageUrl, setMainImageUrl] = useState("");
  const [additionalImageUrls, setAdditionalImageUrls] = useState([]);

  // Pricing tiers
  const [priceTiers, setPriceTiers] = useState([]);

  // Fetch categories & product
  useEffect(() => {
    const fetchCategories = async () => {
      const snap = await getDocs(collection(db, "products"));
      const map = {};
      snap.forEach((docSnap) => {
        const { category, subCategory } = docSnap.data();
        if (!category) return;
        if (!map[category]) map[category] = new Set();
        if (subCategory) map[category].add(subCategory);
      });
      setCategoryOptions(
        Object.keys(map).map((cat) => ({ label: cat, value: cat }))
      );
      const subMap = {};
      for (const cat in map)
        subMap[cat] = [...map[cat]].map((s) => ({ label: s, value: s }));
      setSubCategoryMap(subMap);
    };

    const fetchProduct = async () => {
      if (!id) return;
      try {
        const snap = await getDoc(doc(db, "products", id));
        if (!snap.exists()) {
          toast.error("Product not found.");
          return router.push("/admin-dashboard/products");
        }
        const data = snap.data();
        setNameEn(data.productName?.en || "");
        setDescEn(data.description?.en || "");
        setNameAr(data.productName?.ar || "");
        setDescAr(data.description?.ar || "");
        setSelectedCategory(
          data.category ? { label: data.category, value: data.category } : null
        );
        setSelectedSubCategory(
          data.subCategory
            ? { label: data.subCategory, value: data.subCategory }
            : null
        );
        setMainLocation(
          data.mainLocation
            ? { label: data.mainLocation, value: data.mainLocation }
            : null
        );
        setSizes(
          Array.isArray(data.sizes)
            ? data.sizes.map((s) => ({ label: s, value: s }))
            : []
        );
        setColors(
          Array.isArray(data.colors)
            ? data.colors.map((c) => ({ label: c, value: c }))
            : []
        );
        setMainImageUrl(data.mainImageUrl || "");
        setAdditionalImageUrls(data.additionalImageUrls || []);
        const mapped = (data.priceRanges || []).map((r, tierIdx) => ({
          id: tierIdx,
          minQty:
            defaultQuantityOptions.find((o) => o.value === r.minQty) || null,
          maxQty:
            defaultQuantityOptions.find((o) => o.value === r.maxQty) || null,
          // <-- stringify r.price here
          price: defaultQuantityOptions.find(
            (o) => o.value === String(r.price)
          ) || {
            label: String(r.price),
            value: String(r.price),
          },
          deliveryLocations: (r.locations || []).map((loc, locIdx) => ({
            id: locIdx,
            // your location select
            location: defaultLocationOptions.find(
              (o) => o.value === loc.location
            ) || {
              label: loc.location,
              value: loc.location,
            },
            // <-- stringify loc.locationPrice here
            price: defaultQuantityOptions.find(
              (o) => o.value === String(loc.locationPrice)
            ) || {
              label: String(loc.locationPrice),
              value: String(loc.locationPrice),
            },
          })),
        }));
        setPriceTiers(mapped);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load product.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    fetchProduct();
  }, [id, router]);

  // Tier handlers
  const addTier = () =>
    setPriceTiers((prev) => [
      ...prev,
      {
        id: Date.now(),
        minQty: null,
        maxQty: null,
        price: null,
        deliveryLocations: [],
      },
    ]);
  const removeTier = (tid) =>
    setPriceTiers((prev) => prev.filter((t) => t.id !== tid));
  const updateTier = (tid, field, val) =>
    setPriceTiers((prev) =>
      prev.map((t) => (t.id === tid ? { ...t, [field]: val } : t))
    );
  const addLocation = (tid) =>
    setPriceTiers((prev) =>
      prev.map((t) =>
        t.id === tid
          ? {
              ...t,
              deliveryLocations: [
                ...t.deliveryLocations,
                { id: Date.now(), location: null, price: null },
              ],
            }
          : t
      )
    );
  const removeLocation = (tid, lid) =>
    setPriceTiers((prev) =>
      prev.map((t) =>
        t.id === tid
          ? {
              ...t,
              deliveryLocations: t.deliveryLocations.filter(
                (l) => l.id !== lid
              ),
            }
          : t
      )
    );
  const updateLocation = (tid, lid, field, val) =>
    setPriceTiers((prev) =>
      prev.map((t) =>
        t.id === tid
          ? {
              ...t,
              deliveryLocations: t.deliveryLocations.map((l) =>
                l.id === lid ? { ...l, [field]: val } : l
              ),
            }
          : t
      )
    );

  if (loading) return <p className='p-6 text-center'>Loading product…</p>;

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    toast.loading(isEditing ? "Saving…" : "Saving…", { id: "save" });
    const payload = {
      productName: { en: nameEn, ar: nameAr },
      description: { en: descEn, ar: descAr },
      category: selectedCategory?.value || "",
      subCategory: selectedSubCategory?.value || "",
      mainLocation: mainLocation?.value || "",
      sizes: sizes.map((o) => o.value),
      colors: colors.map((o) => o.value),
      mainImageUrl,
      additionalImageUrls,
      priceRanges: priceTiers.map((t) => ({
        minQty: t.minQty?.value || "",
        maxQty: t.maxQty?.value || "",
        price: t.price?.value || "",
        locations: t.deliveryLocations.map((l) => ({
          location: l.location?.value || "",
          locationPrice: l.price?.value || "",
        })),
      })),
      updatedAt: new Date(),
    };

    try {
      await updateDoc(doc(db, "products", id), payload);
      toast.success("Changes Saved!", { id: "save" });
      router.push("/admin-dashboard/products");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save. Please try again.", { id: "save" });
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='space-y-6 p-4 md:p-6 max-w-screen-lg mx-auto'
    >
      <h2 className='text-lg md:text-xl font-semibold'>
        {isEditing ? "Edit Product (Admin)" : "Upload Product (Admin)"}
      </h2>
      {/* Basic Info */}
      <div className='space-y-4'>
        <h3 className='text-base font-medium'>Basic Info</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Input
            placeholder='Name (EN)'
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
          />
          <Input
            placeholder='Description (EN)'
            value={descEn}
            onChange={(e) => setDescEn(e.target.value)}
          />
          <Input
            placeholder='Name (AR)'
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
          />
          <Input
            placeholder='Description (AR)'
            value={descAr}
            onChange={(e) => setDescAr(e.target.value)}
          />
        </div>
      </div>

      {/* Details */}
      <div className='space-y-4'>
        <h3 className='text-base font-medium'>Product Details</h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
          <CreatableSelect
            placeholder='Category'
            options={categoryOptions}
            value={selectedCategory}
            onChange={(opt) => {
              setSelectedCategory(opt);
              setSelectedSubCategory(null);
            }}
          />
          <CreatableSelect
            placeholder='Sub-category'
            options={
              selectedCategory ? subCategoryMap[selectedCategory.value] : []
            }
            value={selectedSubCategory}
            onChange={setSelectedSubCategory}
            isDisabled={!selectedCategory}
          />
          <CreatableSelect
            placeholder='Main Location'
            options={defaultLocationOptions}
            value={mainLocation}
            onChange={setMainLocation}
          />
          <CreatableSelect
            placeholder='Sizes'
            isMulti
            options={defaultSizeOptions}
            value={sizes}
            onChange={(o) => setSizes(o || [])}
          />
          <CreatableSelect
            placeholder='Colors'
            isMulti
            options={defaultColorOptions}
            value={colors}
            onChange={(o) => setColors(o || [])}
          />
        </div>
      </div>

      {/* Images */}
      <div className='space-y-2'>
        <h3 className='text-base font-medium'>Product Images</h3>
        {/* Main */}
        <div>
          <Label>Main Image</Label>
          {mainImageUrl && (
            <img
              src={mainImageUrl}
              className='mt-2 w-32 h-32 object-cover rounded'
            />
          )}
          <Input
            type='file'
            accept='image/*'
            onChange={(e) => {
              const f = e.target.files[0];
              if (!f) return;
              const reader = new FileReader();
              reader.onloadend = () => setMainImageUrl(reader.result);
              reader.readAsDataURL(f);
            }}
          />
        </div>
        {/* Additional */}
        <div>
          <Label>Additional Images</Label>
          {additionalImageUrls.map((url, idx) => (
            <div key={idx} className='flex items-center gap-2 my-2'>
              <img src={url} className='w-16 h-16 object-cover rounded' />
              <Button
                variant='ghost'
                type='button'
                className='text-red-600'
                onClick={() =>
                  setAdditionalImageUrls((prev) =>
                    prev.filter((_, i) => i !== idx)
                  )
                }
              >
                Remove
              </Button>
            </div>
          ))}
          <Input
            type='file'
            accept='image/*'
            onChange={(e) => {
              const f = e.target.files[0];
              if (!f) return;
              const reader = new FileReader();
              reader.onloadend = () =>
                setAdditionalImageUrls((prev) => [...prev, reader.result]);
              reader.readAsDataURL(f);
            }}
          />
        </div>
      </div>

      {/* Pricing */}
      <div className='border p-4 rounded space-y-6'>
        {priceTiers.map((tier) => (
          <div key={tier.id} className='space-y-4 border-b pb-4'>
            <div className='flex justify-between items-center'>
              <h4 className='font-medium'>Price Tier</h4>
              <Button
                variant='ghost'
                size='sm'
                className='text-red-600'
                onClick={() => removeTier(tier.id)}
              >
                Remove
              </Button>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
              <CreatableSelect
                placeholder='Min Qty'
                options={defaultQuantityOptions}
                value={tier.minQty}
                onChange={(opt) => updateTier(tier.id, "minQty", opt)}
              />
              <CreatableSelect
                placeholder='Max Qty'
                options={defaultQuantityOptions}
                value={tier.maxQty}
                onChange={(opt) => updateTier(tier.id, "maxQty", opt)}
              />
              <CreatableSelect
                placeholder='Price'
                options={defaultQuantityOptions}
                value={tier.price}
                onChange={(opt) => updateTier(tier.id, "price", opt)}
              />
            </div>
            <div>
              <Label>Delivery Locations</Label>
              {tier.deliveryLocations.map((loc) => (
                <div key={loc.id} className='flex items-center gap-2 my-2'>
                  <CreatableSelect
                    placeholder='Location'
                    options={defaultLocationOptions}
                    value={loc.location}
                    onChange={(opt) =>
                      updateLocation(tier.id, loc.id, "location", opt)
                    }
                  />
                  <CreatableSelect
                    placeholder='Price'
                    options={defaultQuantityOptions}
                    value={loc.price}
                    onChange={(opt) =>
                      updateLocation(tier.id, loc.id, "price", opt)
                    }
                  />
                  <Button
                    variant='ghost'
                    size='sm'
                    className='text-red-600'
                    onClick={() => removeLocation(tier.id, loc.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                variant='link'
                size='sm'
                onClick={() => addLocation(tier.id)}
              >
                + Add Location
              </Button>
            </div>
          </div>
        ))}
        <Button variant='outline' size='sm' onClick={addTier}>
          + Add Price Tier
        </Button>
      </div>

      {/* Submit */}
      <div className='text-center'>
        <Button
          type='submit'
          disabled={saving}
          className='flex items-center justify-center gap-2 w-full bg-[#2c6449] text-white'
        >
          {saving ? (
            <Loader2 className='animate-spin' size={16} />
          ) : isEditing ? (
            "Save Changes"
          ) : (
            "Upload Product"
          )}
        </Button>
      </div>
    </form>
  );
}
