"use client";

import { useState, useEffect } from "react";

import { doc, getDoc, getDocs, collection, addDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

import { toast } from "sonner";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
import { useSelector } from "react-redux";
import useProductValidation from "@/hooks/useProductValidation";
import { useRouter } from "next/navigation";

import { generateSlug, ensureUniqueSlug } from "@/utils/slugify";

export default function UploadProductForm() {
  const { user: currentUser, loading: authLoading } = useSelector(
    (state) => state.auth
  );

  const router = useRouter();

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subCategoryMap, setSubCategoryMap] = useState({}); // grouped by category

  const { validateProduct } = useProductValidation();

  // Basic product fields
  const [productNameEn, setProductNameEn] = useState("");
  const [productDescriptionEn, setProductDescriptionEn] = useState("");
  const [productNameAr, setProductNameAr] = useState("");
  const [productDescriptionAr, setProductDescriptionAr] = useState("");

  // Image files
  const [mainImageFile, setMainImageFile] = useState(null);
  const [additionalImageFiles, setAdditionalImageFiles] = useState({});

  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedMainLocation, setSelectedMainLocation] = useState(null);

  // Loading
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const querySnapshot = await getDocs(collection(db, "products"));
      const categorySet = new Set();
      const subCategoryMap = {};

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.category) {
          categorySet.add(data.category);

          if (data.subCategory) {
            if (!subCategoryMap[data.category]) {
              subCategoryMap[data.category] = new Set();
            }
            subCategoryMap[data.category].add(data.subCategory);
          }
        }
      });

      setCategoryOptions(
        [...categorySet].map((cat) => ({ label: cat, value: cat }))
      );

      const finalMap = {};
      for (const cat in subCategoryMap) {
        finalMap[cat] = [...subCategoryMap[cat]].map((sub) => ({
          label: sub,
          value: sub,
        }));
      }

      setSubCategoryMap(finalMap);
    };

    // ✅ Call the function inside the useEffect
    fetchCategories();
  }, []);

  const uploadImageToStorage = async (file, path) => {
    const storage = getStorage();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const cleanPriceRanges = (tiers) => {
    return tiers.map((tier) => ({
      minQty: tier.minQty?.value?.toString() || "",
      maxQty: tier.maxQty?.value?.toString() || "",
      price: tier.price?.value?.toString() || "",
      locations: tier.deliveryLocations.map((loc) => ({
        location: loc.location?.value || "",
        locationPrice:
          loc.price?.value === "Unlimited"
            ? "Unlimited"
            : parseFloat(loc.price?.value || 0),
      })),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const isValid = validateProduct({
      productNameEn,
      productNameAr,
      productDescriptionEn,
      productDescriptionAr,
      selectedCategory,
      selectedSubCategory,
      mainImageFile,
      priceTiers,
    });

    if (!isValid) return;

    const toastId = toast.loading("Uploading product...");
    setIsSubmitting(true);

    try {
      // 1️⃣ Upload images
      const mainImageUrl = await uploadImageToStorage(
        mainImageFile,
        `products/${Date.now()}_main.jpg`
      );
      const additionalUrls = await Promise.all(
        Object.entries(additionalImageFiles).map(([id, file], idx) =>
          uploadImageToStorage(
            file,
            `products/${Date.now()}_additional_${idx}.jpg`
          )
        )
      );

      // 2️⃣ Slug
      const baseSlug = generateSlug(productNameEn);
      const uniqueSlug = await ensureUniqueSlug(baseSlug);

      // 3️⃣ Fetch freshest supplier profile
      let supplierName = "unknown";
      let supplierNumber = "N/A";
      if (currentUser?.uid) {
        const supplierRef = doc(db, "users", currentUser.uid);
        const supplierSnap = await getDoc(supplierRef);
        if (supplierSnap.exists()) {
          const sup = supplierSnap.data();
          console.log("Fetched supplier profile:", sup);
          // try displayName, then companyName, then Arabic companyName, then fallback
          supplierName =
            sup.displayName ??
            sup.companyName ??
            sup.companyNameAr ??
            supplierName;
          // try phone or companyPhone
          supplierNumber = sup.phone ?? sup.companyPhone ?? supplierNumber;
        }
      }

      // 4️⃣ Assemble productData
      const productData = {
        productName: { en: productNameEn, ar: productNameAr },
        slug: uniqueSlug,
        description: { en: productDescriptionEn, ar: productDescriptionAr },
        category: selectedCategory.value,
        subCategory: selectedSubCategory?.value || "Default",
        mainImageUrl,
        additionalImageUrls: additionalUrls,
        sizes: Array.isArray(selectedSizes)
          ? selectedSizes.map((s) =>
              typeof s === "string" ? s : s?.value || s
            )
          : [],
        colors: Array.isArray(selectedColors)
          ? selectedColors.map((c) =>
              typeof c === "string" ? c : c?.value || c
            )
          : [],
        mainLocation: selectedMainLocation?.value || "",
        supplierId: currentUser?.uid || "unknown",
        supplierName,
        supplierNumber,
        priceRanges: cleanPriceRanges(priceTiers),
        createdAt: new Date(),
      };

      // 5️⃣ Write to Firestore
      await addDoc(collection(db, "products"), productData);

      toast.dismiss(toastId);
      toast.success("Product uploaded successfully!");
      router.push("/supplier-dashboard/products");
    } catch (error) {
      toast.dismiss(toastId);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);

  const [additionalImages, setAdditionalImages] = useState([
    { id: Date.now() },
  ]);

  const handleAddImage = () => {
    setAdditionalImages((prev) => {
      if (prev.length < 4) {
        toast.success("Additional image field added");
        return [...prev, { id: Date.now() }];
      } else {
        toast.error("You can only upload up to 4 additional images");
        return prev;
      }
    });
  };

  const handleRemoveImage = (id) => {
    setAdditionalImages((prev) => prev.filter((img) => img.id !== id));
    setAdditionalImagePreviews((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    toast.info("Removed an additional image");
  };

  const [priceTiers, setPriceTiers] = useState([
    {
      id: Date.now(),
      minQty: null,
      maxQty: null,
      price: null,
      deliveryLocations: [{ id: Date.now(), location: null, price: null }],
    },
  ]);

  const handleAddPriceTier = () => {
    setPriceTiers((prev) => [
      ...prev,
      {
        id: Date.now(),
        minQty: null,
        maxQty: null,
        price: null,
        deliveryLocations: [{ id: Date.now(), location: null, price: null }],
      },
    ]);
    toast.success("Price tier added");
  };

  const handleRemovePriceTier = (id) => {
    setPriceTiers((prev) => prev.filter((tier) => tier.id !== id));
    toast.info("Price tier removed");
  };

  const handleTierFieldChange = (id, field, value) => {
    setPriceTiers((prev) =>
      prev.map((tier) => (tier.id === id ? { ...tier, [field]: value } : tier))
    );
  };

  const handleAddLocation = (tierId) => {
    setPriceTiers((prev) =>
      prev.map((tier) =>
        tier.id === tierId
          ? {
              ...tier,
              deliveryLocations: [
                ...tier.deliveryLocations,
                { id: Date.now(), location: null, price: null },
              ],
            }
          : tier
      )
    );
    toast.success("Delivery location added");
  };

  const handleRemoveLocation = (tierId, locId) => {
    setPriceTiers((prev) =>
      prev.map((tier) =>
        tier.id === tierId
          ? {
              ...tier,
              deliveryLocations: tier.deliveryLocations.filter(
                (loc) => loc.id !== locId
              ),
            }
          : tier
      )
    );
    toast.info("Delivery location removed");
  };

  const handleLocationFieldChange = (tierId, locId, field, value) => {
    setPriceTiers((prev) =>
      prev.map((tier) =>
        tier.id === tierId
          ? {
              ...tier,
              deliveryLocations: tier.deliveryLocations.map((loc) =>
                loc.id === locId ? { ...loc, [field]: value } : loc
              ),
            }
          : tier
      )
    );
  };

  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState({});

  return (
    <form
      onSubmit={handleSubmit}
      className='space-y-6 p-4 md:p-6 max-w-screen-lg mx-auto'
    >
      {/* Basic Info */}
      <div className='space-y-4'>
        <h2 className='text-lg md:text-xl font-semibold'>Basic Info</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Input
            placeholder='Product Name (English)'
            value={productNameEn}
            onChange={(e) => setProductNameEn(e.target.value)}
          />

          <Input
            placeholder='Product Description (English)'
            value={productDescriptionEn}
            onChange={(e) => setProductDescriptionEn(e.target.value)}
          />

          <Input
            placeholder='اسم المنتج (Arabic)'
            value={productNameAr}
            onChange={(e) => setProductNameAr(e.target.value)}
          />

          <Input
            placeholder='وصف المنتج (Arabic)'
            value={productDescriptionAr}
            onChange={(e) => setProductDescriptionAr(e.target.value)}
          />
        </div>
      </div>

      {/* Product Details */}
      <div className='space-y-4'>
        <h2 className='text-lg md:text-xl font-semibold'>Product Details</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
          <CreatableSelect
            placeholder='Select or Create a Category'
            options={categoryOptions}
            value={selectedCategory}
            onChange={(option) => {
              setSelectedCategory(option);

              // Reset subcategory when category changes
              if (categoryOptions.find((c) => c.value === option?.value)) {
                setSelectedSubCategory(null);
              } else {
                // New category — assign subcategory = "Default"
                setSelectedSubCategory({ label: "Default", value: "Default" });
              }
            }}
          />

          <div>
            <CreatableSelect
              isDisabled={!selectedCategory}
              placeholder='Select or Create a Subcategory'
              options={
                selectedCategory && subCategoryMap[selectedCategory.value]
                  ? subCategoryMap[selectedCategory.value]
                  : []
              }
              value={selectedSubCategory}
              onChange={(option) => setSelectedSubCategory(option)}
            />
            {!selectedCategory && (
              <p className='text-sm  text-red-400'>
                Please select a category first.
              </p>
            )}
          </div>

          <div className='flex flex-col gap-1'>
            <CreatableSelect
              styles={{
                control: (base) => ({ ...base, marginTop: 0, marginBottom: 0 }),
                menu: (base) => ({ ...base, marginTop: 0 }),
              }}
              placeholder='Main Location'
              value={selectedMainLocation}
              onChange={(option) => setSelectedMainLocation(option)} // ✅ fixed
              options={defaultLocationOptions}
            />
          </div>

          <div className='flex flex-col gap-1'>
            <CreatableSelect
              placeholder='Select Size(s)'
              isMulti
              value={selectedSizes.map((opt) =>
                typeof opt === "string" ? { label: opt, value: opt } : opt
              )}
              onChange={(options) => {
                if (Array.isArray(options)) {
                  setSelectedSizes(
                    options.map((opt) =>
                      typeof opt === "string"
                        ? { label: opt, value: opt }
                        : {
                            label: opt.label || opt.value,
                            value: opt.value || opt.label,
                          }
                    )
                  );
                } else {
                  setSelectedSizes([]);
                }
              }}
              options={defaultSizeOptions}
            />
          </div>
          <div className='flex flex-col gap-1'>
            <CreatableSelect
              placeholder='Select Color(s)'
              isMulti
              value={selectedColors.map((opt) =>
                typeof opt === "string" ? { label: opt, value: opt } : opt
              )}
              onChange={(options) => {
                if (Array.isArray(options)) {
                  setSelectedColors(
                    options.map((opt) =>
                      typeof opt === "string"
                        ? { label: opt, value: opt }
                        : {
                            label: opt.label || opt.value,
                            value: opt.value || opt.label,
                          }
                    )
                  );
                } else {
                  setSelectedColors([]);
                }
              }}
              options={defaultColorOptions}
            />
          </div>
        </div>
      </div>

      {/* Images */}
      <div className='space-y-2'>
        <h2 className='text-lg md:text-xl font-semibold'>Product Images</h2>
        <div className='flex flex-col gap-4 md:flex-row md:items-start'>
          {/* Main Image */}
          <div className='flex flex-col gap-1 w-full md:w-1/3'>
            <Label className='text-sm'>Main Image</Label>
            <Input
              type='file'
              accept='image/*'
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setMainImageFile(file);
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setMainImagePreview(reader.result);
                    toast.success("Main image selected");
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className='file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-green-600'
            />

            {mainImagePreview && (
              <img
                src={mainImagePreview}
                alt='Main Preview'
                className='mt-2 w-32 h-32 object-cover rounded border'
              />
            )}
          </div>

          {/* Additional Images */}
          <div className='flex-1 flex flex-col gap-2'>
            <Label className='text-sm'>Additional Images</Label>

            {additionalImages.map((img) => (
              <div key={img.id} className='flex items-center gap-2'>
                <Input
                  type='file'
                  accept='image/*'
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setAdditionalImageFiles((prev) => ({
                        ...prev,
                        [img.id]: file,
                      }));
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setAdditionalImagePreviews((prev) => ({
                          ...prev,
                          [img.id]: reader.result,
                        }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className='file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-green-600'
                />

                {additionalImagePreviews[img.id] && (
                  <img
                    src={additionalImagePreviews[img.id]}
                    alt={`Preview ${img.id}`}
                    className='w-16 h-16 object-cover rounded border'
                  />
                )}

                <Button
                  variant='ghost'
                  className='text-red-600'
                  type='button'
                  onClick={() => handleRemoveImage(img.id)}
                >
                  Remove
                </Button>
              </div>
            ))}

            {additionalImages.length < 3 && (
              <Button
                variant='link'
                size='sm'
                type='button'
                onClick={handleAddImage}
              >
                + Add Additional Images
              </Button>
            )}
            <p className='text-xs text-muted-foreground'>
              You can upload up to 3 additional images.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className='border p-4 rounded-md space-y-6'>
        {priceTiers.map((tier) => (
          <div key={tier.id} className='space-y-4 border-b pb-4'>
            <div className='flex justify-between items-center'>
              <h3 className='text-base font-medium'>Price Tier</h3>
              <Button
                variant='ghost'
                className='text-red-600'
                type='button'
                onClick={() => handleRemovePriceTier(tier.id)}
              >
                Remove
              </Button>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
              <CreatableSelect
                placeholder='Min Qty'
                options={defaultQuantityOptions}
                value={tier.minQty}
                onChange={(option) =>
                  handleTierFieldChange(tier.id, "minQty", option)
                }
              />
              <CreatableSelect
                placeholder='Max Qty'
                options={defaultQuantityOptions}
                value={tier.maxQty}
                onChange={(option) =>
                  handleTierFieldChange(tier.id, "maxQty", option)
                }
              />
              <CreatableSelect
                placeholder='Price'
                options={defaultQuantityOptions}
                value={tier.price}
                onChange={(option) =>
                  handleTierFieldChange(tier.id, "price", option)
                }
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
                      placeholder='Select or Create a Location'
                      options={defaultLocationOptions}
                      value={loc.location}
                      onChange={(option) =>
                        handleLocationFieldChange(
                          tier.id,
                          loc.id,
                          "location",
                          option
                        )
                      }
                    />
                  </div>
                  <div className='w-36'>
                    <CreatableSelect
                      placeholder='Price'
                      options={defaultQuantityOptions}
                      value={loc.price}
                      onChange={(option) =>
                        handleLocationFieldChange(
                          tier.id,
                          loc.id,
                          "price",
                          option
                        )
                      }
                    />
                  </div>

                  <Button
                    variant='ghost'
                    className='text-red-600'
                    type='button'
                    onClick={() => handleRemoveLocation(tier.id, loc.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}

              <Button
                variant='link'
                type='button'
                onClick={() => handleAddLocation(tier.id)}
              >
                + Add Location
              </Button>
            </div>
          </div>
        ))}

        <Button variant='outline' type='button' onClick={handleAddPriceTier}>
          + Add Price Tier
        </Button>
      </div>

      {/* Submit Button */}
      <div className='sticky bottom-0 bg-white py-4 px-4 md:px-0'>
        <Button
          type='submit'
          className='w-full bg-primary hover:bg-green-600'
          disabled={isSubmitting}
        >
          {isSubmitting ? "Uploading..." : "Upload Products"}
        </Button>
      </div>
    </form>
  );
}
