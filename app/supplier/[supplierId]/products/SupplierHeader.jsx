// app/supplier/[supplierId]/products/SupplierHeader.jsx
"use client";

import React from "react";
import Link from "next/link";
import { ChevronDown, Search as SearchIcon, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

export default function SupplierHeader({ supplier }) {
  const { t } = useTranslation();
  const [inSite, setInSite] = React.useState(t("supplierHeader.inThisSite"));
  const [query, setQuery] = React.useState("");
  const sites = [
    t("supplierHeader.inThisSite"),
    t("supplierHeader.entireMarketplace"),
  ];

  if (!supplier) {
    return (
      <header className='bg-white shadow p-4 text-sm text-center'>
        {t("supplierHeader.loading")}
      </header>
    );
  }

  const logoUrl = supplier.logoUrl || "/logo.png";
  const memberType = Array.isArray(supplier.memberType)
    ? supplier.memberType.join(", ")
    : supplier.memberType || t("supplierHeader.notSecured");
  const isAuditedLabel = supplier.isAudited
    ? t("supplierHeader.audited")
    : t("supplierHeader.notAudited");
  const isSecuredLabel = supplier.isSecured
    ? t("supplierHeader.secured")
    : t("supplierHeader.notSecured");

  return (
    <header className='bg-white shadow'>
      <div className='flex flex-wrap items-center justify-between max-w-full mx-auto px-4 py-3 text-sm'>
        {/* Logo & Badges */}
        <div className='flex flex-wrap items-center space-x-2 sm:space-x-3 mb-2 sm:mb-0 w-full sm:w-auto'>
          <Link href='/' className='block flex-shrink-0'>
            <img
              src={logoUrl}
              alt={supplier.companyName}
              width={100}
              height={32}
              className='object-contain'
            />
          </Link>
          <span className='inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs'>
            {memberType}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
              supplier.isAudited
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {isAuditedLabel}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
              supplier.isSecured
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {isSecuredLabel}
          </span>
        </div>

        {/* Search & Actions */}
        <div className='flex flex-wrap items-center space-x-2 w-full sm:w-auto'>
          {/* Site toggle */}
          <button
            onClick={() => {
              const next = sites[(sites.indexOf(inSite) + 1) % sites.length];
              setInSite(next);
            }}
            className='inline-flex items-center border rounded px-3 py-1 text-xs'
          >
            {inSite} <ChevronDown size={14} className='ml-1' />
          </button>

          {/* Search form */}
          <form
            action='/search'
            method='get'
            className='flex flex-1 min-w-[150px] border rounded overflow-hidden'
          >
            <Input
              name='q'
              type='text'
              placeholder={t("supplierHeader.searchPlaceholder")}
              className='px-3 py-1 focus:outline-none text-xs'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type='submit' className='px-3 border-l'>
              <SearchIcon size={16} />
            </button>
          </form>

          {/* Post sourcing request link */}
          <Link
            href={`/supplier/${supplier.uid}/products/post-sourcing-request`}
            className='inline-flex items-center border rounded px-3 py-1 hover:bg-gray-50 text-xs'
          >
            <PlusCircle size={14} className='mr-1' />
            {t("supplierHeader.postSourcingRequest")}
          </Link>
        </div>
      </div>
    </header>
  );
}
