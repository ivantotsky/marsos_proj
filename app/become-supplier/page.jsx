"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "@/firebase/config";
import { defaultCountryCodeOptions } from "@/lib/productOptions";
import { toast } from "sonner";

const initialValues = {
  companyName: "",
  unifiedNumber: "",
  crNumber: "",
  crIssueG: "",
  crIssueH: "",
  crConfirmG: "",
  crConfirmH: "",
  vatNumber: "",
  companyPhone: "",
  representativeName: "",
  representativeEmail: "",
  representativePhone: "",
  fullAddress: "",
  city: "",
  zipCode: "",
  country: "",
  uid: "",
  role: "",
  pidNumber: "",
  crDocument: null,
  productImages: null,
};

export default function BecomeSupplierPage() {
  const router = useRouter();
  const [formData, setFormData] = useState(initialValues);
  const [companyPhoneCode, setCompanyPhoneCode] = useState("+966");
  const [authPhoneCode, setAuthPhoneCode] = useState("+966");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch categories
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "products"));
        const setCat = new Set();
        snap.forEach((d) => d.data().category && setCat.add(d.data().category));
        setCategories([...setCat]);
      } catch {
        toast.error("Error fetching categories");
      }
    })();
  }, []);

  // Handle text and file inputs
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((f) => ({
        ...f,
        [name]: files.length > 1 ? files : files[0],
      }));
    } else {
      setFormData((f) => ({ ...f, [name]: value }));
    }
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const storage = getStorage();
      let crURL = "";
      let imgURLs = [];

      // Upload CR document
      if (formData.crDocument) {
        const crRef = ref(
          storage,
          `cr-documents/${Date.now()}_${formData.crDocument.name}`
        );
        const snap = await uploadBytes(crRef, formData.crDocument);
        crURL = await getDownloadURL(snap.ref);
      }

      // Upload product images
      if (formData.productImages && formData.productImages.length) {
        for (let file of formData.productImages) {
          const imgRef = ref(
            storage,
            `product-images/${Date.now()}_${file.name}`
          );
          const imgSnap = await uploadBytes(imgRef, file);
          imgURLs.push(await getDownloadURL(imgSnap.ref));
        }
      }

      // Build payload with two separate phone strings
      const fullCompanyPhone = companyPhoneCode + formData.companyPhone;
      const fullAuthPhone = authPhoneCode + formData.representativePhone;

      const newUser = {
        ...formData,
        companyPhone: fullCompanyPhone,
        representativePhone: fullAuthPhone,
        crDocument: crURL,
        productImages: imgURLs,
        createdAt: new Date().toISOString(),
        isApproved: false,
        role: "supplier",
      };

      // Write to Firestore
      const docRef = await addDoc(collection(db, "users"), newUser);
      await updateDoc(doc(db, "users", docRef.id), { uid: docRef.id });

      toast.success("Registration submitted successfully!");
      setFormData(initialValues);
      setCompanyPhoneCode("+966");
      setAuthPhoneCode("+966");
      router.push("/supplier-success");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='max-w-4xl mx-auto p-4 bg-white shadow rounded-lg'>
      <h2 className='text-xl font-bold text-[#2c6449] mb-4'>
        Become a Supplier
      </h2>
      <form
        onSubmit={handleSubmit}
        className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'
      >
        {/* ─── LEFT COLUMN ─── */}
        <fieldset className='space-y-3'>
          <legend className='text-lg font-semibold text-[#2c6449] mb-2'>
            Company Details
          </legend>

          {/* Name */}
          <div>
            <label className='block mb-1'>Name</label>
            <input
              name='companyName'
              value={formData.companyName}
              onChange={handleChange}
              required
              className='w-full p-1 border rounded text-sm'
            />
          </div>

          {/* Email */}
          <div>
            <label className='block mb-1'>Email Address</label>
            <input
              type='email'
              name='representativeEmail'
              value={formData.representativeEmail}
              onChange={handleChange}
              required
              className='w-full p-1 border rounded text-sm'
            />
          </div>

          {/* Unified Number */}
          <div>
            <label className='block mb-1'>National Unified Number</label>
            <input
              name='unifiedNumber'
              value={formData.unifiedNumber}
              onChange={handleChange}
              required
              className='w-full p-1 border rounded text-sm'
            />
          </div>

          {/* CR Number */}
          <div>
            <label className='block mb-1'>Commercial Reg. Number</label>
            <input
              name='crNumber'
              value={formData.crNumber}
              onChange={handleChange}
              required
              className='w-full p-1 border rounded text-sm'
            />
          </div>

          {/* CR Issue Dates (G/H) */}
          <div className='grid grid-cols-2 gap-2'>
            <div>
              <label className='block mb-1'>CR Issue (G)</label>
              <input
                type='date'
                name='crIssueG'
                value={formData.crIssueG}
                onChange={handleChange}
                required
                className='w-full p-1 border rounded text-sm'
              />
            </div>
            <div>
              <label className='block mb-1'>CR Issue (H)</label>
              <input
                type='date'
                name='crIssueH'
                value={formData.crIssueH}
                onChange={handleChange}
                required
                className='w-full p-1 border rounded text-sm'
              />
            </div>
          </div>

          {/* CR Confirm Dates (G/H) */}
          <div className='grid grid-cols-2 gap-2'>
            <div>
              <label className='block mb-1'>CR Confirm (G)</label>
              <input
                type='date'
                name='crConfirmG'
                value={formData.crConfirmG}
                onChange={handleChange}
                required
                className='w-full p-1 border rounded text-sm'
              />
            </div>
            <div>
              <label className='block mb-1'>CR Confirm (H)</label>
              <input
                type='date'
                name='crConfirmH'
                value={formData.crConfirmH}
                onChange={handleChange}
                required
                className='w-full p-1 border rounded text-sm'
              />
            </div>
          </div>

          {/* VAT Number */}
          <div>
            <label className='block mb-1'>VAT Registration Number</label>
            <input
              name='vatNumber'
              value={formData.vatNumber}
              onChange={handleChange}
              required
              className='w-full p-1 border rounded text-sm'
            />
          </div>

          {/* Company Phone */}
          <div>
            <label className='block mb-1'>Phone Number</label>
            <div className='flex'>
              <select
                value={companyPhoneCode}
                onChange={(e) => setCompanyPhoneCode(e.target.value)}
                className='p-1 border rounded-l text-sm'
              >
                {defaultCountryCodeOptions.map((opt, i) => (
                  <option key={i} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                type='tel'
                name='companyPhone'
                value={formData.companyPhone}
                onChange={handleChange}
                required
                className='flex-1 p-1 border rounded-r text-sm'
                placeholder='5XXXXXXXX'
              />
            </div>
          </div>

          {/* City */}
          <div>
            <label className='block mb-1'>City</label>
            <input
              name='city'
              value={formData.city}
              onChange={handleChange}
              required
              className='w-full p-1 border rounded text-sm'
            />
          </div>

          {/* Zip Code */}
          <div>
            <label className='block mb-1'>Zip Code</label>
            <input
              name='zipCode'
              value={formData.zipCode}
              onChange={handleChange}
              required
              className='w-full p-1 border rounded text-sm'
            />
          </div>

          {/* Country */}
          <div>
            <label className='block mb-1'>Country</label>
            <input
              name='country'
              value={formData.country}
              onChange={handleChange}
              required
              className='w-full p-1 border rounded text-sm'
            />
          </div>

          {/* Address */}
          <div>
            <label className='block mb-1'>Address</label>
            <textarea
              name='fullAddress'
              value={formData.fullAddress}
              onChange={handleChange}
              required
              className='w-full p-1 border rounded text-sm'
            />
          </div>
        </fieldset>

        {/* ─── RIGHT COLUMN ─── */}
        <fieldset className='space-y-3'>
          <legend className='text-lg font-semibold text-[#2c6449] mb-2'>
            Authorized Person Information
          </legend>

          {/* User ID */}
          <div>
            <label className='block mb-1'>User ID</label>
            <input
              name='uid'
              value={formData.uid}
              onChange={handleChange}
              required
              className='w-full p-1 border rounded text-sm'
            />
          </div>

          {/* Name */}
          <div>
            <label className='block mb-1'>Name</label>
            <input
              name='representativeName'
              value={formData.representativeName}
              onChange={handleChange}
              required
              className='w-full p-1 border rounded text-sm'
            />
          </div>

          {/* Email */}
          <div>
            <label className='block mb-1'>Email Address</label>
            <input
              type='email'
              name='representativeEmail'
              value={formData.representativeEmail}
              onChange={handleChange}
              required
              className='w-full p-1 border rounded text-sm'
            />
          </div>

          {/* Login ID */}
          <div>
            <label className='block mb-1'>Login ID</label>
            <input
              name='representativeEmail'
              value={formData.representativeEmail}
              onChange={handleChange}
              required
              className='w-full p-1 border rounded text-sm'
            />
          </div>

          {/* Auth Mobile */}
          <div>
            <label className='block mb-1'>Mobile Number</label>
            <div className='flex'>
              <select
                value={authPhoneCode}
                onChange={(e) => setAuthPhoneCode(e.target.value)}
                className='p-1 border rounded-l text-sm'
              >
                {defaultCountryCodeOptions.map((opt, i) => (
                  <option key={i} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                type='tel'
                name='representativePhone'
                value={formData.representativePhone}
                onChange={handleChange}
                required
                className='flex-1 p-1 border rounded-r text-sm'
                placeholder='5XXXXXXXX'
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className='block mb-1'>Designation/Role</label>
            <input
              name='role'
              value={formData.role}
              onChange={handleChange}
              required
              className='w-full p-1 border rounded text-sm'
            />
          </div>

          {/* PID */}
          <div>
            <label className='block mb-1'>Personal ID Document No.</label>
            <input
              name='pidNumber'
              value={formData.pidNumber}
              onChange={handleChange}
              required
              className='w-full p-1 border rounded text-sm'
            />
          </div>
        </fieldset>

        <button
          type='submit'
          disabled={loading}
          className='bg-[#2c6449] text-white text-sm py-2 rounded md:col-span-2'
        >
          {loading ? "Uploading…" : "Submit Registration"}
        </button>
      </form>
    </div>
  );
}
