"use client";

import React from "react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

export default function UploadProductForm() {
  const { id } = useParams(); // get the product ID from URL
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Basic Info
  const [nameEn, setNameEn] = useState("");
  const [descEn, setDescEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [descAr, setDescAr] = useState("");

  // Details
  // 1) All category options
  const [categoryOptions, setCategoryOptions] = useState([]);
  // 2) Map of sub-options per category
  const [subCategoryMap, setSubCategoryMap] = useState({});
  // 3) Which category/subcategory is selected
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);

  const [mainLocation, setMainLocation] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);

  // after: const [colors, setColors] = useState([]);
  const [mainImageUrl, setMainImageUrl] = useState("");
  const [additionalImageUrls, setAdditionalImageUrls] = useState([]);

  // After your other state hooks:
  const [priceTiers, setPriceTiers] = useState([]);

  // Add a new empty tier
  const addTier = () => {
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
  };

  // Remove a tier by id
  const removeTier = (tierId) => {
    setPriceTiers((prev) => prev.filter((t) => t.id !== tierId));
  };

  // Update a field on a tier
  const updateTier = (tierId, field, value) => {
    setPriceTiers((prev) =>
      prev.map((t) => (t.id === tierId ? { ...t, [field]: value } : t))
    );
  };

  // Add a delivery location to a tier
  const addLocation = (tierId) => {
    setPriceTiers((prev) =>
      prev.map((t) =>
        t.id === tierId
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
  };

  // Remove a location from a tier
  const removeLocation = (tierId, locId) => {
    setPriceTiers((prev) =>
      prev.map((t) =>
        t.id === tierId
          ? {
              ...t,
              deliveryLocations: t.deliveryLocations.filter(
                (l) => l.id !== locId
              ),
            }
          : t
      )
    );
  };

  // Update a field on a location
  const updateLocation = (tierId, locId, field, value) => {
    setPriceTiers((prev) =>
      prev.map((t) =>
        t.id === tierId
          ? {
              ...t,
              deliveryLocations: t.deliveryLocations.map((l) =>
                l.id === locId ? { ...l, [field]: value } : l
              ),
            }
          : t
      )
    );
  };

  useEffect(() => {
    // grab every product, collect distinct category & subCategory
    const fetchCategories = async () => {
      const snap = await getDocs(collection(db, "products"));
      const map = {};
      snap.forEach((docSnap) => {
        const { category, subCategory } = docSnap.data();
        if (!category) return;
        if (!map[category]) map[category] = new Set();
        if (subCategory) map[category].add(subCategory);
      });

      // build arrays for your select options
      setCategoryOptions(
        Object.keys(map).map((cat) => ({ label: cat, value: cat }))
      );
      const subMap = {};
      for (const cat in map) {
        subMap[cat] = [...map[cat]].map((sub) => ({
          label: sub,
          value: sub,
        }));
      }
      setSubCategoryMap(subMap);
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      const snap = await getDoc(doc(db, "products", id));
      if (!snap.exists()) return;
      const data = snap.data();

      // Basic Info
      setNameEn(data.productName?.en || "");
      setDescEn(data.description?.en || "");
      setNameAr(data.productName?.ar || "");
      setDescAr(data.description?.ar || "");

      // Details
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

      // Firestore stores priceRanges like:
      // [
      //   { minQty: "1", maxQty: "10", price: "100", locations: [{ location: "Riyadh", locationPrice: "120" }, …] },
      //   …
      /// ]
      const fetched = data.priceRanges || [];
      // Map into the shape your UI wants:
      // - give each tier & location a unique id
      // - convert strings into option objects where needed
      const mapped = fetched.map((r, tierIdx) => ({
        id: tierIdx,
        minQty:
          defaultQuantityOptions.find((o) => o.value === r.minQty) || null,
        maxQty:
          defaultQuantityOptions.find((o) => o.value === r.maxQty) || null,
        price: defaultQuantityOptions.find((o) => o.value === r.price) || null,
        deliveryLocations: (r.locations || []).map((loc, locIdx) => ({
          id: locIdx,
          location: defaultLocationOptions.find(
            (o) => o.value === loc.location
          ) || { label: loc.location, value: loc.location },
          price: defaultQuantityOptions.find(
            (o) => o.value === loc.locationPrice.toString()
          ) || {
            label: loc.locationPrice.toString(),
            value: loc.locationPrice.toString(),
          },
        })),
      }));
      setPriceTiers(mapped);

      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return <p className='p-6 text-center'>Loading product…</p>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    toast.loading("Saving…", { id: "save" });

    // Build the payload
    const updated = {
      productName: { en: nameEn, ar: nameAr },
      description: { en: descEn, ar: descAr },
      category: selectedCategory?.value || "",
      subCategory: selectedSubCategory?.value || "",
      mainLocation: mainLocation?.value || "",
      sizes: sizes.map((o) => o.value),
      colors: colors.map((o) => o.value),
      mainImageUrl,
      additionalImageUrls,
      priceRanges: priceTiers.map((tier) => ({
        minQty: tier.minQty?.value || "",
        maxQty: tier.maxQty?.value || "",
        price: tier.price?.value || "",
        locations: tier.deliveryLocations.map((loc) => ({
          location: loc.location?.value || "",
          locationPrice: loc.price?.value || "",
        })),
      })),
      updatedAt: new Date(),
    };

    try {
      await updateDoc(doc(db, "products", id), updated);
      toast.success("Changes Saved!", { id: "save" });
      setSaving(false);
    } catch (err) {
      toast.error("Failed to save. Please try again.", { id: "save" });
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='space-y-6 p-4 md:p-6 max-w-screen-lg mx-auto'
    >
      {/* Basic Info */}
      <div className='space-y-4'>
        <h2 className='text-lg md:text-xl font-semibold'>Basic Info</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
          <Input value={descEn} onChange={(e) => setDescEn(e.target.value)} />
          <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
          <Input value={descAr} onChange={(e) => setDescAr(e.target.value)} />
        </div>
      </div>

      {/* Product Details */}
      <div className='space-y-4'>
        <h2 className='text-lg md:text-xl font-semibold'>Product Details</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
          {/* Category */}
          <CreatableSelect
            placeholder='Select or Create a Category'
            options={categoryOptions}
            value={selectedCategory}
            onChange={(opt) => {
              setSelectedCategory(opt);
              setSelectedSubCategory(null); // clear sub-category whenever category changes
            }}
          />

          {/* Sub-category */}
          <CreatableSelect
            placeholder='Select or Create a Subcategory'
            options={
              selectedCategory
                ? subCategoryMap[selectedCategory.value] || []
                : []
            }
            value={selectedSubCategory}
            onChange={setSelectedSubCategory}
            isDisabled={!selectedCategory}
          />
          <CreatableSelect
            placeholder='Main Location'
            options={defaultLocationOptions}
            value={mainLocation}
            onChange={(opt) => setMainLocation(opt)}
          />
          <CreatableSelect
            placeholder='Select Size(s)'
            isMulti
            options={defaultSizeOptions}
            value={sizes}
            onChange={(opts) => setSizes(opts || [])}
          />
          <CreatableSelect
            placeholder='Select Color(s)'
            isMulti
            options={defaultColorOptions}
            value={colors}
            onChange={(opts) => setColors(opts || [])}
          />
        </div>
      </div>

      {/* Images */}
      <div className='space-y-2'>
        <h2 className='text-lg md:text-xl font-semibold'>Product Images</h2>
        <div className='flex flex-col gap-4 md:flex-row md:items-start'>
          {/* Main Image */}
          <div className='flex flex-col gap-1 w-full md:w-1/3'>
            <Label className='text-sm'>Main Image</Label>

            {/* Preview */}
            {mainImageUrl && (
              <img
                src={mainImageUrl}
                alt='Main Preview'
                className='mb-2 w-32 h-32 object-cover rounded border'
              />
            )}

            <Input
              type='file'
              accept='image/*'
              className='file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-green-600'
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onloadend = () => setMainImageUrl(reader.result);
                reader.readAsDataURL(file);
              }}
            />
          </div>

          {/* Additional Images */}
          <div className='flex-1 flex flex-col gap-2'>
            <Label className='text-sm'>Additional Images</Label>

            {/* Existing previews */}
            {additionalImageUrls.map((url, idx) => (
              <div key={idx} className='flex items-center gap-2'>
                <img
                  src={url}
                  alt={`Additional ${idx}`}
                  className='w-16 h-16 object-cover rounded border'
                />
                <Button
                  variant='ghost'
                  className='text-red-600'
                  type='button'
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

            {/* New file input */}
            <div className='flex items-center gap-2'>
              <Input
                type='file'
                accept='image/*'
                className='file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-green-600'
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onloadend = () =>
                    setAdditionalImageUrls((prev) => [...prev, reader.result]);
                  reader.readAsDataURL(file);
                }}
              />
            </div>

            <Button variant='link' size='sm'>
              + Add Additional Images
            </Button>
            <p className='text-xs text-muted-foreground'>
              You can upload up to 3 additional images.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className='border p-4 rounded-md space-y-4'>
        {priceTiers.map((tier) => (
          <div key={tier.id} className='space-y-4 border-b pb-4'>
            <div className='flex justify-between items-center'>
              <h3 className='text-base font-medium'>Price Tier</h3>
              <Button
                variant='ghost'
                className='text-red-600'
                onClick={() => removeTier(tier.id)}
              >
                Remove
              </Button>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
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
                <div
                  key={loc.id}
                  className='flex flex-col sm:flex-row sm:items-center gap-2 my-2'
                >
                  <div className='w-full sm:w-1/2 md:w-1/3'>
                    <CreatableSelect
                      placeholder='Location'
                      options={defaultLocationOptions}
                      value={loc.location}
                      onChange={(opt) =>
                        updateLocation(tier.id, loc.id, "location", opt)
                      }
                    />
                  </div>
                  <div className='w-36'>
                    <CreatableSelect
                      placeholder='Price'
                      options={defaultQuantityOptions}
                      value={loc.price}
                      onChange={(opt) =>
                        updateLocation(tier.id, loc.id, "price", opt)
                      }
                    />
                  </div>
                  <Button
                    variant='ghost'
                    className='text-red-600'
                    onClick={() => removeLocation(tier.id, loc.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button variant='link' onClick={() => addLocation(tier.id)}>
                + Add Location
              </Button>
            </div>
          </div>
        ))}

        <Button variant='outline' onClick={addTier}>
          + Add Price Tier
        </Button>
      </div>

      {/* Submit Button */}
      <div className='sticky bottom-0 bg-white py-4 px-4 md:px-0'>
        <Button type='submit' disabled={saving} className='w-full …'>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
