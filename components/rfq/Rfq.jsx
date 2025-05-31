"use client";

import React, { useState, useEffect, useMemo } from "react";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import { db, storage } from "@/firebase/config";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import countryList from "react-select-country-list";
import { toast } from "sonner";

const RfqModal = ({ show, onClose }) => {
  const currentUser = useSelector((state) => state.auth.user);
  const storedRole = useSelector((state) => state.auth.userData?.role);

  const { t } = useTranslation();
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [subcategoryOptions, setSubcategoryOptions] = useState([]);
  const [productDetails, setProductDetails] = useState("");
  const [shareBusinessCard, setShareBusinessCard] = useState(false);
  const [categorySuppliers, setCategorySuppliers] = useState({});
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [shipping, setShipping] = useState(
    countryList()
      .getData()
      .find((c) => c.label === "Saudi Arabia")
  );
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);
  const [fileURL, setFileURL] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  const countryOptions = useMemo(() => countryList().getData(), []);

  useEffect(() => {
    // Fetch all product categories and map suppliers per category
    const fetchCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const catMap = {};
        const catList = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.category && data.supplierName && data.supplierId) {
            if (!catList.find((c) => c.value === data.category)) {
              catList.push({ value: data.category, label: data.category });
            }
            catMap[data.category] ??= new Map();
            catMap[data.category].set(data.supplierId, {
              supplierId: data.supplierId,
              supplierName: data.supplierName,
            });
          }
        });

        const cleaned = {};
        for (const cat of Object.keys(catMap)) {
          cleaned[cat] = Array.from(catMap[cat].values());
        }

        setCategories(catList);
        setCategorySuppliers(cleaned);
      } catch {
        toast.error(t("rfq.fetch_categories_error"));
      }
    };
    fetchCategories();
  }, [t]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // 1) Guard against null currentUser
    if (!currentUser) {
      toast.warning(t("rfq.must_login"));
      return;
    }

    setUploading(true);
    setFile(f);

    // 2) Now safe to use currentUser.uid
    const storageRef = ref(storage, `rfq_files/${currentUser.uid}/${f.name}`);
    const uploadTask = uploadBytesResumable(storageRef, f);

    uploadTask.on(
      "state_changed",
      (snap) =>
        setUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100),
      () => {
        toast.error(t("rfq.upload_failed"));
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setFileURL(url);
        toast.success(t("rfq.upload_success"));
        setUploading(false);
      }
    );
  };

  const validateForm = () => {
    const errs = {};
    if (!selectedCategory) errs.selectedCategory = t("rfq.error_category");
    if (!selectedSubcategory)
      errs.selectedSubcategory = t("rfq.error_subcategory");
    if (!productDetails.trim()) errs.productDetails = t("rfq.error_details");
    if (!file) errs.file = t("rfq.error_file");
    if (file && !fileURL && !uploading) errs.file = t("rfq.error_file_upload");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return toast.warning(t("rfq.must_login"));
    if (uploading || submitting) return;
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const userSnap = storedRole
        ? null
        : await getDoc(doc(db, "users", currentUser.uid));
      const role = storedRole || userSnap.data()?.role || "buyer";

      const suppliers = categorySuppliers[selectedCategory.value] || [];
      if (suppliers.length === 0) {
        toast.error(t("rfq.no_suppliers"));
        setSubmitting(false);
        return;
      }

      await Promise.all(
        suppliers.map(async (supplier) => {
          const rfqRef = await addDoc(collection(db, "rfqs"), {
            buyerId: currentUser.uid,
            category: selectedCategory.value,
            subcategory: selectedSubcategory.value,
            productDetails: productDetails || "No product details available",
            fileURL,
            size,
            color,
            shipping: shipping.label,
            shareBusinessCard,
            supplierId: supplier.supplierId,
            supplierName: supplier.supplierName,
            timestamp: serverTimestamp(),
          });

          const chatId = `chat_${currentUser.uid}_${supplier.supplierId}`;
          const chatRef = doc(db, "rfqChats", chatId);
          const chatSnap = await getDoc(chatRef);
          if (!chatSnap.exists()) {
            await setDoc(chatRef, {
              chatId,
              buyerId: currentUser.uid,
              supplierId: supplier.supplierId,
              supplierName: supplier.supplierName,
              messages: [],
              createdAt: serverTimestamp(),
              lastActivity: serverTimestamp(),
              rfqId: rfqRef.id,
            });
          }
        })
      );

      toast.success(t("rfq.sent_success"));
      setShowSuccessScreen(true);

      setTimeout(() => {
        onClose();
        router.push(
          role === "buyer"
            ? "/buyer-dashboard/messages"
            : "/supplier-dashboard/messages"
        );
      }, 1500);
    } catch {
      toast.error(t("rfq.submit_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  if (showSuccessScreen) {
    return (
      <div className='fixed inset-0 bg-[#2c6449]/30 flex items-center justify-center z-50'>
        <div className='text-center'>
          <svg
            className='w-16 h-16 text-[#2c6449] animate-bounce mx-auto'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M5 13l4 4L19 7'
            />
          </svg>
          <h3 className='text-lg text-[#2c6449] font-semibold mt-4'>
            {t("rfq.success_message")}
          </h3>
          <p className='text-gray-500 text-sm mt-1'>{t("rfq.redirecting")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='fixed inset-0 bg-[#2c6449]/30 flex items-center justify-center z-50'>
      <div className='bg-white w-full max-w-4xl rounded-lg shadow-lg mx-2 p-2'>
        <div className='flex justify-between items-center border-b pb-1'>
          <h2 className='text-base font-semibold'>{t("rfq.title")}</h2>
          <button onClick={onClose} className='text-gray-600 hover:text-black'>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className='mt-2 space-y-2 text-sm'>
          {/* Category and Subcategory */}
          <div className='grid gap-2 md:grid-cols-2'>
            <div>
              <label className='font-medium text-xs'>{t("rfq.category")}</label>
              <Select
                options={categories}
                value={selectedCategory}
                onChange={setSelectedCategory}
                isClearable
                className='w-full text-xs'
              />
              {errors.selectedCategory && (
                <p className='text-red-500 text-[10px]'>
                  {errors.selectedCategory}
                </p>
              )}
            </div>
            <div>
              <label className='font-medium text-xs'>
                {t("rfq.subcategory")}
              </label>
              <CreatableSelect
                options={subcategoryOptions}
                value={selectedSubcategory}
                onChange={setSelectedSubcategory}
                onCreateOption={(val) => {
                  const newOpt = { value: val, label: val };
                  setSubcategoryOptions((prev) => [...prev, newOpt]);
                  setSelectedSubcategory(newOpt);
                }}
                isClearable
                className='w-full text-xs'
              />
              {errors.selectedSubcategory && (
                <p className='text-red-500 text-[10px]'>
                  {errors.selectedSubcategory}
                </p>
              )}
            </div>
          </div>

          {/* Size, Color, Shipping */}
          <div className='grid gap-2 md:grid-cols-3'>
            <div>
              <label className='font-medium text-xs'>{t("rfq.size")}</label>
              <input
                type='text'
                className='w-full border rounded p-1 text-xs'
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
            </div>
            <div>
              <label className='font-medium text-xs'>{t("rfq.color")}</label>
              <input
                type='text'
                className='w-full border rounded p-1 text-xs'
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
            <div>
              <label className='font-medium text-xs'>{t("rfq.shipping")}</label>
              <Select
                options={countryOptions}
                value={shipping}
                onChange={setShipping}
                className='w-full text-xs'
              />
            </div>
          </div>

          {/* Details */}
          <div>
            <label className='font-medium text-xs'>{t("rfq.details")}</label>
            <textarea
              className='w-full border rounded p-1 text-xs'
              rows={2}
              value={productDetails}
              onChange={(e) => setProductDetails(e.target.value)}
            />
            {errors.productDetails && (
              <p className='text-red-500 text-[10px]'>
                {errors.productDetails}
              </p>
            )}
          </div>

          {/* File Upload */}
          <div>
            <label className='font-medium text-xs'>
              {t("rfq.upload_file")}
            </label>
            <input
              type='file'
              accept='.jpg,.png,.pdf,.docx'
              className='w-full border p-1 text-xs'
              onChange={handleFileChange}
            />
            {uploading && (
              <p className='text-blue-500 text-[10px]'>
                {t("rfq.uploading")} {Math.round(uploadProgress)}%
              </p>
            )}
            {fileURL && !uploading && (
              <p className='text-green-500 text-[10px]'>
                {t("rfq.file_uploaded")}
              </p>
            )}
            {errors.file && (
              <p className='text-red-500 text-[10px]'>{errors.file}</p>
            )}
          </div>

          {/* Share business card */}
          <div className='flex items-center space-x-2'>
            <input
              id='shareBusinessCard'
              type='checkbox'
              checked={shareBusinessCard}
              onChange={() => setShareBusinessCard((prev) => !prev)}
              className='w-4 h-4'
            />
            <label htmlFor='shareBusinessCard' className='text-xs'>
              {t("rfq.share_contact")}
            </label>
          </div>

          {/* Submit Button */}
          <button
            type='submit'
            disabled={uploading || submitting}
            className='w-full bg-[#2c6449] text-white px-2 py-1 rounded text-xs
                       hover:bg-opacity-90 disabled:opacity-50'
          >
            {submitting
              ? t("rfq.sending")
              : uploading
              ? t("rfq.uploading")
              : t("rfq.submit")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RfqModal;
