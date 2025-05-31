// app/supplier/[supplierId]/products/SupplierProfile.jsx
"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SupplierProfile({ supplier }) {
  const { t, i18n } = useTranslation();
  const dir = i18n.language.startsWith("ar") ? "rtl" : "ltr";

  if (!supplier) {
    return (
      <div className='p-8 text-center text-sm'>
        {t("supplierProfile.loading")}
      </div>
    );
  }

  function renderVal(val) {
    if (val == null) return t("supplierProfile.notSpecified");
    if (Array.isArray(val)) return val.join(", ");
    if (typeof val === "object") return Object.values(val).join(", ");
    return String(val);
  }

  const logoUrl = supplier.logoUrl || "/assets/company-intro.jpg";
  const memberType = Array.isArray(supplier.memberType)
    ? supplier.memberType.join(", ")
    : supplier.memberType || t("supplierProfile.notSpecified");
  const isAuditedLabel = supplier.isAudited
    ? t("supplierProfile.audited")
    : t("supplierProfile.notAudited");
  const isSecuredLabel = supplier.isSecured
    ? t("supplierProfile.secured")
    : t("supplierProfile.notSecured");

  return (
    <div dir={dir} className='max-w-full mx-auto space-y-8 px-4 py-6'>
      {/* Company Profile Section */}
      <section className='space-y-6 border-t pt-6'>
        <h2 className='text-xl sm:text-2xl font-bold'>
          {t("supplierProfile.sections.companyProfile")}
        </h2>
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
          {/* Left block */}
          <div className='space-y-4 flex flex-col items-center lg:items-start'>
            <img
              src={logoUrl}
              alt={renderVal(supplier.companyName)}
              className='w-32 h-auto rounded mb-2'
            />
            <div className='flex space-x-1'>
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`h-3 w-3 rounded-full ${
                    i === 1 ? "bg-red-600" : "bg-white border border-gray-400"
                  }`}
                />
              ))}
            </div>
            <Button variant='outline' className='w-full sm:w-auto text-sm'>
              {t("supplierProfile.buttons.virtualTour")}
            </Button>
            <Button variant='outline' className='w-full sm:w-auto text-sm'>
              {t("supplierProfile.buttons.bookTour")}
            </Button>
          </div>

          {/* Right block */}
          <div className='space-y-4 lg:col-span-3'>
            <ul className='space-y-3 text-sm'>
              {[
                ["businessType", supplier.businessType],
                ["crNumber", supplier.crNumber],
                ["vatNumber", supplier.vatNumber],
                ["mainProducts", supplier.mainProducts],
                ["yearOfEstablishment", supplier.yearOfEstablishment],
                ["numberOfEmployees", supplier.numberOfEmployees],
                ["address", supplier.address],
              ].map(([key, val]) => (
                <li key={key} className='flex items-start'>
                  <Check className='h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-1' />
                  <div className='flex-1'>
                    <strong>{t(`supplierProfile.fields.${key}`)}:</strong>{" "}
                    {renderVal(val)}
                  </div>
                </li>
              ))}

              {/* Audit report */}
              <li className='flex flex-col sm:flex-row items-start sm:items-center'>
                <div className='flex items-start flex-1'>
                  <Check className='h-5 w-5 text-green-500 mr-2 mt-1' />
                  <div>
                    <strong>
                      {t("supplierProfile.fields.auditReportNo")}:
                    </strong>{" "}
                    <span className='font-semibold'>
                      {renderVal(supplier.auditReportNo)}
                    </span>
                  </div>
                </div>
                <div className='flex space-x-2 mt-2 sm:mt-0'>
                  <Link
                    href='#'
                    className='text-blue-600 hover:underline text-sm'
                  >
                    {t("supplierProfile.links.verify")}
                  </Link>
                  <span>|</span>
                  <Link
                    href='#'
                    className='text-blue-600 hover:underline text-sm'
                  >
                    {t("supplierProfile.links.readReport")}
                  </Link>
                </div>
              </li>
            </ul>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-sm'>
              <div>
                <p>
                  <strong>{t("supplierProfile.fields.rating")}:</strong>{" "}
                  <span className='text-lg font-semibold'>
                    {renderVal(supplier.rating)}
                  </span>
                </p>
              </div>
              <div>
                <p>
                  <strong>
                    {t("supplierProfile.fields.averageResponseTime")}:
                  </strong>{" "}
                  {renderVal(supplier.averageResponseTime)}
                </p>
              </div>
            </div>

            <p className='text-gray-700 text-sm whitespace-pre-line'>
              {renderVal(supplier.companyDescription)}
            </p>

            <Link href='#' className='text-blue-600 hover:underline text-sm'>
              {t("supplierProfile.viewAll")}
            </Link>
          </div>
        </div>
      </section>

      {/* General Information Section */}
      <section className='border p-4 sm:p-6 rounded-lg bg-white'>
        <h3 className='text-lg sm:text-xl font-semibold mb-4'>
          {t("supplierProfile.sections.generalInfo")}
        </h3>
        <div className='flex flex-col sm:flex-row justify-between items-center text-sm text-gray-700 mb-4'>
          <div className='flex items-center space-x-1'>
            <span>
              {t("supplierProfile.verifiedCount", {
                count: supplier.verifiedItems || 0,
              })}
            </span>
            <Check className='h-4 w-4 text-green-500' />
            <span>By Marsos</span>
          </div>
        </div>
        <ul className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
          {[
            "businessType",
            "mainProducts",
            "yearOfEstablishment",
            "numberOfEmployees",
            "productCertification",
            "plantArea",
            "registeredCapital",
          ].map((key) => (
            <li key={key} className='flex items-start'>
              <Check
                className={`h-5 w-5 mr-2 mt-1 ${
                  supplier[key] ? "text-green-500" : "text-gray-300"
                }`}
              />
              <div>
                <strong>{t(`supplierProfile.fields.${key}`)}:</strong>{" "}
                {renderVal(supplier[key])}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
