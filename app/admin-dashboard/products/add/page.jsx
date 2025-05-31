"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import CreatableSelect from "react-select/creatable";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { db } from "@/firebase/config";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import {
  defaultLocationOptions,
  defaultSizeOptions,
  defaultColorOptions,
  defaultQtyOptions,
} from "@/lib/productOptions";
import { translateText } from "@/utils/translate";

export default function AdminAddProductPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation("admin_product_add");
  const locale = i18n.language;

  const [translatedCategories, setTranslatedCategories] = useState({});
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierId, setSupplierId] = useState("");
  const [supplierNumber, setSupplierNumber] = useState("");

  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [categories, setCategories] = useState({});

  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);

  const [mainImage, setMainImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([null]);

  const [priceRanges, setPriceRanges] = useState([
    {
      minQty: "",
      maxQty: "",
      price: "",
      locations: [{ location: "", locationPrice: "" }],
    },
  ]);

  const [minQtyError, setMinQtyError] = useState("");
  const [loading, setLoading] = useState(false);

  const [mainLocation, setMainLocation] = useState(null);

  const [productNameEn, setProductNameEn] = useState("");
  const [productNameAr, setProductNameAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");

  const [locationOptions, setLocationOptions] = useState(
    defaultLocationOptions
  );
  const [sizeOptions, setSizeOptions] = useState(defaultSizeOptions);
  const [colorOptions, setColorOptions] = useState(defaultColorOptions);
  const [qtyOptions, setQtyOptions] = useState(defaultQtyOptions);

  const options = [
    ...Array.from({ length: 10 }, (_, i) => ({
      value: `${i + 1}`,
      label: `${i + 1}`,
    })),
    { value: "Unlimited", label: "Unlimited" },
  ];
  const deliveryPriceOptions = [...options];

  const generateUniqueFileName = (file, index = null) => {
    const uniquePart = Date.now() + (index !== null ? `_${index}` : "");
    return `${uniquePart}_${file.name}`;
  };

  useEffect(() => {
    async function fetchCategories() {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const catMap = {};
        snapshot.docs.forEach((doc) => {
          const d = doc.data();
          const cat = d.category || "Uncategorized";
          const sub = d.subCategory || "Uncategorized";
          if (!catMap[cat]) catMap[cat] = new Set();
          catMap[cat].add(sub);
        });
        const formatted = {};
        Object.keys(catMap).forEach(
          (k) => (formatted[k] = Array.from(catMap[k]))
        );
        setCategories(formatted);

        if (locale === "ar") {
          const cats = Object.keys(formatted);
          const translations = await Promise.all(
            cats.map((c) => translateText(c, "ar"))
          );
          const map = {};
          cats.forEach((c, i) => (map[c] = translations[i]));
          setTranslatedCategories(map);
        } else {
          setTranslatedCategories({});
        }
      } catch (e) {
        console.error(e);
        toast.error(t("fetch_categories_error", "Failed to fetch categories."));
      }
    }
    fetchCategories();
  }, [locale, t]);

  useEffect(() => {
    async function fetchSuppliers() {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const list = snapshot.docs
          .filter((doc) => doc.data().role === "supplier")
          .map((doc) => ({
            id: doc.id,
            name: doc.data().name || "Unnamed Supplier",
            contact: doc.data().contact || "N/A",
          }));
        setSuppliers(list);
      } catch (e) {
        console.error(e);
        toast.error(t("fetch_suppliers_error", "Failed to fetch suppliers."));
      }
    }
    fetchSuppliers();
  }, [t]);

  const handleSupplierChange = (e) => {
    const name = e.target.value;
    const s = suppliers.find((s) => s.name === name);
    setSelectedSupplier(s);
    setSupplierId(s?.id || "N/A");
    setSupplierNumber(s?.contact || "N/A");
  };

  const handleCreateOption = (newOpt, opts, setOpts) => {
    if (opts.some((o) => o.value.toLowerCase() === newOpt.toLowerCase())) {
      toast(t("option_exists", { opt: newOpt }), { icon: "⚠️" });
      return;
    }
    const o = { value: newOpt, label: newOpt };
    setOpts([...opts, o]);
    toast.success(t("option_added", { opt: newOpt }));
    return o;
  };

  const handleCreateQtyOption = (val) => {
    if (/^-/.test(val)) {
      toast.error(
        t("negative_not_allowed", "Negative numbers are not allowed.")
      );
      return null;
    }
    if (!qtyOptions.some((o) => o.value === val)) {
      const o = { value: val, label: val };
      setQtyOptions([...qtyOptions, o]);
      toast.success(t("qty_added", { qty: val }));
      return o;
    }
    toast(t("qty_exists", { qty: val }), { icon: "⚠️" });
    return null;
  };

  const handleAddAdditionalImage = () =>
    setAdditionalImages([...additionalImages, null]);
  const handleAdditionalImageChange = (i, file) => {
    const a = [...additionalImages];
    a[i] = file;
    setAdditionalImages(a);
  };
  const handleRemoveAdditionalImage = (i) =>
    setAdditionalImages((a) => {
      const x = [...a];
      x.splice(i, 1);
      return x;
    });

  const handleAddPriceRange = () =>
    setPriceRanges([
      ...priceRanges,
      {
        minQty: "",
        maxQty: "",
        price: "",
        locations: [{ location: "", locationPrice: "" }],
      },
    ]);
  const handleRemovePriceRange = (i) =>
    setPriceRanges((a) => {
      const x = [...a];
      x.splice(i, 1);
      return x;
    });

  const handleNumericInput = (value) => {
    if (value === "" || value === "Unlimited") return value;
    if (/[^0-9.]/.test(value)) {
      toast.error(
        t("numeric_only", "Only numeric values or 'Unlimited' allowed.")
      );
      return null;
    }
    if ((value.match(/\./g) || []).length > 1) {
      toast.error(t("one_decimal", "Only one decimal point is allowed."));
      return null;
    }
    return value;
  };

  const handlePriceRangeChange = (i, field, v) => {
    const x = handleNumericInput(v);
    if (x !== null) {
      const arr = [...priceRanges];
      arr[i][field] = x;
      setPriceRanges(arr);
    }
  };

  const handleLocationChange = (pi, li, field, v) => {
    let val = v;
    if (field === "location") {
      if (!/^[a-zA-Z\s]+$/.test(v)) {
        toast.error(t("alpha_only", "Only alphabetic characters allowed."));
        return;
      }
    } else {
      val = handleNumericInput(v);
      if (val === null) return;
    }
    const arr = [...priceRanges];
    arr[pi].locations[li][field] = val;
    setPriceRanges(arr);
  };

  const handleAddLocation = (pi) => {
    const arr = [...priceRanges];
    arr[pi].locations.push({ location: "", locationPrice: "" });
    setPriceRanges(arr);
  };
  const handleRemoveLocation = (pi, li) => {
    const arr = [...priceRanges];
    arr[pi].locations.splice(li, 1);
    setPriceRanges(arr);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSupplier) {
      toast.error(t("select_supplier_error", "Please select a supplier."));
      return;
    }
    if (
      !productNameEn ||
      !productNameAr ||
      !descriptionEn ||
      !descriptionAr ||
      !category ||
      !subCategory ||
      !sizes.length ||
      !colors.length ||
      !mainImage ||
      !mainLocation ||
      !priceRanges.length
    ) {
      toast.error(t("fill_all_error", "Please fill all required fields."));
      return;
    }

    setLoading(true);
    try {
      const storage = getStorage();

      const mainName = generateUniqueFileName(mainImage);
      const mainRef = ref(storage, `images/${mainName}`);
      await uploadBytes(mainRef, mainImage);
      const mainUrl = await getDownloadURL(mainRef);

      const additionalUrls = [];
      for (let i = 0; i < additionalImages.length; i++) {
        const f = additionalImages[i];
        if (!f) continue;
        const name = generateUniqueFileName(f, i);
        const r = ref(storage, `images/${name}`);
        await uploadBytes(r, f);
        additionalUrls.push(await getDownloadURL(r));
      }

      await addDoc(collection(db, "products"), {
        productName: { en: productNameEn, ar: productNameAr },
        description: { en: descriptionEn, ar: descriptionAr },
        category,
        subCategory,
        sizes: sizes.map((s) => s.value),
        colors: colors.map((c) => c.value),
        mainImageUrl: mainUrl,
        additionalImageUrls: additionalUrls,
        mainLocation: mainLocation.value || null,
        priceRanges: priceRanges.map((r) => ({
          minQty: r.minQty,
          maxQty: r.maxQty,
          price: r.price,
          locations: r.locations.map((loc) => ({
            location: loc.location,
            locationPrice: parseFloat(loc.locationPrice || "0"),
          })),
        })),
        createdAt: new Date(),
        supplierId,
        supplierName: selectedSupplier.name,
        supplierNumber,
      });

      toast.success(t("upload_success", "Product uploaded successfully."));
      setProductNameEn("");
      setProductNameAr("");
      setDescriptionEn("");
      setDescriptionAr("");
      setCategory("");
      setSubCategory("");
      setSizes([]);
      setColors([]);
      setMainImage(null);
      setAdditionalImages([null]);
      setPriceRanges([
        {
          minQty: "",
          maxQty: "",
          price: "",
          locations: [{ location: "", locationPrice: "" }],
        },
      ]);

      router.push("/admin-dashboard");
    } catch (err) {
      console.error(err);
      toast.error(t("upload_fail", "Failed to upload. Try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='px-4 py-6 max-w-7xl mx-auto'>
      <form onSubmit={handleSubmit}>
        <h2 className='text-2xl font-semibold mb-6 text-gray-800'>
          {t("title")}
        </h2>

        {/* Supplier */}
        <div className='bg-white border rounded-md p-4 mb-6 shadow-sm'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                {t("supplier_name")}
              </label>
              <select
                value={selectedSupplier?.name || ""}
                onChange={handleSupplierChange}
                className='w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring focus:ring-green-200'
              >
                <option value='' disabled>
                  {t("select_supplier")}
                </option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                {t("supplier_id")}
              </label>
              <p className='text-sm text-gray-800'>{supplierId || "N/A"}</p>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                {t("supplier_number")}
              </label>
              <p className='text-sm text-gray-800'>{supplierNumber || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
          {/* Names */}
          <div className='space-y-2'>
            <input
              type='text'
              placeholder={t("name_en", "Product Name (English)")}
              value={productNameEn}
              onChange={(e) => setProductNameEn(e.target.value)}
              className='w-full border border-gray-300 rounded-md p-2 text-sm focus:ring focus:ring-green-200'
              required
            />
            <input
              type='text'
              placeholder={t("name_ar", "اسم المنتج (Arabic)")}
              dir='rtl'
              value={productNameAr}
              onChange={(e) => setProductNameAr(e.target.value)}
              className='w-full border border-gray-300 rounded-md p-2 text-sm focus:ring focus:ring-green-200'
              required
            />
          </div>

          {/* Descriptions */}
          <div className='space-y-2'>
            <input
              type='text'
              placeholder={t("desc_en", "Product Description (English)")}
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              className='w-full border border-gray-300 rounded-md p-2 text-sm focus:ring focus:ring-green-200'
              required
            />
            <input
              type='text'
              placeholder={t("desc_ar", "وصف المنتج (Arabic)")}
              dir='rtl'
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
              className='w-full border border-gray-300 rounded-md p-2 text-sm focus:ring focus:ring-green-200'
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              {t("admin_product_add.category")}
            </label>
            <CreatableSelect
              options={Object.keys(categories).map((cat) => ({
                value: cat,
                label: translatedCategories[cat] || cat,
              }))}
              value={
                category
                  ? {
                      value: category,
                      label: translatedCategories[category] || category,
                    }
                  : null
              }
              onChange={(sel) => {
                setCategory(sel?.value || "");
                setSubCategory("");
              }}
              onCreateOption={async (nc) => {
                if (!categories[nc]) {
                  setCategories((p) => ({ ...p, [nc]: ["default"] }));
                }
                const tr = await translateText(nc, "ar");
                setTranslatedCategories((p) => ({ ...p, [nc]: tr }));
                setCategory(nc);
                setSubCategory("default");
              }}
              placeholder={t("select_or_create_category")}
            />
          </div>

          {/* Subcategory */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              {t("sub_category")}
            </label>
            <CreatableSelect
              options={(categories[category] || []).map((sub) => ({
                value: sub,
                label: sub,
              }))}
              value={
                subCategory ? { value: subCategory, label: subCategory } : null
              }
              onChange={(sel) => setSubCategory(sel?.value || "")}
              onCreateOption={(ns) => {
                if (!categories[category]?.includes(ns)) {
                  setCategories((p) => ({
                    ...p,
                    [category]: [...(p[category] || []), ns],
                  }));
                }
                setSubCategory(ns);
              }}
              isDisabled={!category}
              placeholder={t("select_or_create_subcategory")}
            />
          </div>
        </div>

        {/* Location / Sizes / Colors */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              {t("main_location")}
            </label>
            <CreatableSelect
              options={locationOptions}
              value={mainLocation}
              onChange={setMainLocation}
              onCreateOption={(nl) => {
                const opt = handleCreateOption(
                  nl,
                  locationOptions,
                  setLocationOptions
                );
                if (opt) setMainLocation(opt);
              }}
              placeholder={t("select_or_create_location")}
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              {t("sizes")}
            </label>
            <CreatableSelect
              isMulti
              options={sizeOptions}
              value={sizes}
              onChange={setSizes}
              onCreateOption={(ns) => {
                const o = handleCreateOption(ns, sizeOptions, setSizeOptions);
                if (o) setSizes((p) => [...p, o]);
              }}
              placeholder={t("select_or_create_size")}
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              {t("colors")}
            </label>
            <CreatableSelect
              isMulti
              options={colorOptions}
              value={colors}
              onChange={setColors}
              onCreateOption={(nc) => {
                const o = handleCreateOption(nc, colorOptions, setColorOptions);
                if (o) setColors((p) => [...p, o]);
              }}
              placeholder={t("select_or_create_color")}
            />
          </div>
        </div>

        {/* Image Uploads */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              {t("main_image")}
            </label>
            <input
              type='file'
              accept='image/*'
              className='block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-300'
              onChange={(e) => setMainImage(e.target.files[0])}
              required
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              {t("additional_images")}
            </label>
            {additionalImages.map((_, idx) => (
              <div key={idx} className='flex items-center gap-3 mb-2'>
                <input
                  type='file'
                  accept='image/*'
                  className='flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm'
                  onChange={(e) =>
                    handleAdditionalImageChange(idx, e.target.files[0])
                  }
                />
                <button
                  type='button'
                  className='text-red-600 hover:text-red-800 text-sm font-medium'
                  onClick={() => handleRemoveAdditionalImage(idx)}
                >
                  {t("remove")}
                </button>
              </div>
            ))}
            <button
              type='button'
              className='mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium'
              onClick={handleAddAdditionalImage}
            >
              + {t("add_another_image")}
            </button>
          </div>
        </div>

        {/* Price Ranges */}
        <div className='mt-8 space-y-8'>
          {priceRanges.map((r, i) => (
            <div
              key={i}
              className='border border-gray-200 rounded-lg p-4 bg-white shadow-sm'
            >
              <div className='flex justify-between items-center mb-4'>
                <h4 className='text-lg font-semibold text-gray-700'>
                  {t("tier")} #{i + 1}
                </h4>
                <button
                  type='button'
                  className='text-red-500 text-sm hover:underline'
                  onClick={() => handleRemovePriceRange(i)}
                >
                  {t("remove_price_range")}
                </button>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                <div className='relative'>
                  <CreatableSelect
                    options={qtyOptions}
                    value={
                      r.minQty ? { value: r.minQty, label: r.minQty } : null
                    }
                    onChange={(sel) => {
                      const v = sel?.value || "";
                      if (
                        i === 0 &&
                        (v === "Unlimited" || v === "0" || v === "")
                      ) {
                        setMinQtyError(
                          t("min_qty_error", "Minimum order is 1.")
                        );
                        return;
                      }
                      setMinQtyError("");
                      handlePriceRangeChange(i, "minQty", v);
                    }}
                    onCreateOption={(nv) => {
                      if (
                        i === 0 &&
                        (nv === "Unlimited" || nv === "0" || nv === "")
                      ) {
                        setMinQtyError(
                          t("min_qty_error", "Minimum order is 1.")
                        );
                        return;
                      }
                      const o = handleCreateQtyOption(nv);
                      if (o) {
                        setMinQtyError("");
                        handlePriceRangeChange(i, "minQty", o.value);
                      }
                    }}
                    placeholder={t("min_qty")}
                  />
                  {i === 0 && minQtyError && (
                    <p className='text-red-600 italic text-sm mt-1'>
                      {minQtyError}
                    </p>
                  )}
                </div>
                <CreatableSelect
                  options={qtyOptions}
                  value={r.maxQty ? { value: r.maxQty, label: r.maxQty } : null}
                  onChange={(sel) =>
                    handlePriceRangeChange(i, "maxQty", sel?.value || "")
                  }
                  onCreateOption={(nv) => {
                    const o = handleCreateQtyOption(nv);
                    if (o) handlePriceRangeChange(i, "maxQty", o.value);
                  }}
                  placeholder={t("max_qty")}
                />
                <CreatableSelect
                  options={options}
                  isClearable
                  value={r.price ? { value: r.price, label: r.price } : null}
                  onChange={(sel) =>
                    handlePriceRangeChange(i, "price", sel?.value || "")
                  }
                  onCreateOption={(val) => {
                    if (!/^[0-9]*\.?[0-9]+$/.test(val)) {
                      toast.error(
                        t("numeric_price_error", "Numeric values only.")
                      );
                      return;
                    }
                    handlePriceRangeChange(i, "price", val);
                  }}
                  placeholder={t("price")}
                />
              </div>

              <div className='space-y-4'>
                <h5 className='text-md font-medium text-gray-600'>
                  {t("delivery_locations")}
                </h5>
                {r.locations.map((loc, li) => (
                  <div
                    key={li}
                    className='grid grid-cols-1 md:grid-cols-[2fr_1.5fr_0.5fr] gap-4 items-center'
                  >
                    <CreatableSelect
                      options={locationOptions}
                      value={
                        loc.location
                          ? { value: loc.location, label: loc.location }
                          : null
                      }
                      onChange={(sel) =>
                        handleLocationChange(
                          i,
                          li,
                          "location",
                          sel?.value || ""
                        )
                      }
                      onCreateOption={(newLoc) => {
                        if (/^[a-zA-Z\s]+$/.test(newLoc)) {
                          const o = handleCreateOption(
                            newLoc,
                            locationOptions,
                            setLocationOptions
                          );
                          handleLocationChange(i, li, "location", o.value);
                        } else {
                          toast.error(t("alpha_only", "Alphabetic only."));
                        }
                      }}
                      placeholder={t("select_or_create_location")}
                    />
                    <CreatableSelect
                      options={deliveryPriceOptions}
                      isClearable
                      value={
                        loc.locationPrice
                          ? {
                              value: loc.locationPrice,
                              label: loc.locationPrice,
                            }
                          : null
                      }
                      onChange={(sel) =>
                        handleLocationChange(
                          i,
                          li,
                          "locationPrice",
                          sel?.value || ""
                        )
                      }
                      onCreateOption={(val) => {
                        if (!/^[0-9]*\.?[0-9]+$/.test(val)) {
                          toast.error(
                            t("numeric_price_error", "Numeric values only.")
                          );
                          return;
                        }
                        handleLocationChange(i, li, "locationPrice", val);
                      }}
                      placeholder={t("price")}
                    />
                    <button
                      type='button'
                      className='text-red-500 text-sm hover:underline'
                      onClick={() => handleRemoveLocation(i, li)}
                    >
                      {t("remove")}
                    </button>
                  </div>
                ))}
                <button
                  type='button'
                  className='text-blue-600 text-sm hover:underline mt-2'
                  onClick={() => handleAddLocation(i)}
                >
                  + {t("add_location")}
                </button>
              </div>
            </div>
          ))}

          <div>
            <button
              type='button'
              onClick={handleAddPriceRange}
              className='bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded shadow-sm text-sm'
            >
              + {t("add_price_range")}
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className='mt-6 text-center'>
          <button
            type='submit'
            disabled={loading}
            className='bg-[#2c6449] hover:bg-green-800 text-white px-6 py-2 rounded shadow disabled:opacity-50 disabled:cursor-not-allowed text-sm'
          >
            {loading ? (
              <svg
                className='animate-spin inline-block h-5 w-5 text-white'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                />
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z'
                />
              </svg>
            ) : (
              t("title")
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
