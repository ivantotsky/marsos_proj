"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

export default function AddSupplierPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    companyName: "",
    crNumber: "",
    address: "",
    city: "",
    region: "",
    otherCitiesServed: [],
    deliveryOption: "own",
  });

  const [logoFile, setLogoFile] = useState(null);
  const [crFile, setCrFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/^0+/, ""); // remove leading zeros
    setFormData((prev) => ({
      ...prev,
      phone: `+966${value}`,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "otherCitiesServed") {
        data.append(key, JSON.stringify(value));
      } else {
        data.append(key, value);
      }
    });

    if (logoFile) data.append("companyLogo", logoFile);
    if (crFile) data.append("crLicense", crFile);

    try {
      const res = await axios.post(
        "https://marsos.com.sa/api1/api/create-supplier",
        data
      );
      toast.success("Supplier created successfully!");
      setFormData({
        name: "",
        phone: "",
        email: "",
        companyName: "",
        crNumber: "",
        address: "",
        city: "",
        region: "",
        otherCitiesServed: [],
        deliveryOption: "own",
      });
      setLogoFile(null);
      setCrFile(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to create supplier");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='max-w-md mx-auto bg-white p-6 rounded border mt-10'>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <input
          type='text'
          name='name'
          placeholder='Name'
          required
          value={formData.name}
          onChange={handleChange}
          className='w-full border rounded p-2'
        />

        <div className='flex gap-2 items-center'>
          <span className='p-2 border rounded bg-gray-100'>+966</span>
          <input
            type='text'
            placeholder='Phone Number'
            required
            inputMode='numeric'
            onChange={handlePhoneChange}
            className='flex-1 border rounded p-2'
          />
        </div>

        <input
          type='email'
          name='email'
          placeholder='Email'
          required
          value={formData.email}
          onChange={handleChange}
          className='w-full border rounded p-2'
        />

        <input
          type='text'
          name='companyName'
          placeholder='Company Name'
          required
          value={formData.companyName}
          onChange={handleChange}
          className='w-full border rounded p-2'
        />

        <label className='block font-semibold text-green-900 text-sm'>
          Upload your company logo (e.g., PNG or JPEG)
        </label>
        <input
          type='file'
          accept='image/png,image/jpeg'
          onChange={(e) => setLogoFile(e.target.files[0])}
          className='w-full border rounded p-2'
        />

        <input
          type='text'
          name='crNumber'
          placeholder='CR Number'
          required
          value={formData.crNumber}
          onChange={handleChange}
          className='w-full border rounded p-2'
        />

        <label className='block font-semibold text-green-900 text-sm'>
          Upload CR document (e.g., PDF or JPEG)
        </label>
        <input
          type='file'
          accept='application/pdf,image/jpeg'
          onChange={(e) => setCrFile(e.target.files[0])}
          className='w-full border rounded p-2'
        />

        <input
          type='text'
          name='address'
          placeholder='Full Address'
          required
          value={formData.address}
          onChange={handleChange}
          className='w-full border rounded p-2'
        />

        <input
          type='text'
          name='city'
          placeholder='City'
          required
          value={formData.city}
          onChange={handleChange}
          className='w-full border rounded p-2'
        />

        <input
          type='text'
          name='region'
          placeholder='Region'
          required
          value={formData.region}
          onChange={handleChange}
          className='w-full border rounded p-2'
        />

        <input
          type='text'
          name='otherCitiesServed'
          placeholder='Other Cities Served (comma separated)'
          value={formData.otherCitiesServed}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              otherCitiesServed: e.target.value.split(",").map((c) => c.trim()),
            }))
          }
          className='w-full border rounded p-2'
        />

        <div className='flex items-center gap-4 mt-2'>
          <label className='flex items-center gap-2 text-sm'>
            <input
              type='radio'
              name='deliveryOption'
              value='own'
              checked={formData.deliveryOption === "own"}
              onChange={handleChange}
            />
            Own Delivery
          </label>

          <label className='flex items-center gap-2 text-sm'>
            <input
              type='radio'
              name='deliveryOption'
              value='outside'
              checked={formData.deliveryOption === "outside"}
              onChange={handleChange}
            />
            Outside Delivery
          </label>
        </div>

        <button
          type='submit'
          className='w-full py-2 px-4 bg-green-700 hover:bg-green-800 text-white font-semibold rounded disabled:opacity-50'
          disabled={submitting}
        >
          {submitting ? "Saving..." : "Save Supplier"}
        </button>
      </form>
    </div>
  );
}
