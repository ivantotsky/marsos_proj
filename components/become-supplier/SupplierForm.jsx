// components/SupplierForm.jsx
"use client";

import React from "react";

export default function SupplierForm({
  formData,
  onChange,
  onNext,
  categories,
  selectedPhoneCode,
  setSelectedPhoneCode,
}) {
  return (
    <form
      onSubmit={onNext}
      className='max-w-5xl mx-auto bg-white p-6 shadow rounded-lg space-y-8'
    >
      {/* ——— HEADER ——— */}
      <h2 className='text-2xl font-bold text-[#2c6449]'>
        Supplier Registration
      </h2>

      {/* ——— TWO-COLUMN GRID ——— */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* — LEFT COLUMN — */}
        <div className='space-y-6'>
          {/* Company Name */}
          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Company Name *
            </label>
            <input
              name='companyName'
              value={formData.companyName}
              onChange={onChange}
              required
              placeholder='e.g. Acme Trading Co.'
              className='mt-1 block w-full border-gray-300 rounded p-2'
            />
          </div>

          {/* CR Number */}
          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Commercial Reg. (CR) No. *
            </label>
            <input
              name='crNumber'
              value={formData.crNumber}
              onChange={onChange}
              required
              placeholder='1234567890'
              className='mt-1 block w-full border-gray-300 rounded p-2'
            />
          </div>

          {/* CR Expiry Dates */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700'>
                CR Expires (G) *
              </label>
              <input
                type='date'
                name='crIssueG'
                value={formData.crIssueG}
                onChange={onChange}
                required
                className='mt-1 block w-full border-gray-300 rounded p-2'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700'>
                CR Expires (H) *
              </label>
              <input
                type='date'
                name='crIssueH'
                value={formData.crIssueH}
                onChange={onChange}
                required
                className='mt-1 block w-full border-gray-300 rounded p-2'
              />
            </div>
          </div>

          {/* Work Email */}
          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Work Email *
            </label>
            <input
              type='email'
              name='representativeEmail'
              value={formData.representativeEmail}
              onChange={onChange}
              required
              placeholder='name@company.com'
              className='mt-1 block w-full border-gray-300 rounded p-2'
            />
          </div>

          {/* Phone */}
          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Phone Number *
            </label>
            <div className='flex'>
              <select
                value={selectedPhoneCode}
                onChange={(e) => setSelectedPhoneCode(e.target.value)}
                className='border-gray-300 rounded-l p-2'
              >
                {/* map your defaultCountryCodeOptions here */}
                <option value='+966'>+966</option>
                {/* … */}
              </select>
              <input
                type='tel'
                name='representativePhone'
                value={formData.representativePhone}
                onChange={onChange}
                required
                placeholder='5XXXXXXXX'
                className='flex-1 border-t border-b border-r border-gray-300 rounded-r p-2'
              />
            </div>
          </div>

          {/* City & Region */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700'>
                City *
              </label>
              <input
                name='city'
                value={formData.city}
                onChange={onChange}
                required
                placeholder='Riyadh'
                className='mt-1 block w-full border-gray-300 rounded p-2'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700'>
                Region *
              </label>
              <input
                name='region'
                value={formData.region}
                onChange={onChange}
                required
                placeholder='Riyadh Province'
                className='mt-1 block w-full border-gray-300 rounded p-2'
              />
            </div>
          </div>

          {/* Full Address */}
          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Full Address *
            </label>
            <input
              name='fullAddress'
              value={formData.fullAddress}
              onChange={onChange}
              required
              placeholder='Street, PO Box, Building'
              className='mt-1 block w-full border-gray-300 rounded p-2'
            />
          </div>

          {/* ZIP Code & Country */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700'>
                ZIP Code *
              </label>
              <input
                name='zipCode'
                value={formData.zipCode}
                onChange={onChange}
                required
                placeholder='11564'
                className='mt-1 block w-full border-gray-300 rounded p-2'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700'>
                Country *
              </label>
              <input
                name='country'
                value={formData.country}
                onChange={onChange}
                required
                placeholder='Saudi Arabia'
                className='mt-1 block w-full border-gray-300 rounded p-2'
              />
            </div>
          </div>
        </div>

        {/* — RIGHT COLUMN — */}
        <div className='space-y-6'>
          {/* Main Category */}
          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Main Product Category *
            </label>
            <select
              name='mainCategory'
              value={formData.mainCategory}
              onChange={onChange}
              required
              className='mt-1 block w-full border-gray-300 rounded p-2'
            >
              <option value=''>Select category</option>
              {categories.map((c, i) => (
                <option key={i} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Export Countries */}
          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Export Countries
            </label>
            <input
              name='exportCountries'
              value={formData.exportCountries}
              onChange={onChange}
              placeholder='e.g. UAE, Egypt'
              className='mt-1 block w-full border-gray-300 rounded p-2'
            />
          </div>

          {/* Production Capacity */}
          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Monthly Production Capacity *
            </label>
            <input
              name='productionCapacity'
              value={formData.productionCapacity}
              onChange={onChange}
              required
              placeholder='10,000 units'
              className='mt-1 block w-full border-gray-300 rounded p-2'
            />
          </div>

          {/* Shipping Method */}
          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Shipping Method *
            </label>
            <select
              name='shippingMethod'
              value={formData.shippingMethod}
              onChange={onChange}
              required
              className='mt-1 block w-full border-gray-300 rounded p-2'
            >
              <option value=''>Select method</option>
              <option>Sea freight</option>
              <option>Air freight</option>
              <option>Courier</option>
            </select>
          </div>

          {/* Lead Time */}
          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Delivery Time (days) *
            </label>
            <input
              type='number'
              name='leadTime'
              value={formData.leadTime}
              onChange={onChange}
              required
              placeholder='5'
              className='mt-1 block w-full border-gray-300 rounded p-2'
            />
          </div>

          {/* Payment Terms */}
          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Payment Terms *
            </label>
            <select
              name='paymentTerms'
              value={formData.paymentTerms}
              onChange={onChange}
              required
              className='mt-1 block w-full border-gray-300 rounded p-2'
            >
              <option value=''>Select terms</option>
              <option>T/T</option>
              <option>L/C</option>
            </select>
          </div>

          {/* Bank Details */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700'>
                Bank Name *
              </label>
              <input
                name='bankName'
                value={formData.bankName}
                onChange={onChange}
                required
                className='mt-1 block w-full border-gray-300 rounded p-2'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700'>
                Account Number *
              </label>
              <input
                name='accountNumber'
                value={formData.accountNumber}
                onChange={onChange}
                required
                className='mt-1 block w-full border-gray-300 rounded p-2'
              />
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700'>
                IBAN *
              </label>
              <input
                name='iban'
                value={formData.iban}
                onChange={onChange}
                required
                className='mt-1 block w-full border-gray-300 rounded p-2'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700'>
                Swift Code *
              </label>
              <input
                name='swiftCode'
                value={formData.swiftCode}
                onChange={onChange}
                required
                className='mt-1 block w-full border-gray-300 rounded p-2'
              />
            </div>
          </div>

          {/* Description & Images */}
          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Description *
            </label>
            <textarea
              name='description'
              value={formData.description}
              onChange={onChange}
              required
              rows={4}
              className='mt-1 block w-full border-gray-300 rounded p-2'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Product Images
            </label>
            <input
              type='file'
              name='productImages'
              multiple
              onChange={onChange}
              className='mt-1 block w-full border-gray-300 rounded p-2'
            />
          </div>
        </div>
      </div>

      {/* ——— ACTIONS ——— */}
      <div className='flex justify-end space-x-4'>
        <button
          type='button'
          onClick={onNext}
          className='bg-[#2c6449] text-white font-semibold px-6 py-2 rounded hover:bg-[#1b4533]'
        >
          Next: Review
        </button>
      </div>
    </form>
  );
}
