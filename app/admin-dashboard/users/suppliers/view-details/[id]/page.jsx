"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Helper to format Firestore timestamps, raw objects, or ISO strings
function formatDate(ts) {
  if (ts?.toDate) {
    return ts.toDate().toLocaleString();
  }
  if (ts?.seconds) {
    return new Date(ts.seconds * 1000).toLocaleString();
  }
  if (typeof ts === "string") {
    return new Date(ts).toLocaleString();
  }
  return "—";
}

export default function SupplierDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [supplier, setSupplier] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch supplier data
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", id));
        if (!snap.exists()) {
          toast.error("Supplier not found.");
          router.back();
          return;
        }
        const data = { id: snap.id, ...snap.data() };
        setSupplier(data);
        setForm(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load supplier details.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  // Handle form field changes
  const onChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Save updates to Firestore
  const onSave = async () => {
    setSaving(true);
    try {
      const ref = doc(db, "users", id);
      const updates = {
        // Identity & contact
        name: form.name,
        email: form.email,
        phone: form.phone,
        companyPhone: form.companyPhone,
        representativeName: form.representativeName,
        representativeEmail: form.representativeEmail,
        representativePhone: form.representativePhone,
        // Company
        companyName: form.companyName,
        fullAddress: form.fullAddress,
        city: form.city,
        zipCode: form.zipCode,
        country: form.country,
        otherCitiesServed: form.otherCitiesServed,
        region: form.region,
        exportCountries: form.exportCountries,
        // Documents & licenses
        crNumber: form.crNumber,
        pidNumber: form.pidNumber,
        unifiedNumber: form.unifiedNumber,
        crDocument: form.crDocument,
        crLicenseUrl: form.crLicenseUrl,
        crIssueG: form.crIssueG,
        crConfirmG: form.crConfirmG,
        crIssueH: form.crIssueH,
        crConfirmH: form.crConfirmH,
        // Banking
        accountHolderName: form.accountHolderName,
        accountNumber: form.accountNumber,
        iban: form.iban,
        swiftCode: form.swiftCode,
        bankName: form.bankName,
        // Tax & compliance
        vatNumber: form.vatNumber,
        isApproved: form.isApproved,
        // Business details
        description: form.description,
        mainCategory: form.mainCategory,
        leadTime: form.leadTime,
        paymentTerms: form.paymentTerms,
        shippingMethod: form.shippingMethod,
        productionCapacity: form.productionCapacity,
        // Media
        logoUrl: form.logoUrl,
        productImages: form.productImages,
      };
      await updateDoc(ref, updates);
      toast.success("Supplier updated!");
      setSupplier((prev) => ({ ...prev, ...updates }));
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className='p-8 text-gray-500'>Loading supplier...</p>;
  }

  // Renders either an input (in edit mode) or text/link
  const renderField = (label, field, type = "text", linkText) => (
    <div className='flex flex-col'>
      <label className='font-medium mb-1'>{label}</label>
      {isEditing ? (
        <input
          type={type}
          value={form[field] ?? ""}
          onChange={onChange(field)}
          className='border px-2 py-1 rounded'
        />
      ) : linkText && supplier[field] ? (
        <a
          href={supplier[field]}
          target='_blank'
          rel='noreferrer'
          className='text-blue-600 hover:underline'
        >
          {linkText}
        </a>
      ) : (
        <span>{supplier[field] ?? "—"}</span>
      )}
    </div>
  );

  return (
    <div className='px-6 py-8 max-w-4xl mx-auto'>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-bold'>Supplier Details</h1>
        <div className='space-x-2'>
          <Button
            variant='outline'
            onClick={() => setIsEditing((e) => !e)}
            disabled={saving}
          >
            {isEditing ? "Cancel" : "Edit"}
          </Button>
          {isEditing && (
            <Button onClick={onSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          )}
          <Button variant='outline' onClick={() => router.back()}>
            ← Back
          </Button>
        </div>
      </div>

      <Card className='mb-6'>
        <CardHeader>
          <CardTitle className='text-xl'>
            {supplier.companyName || supplier.name || "—"}
          </CardTitle>
        </CardHeader>
        <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* System fields */}
          <div className='flex flex-col'>
            <label className='font-medium mb-1'>Created At</label>
            <span>{formatDate(supplier.createdAt)}</span>
          </div>
          <div className='flex flex-col'>
            <label className='font-medium mb-1'>Role</label>
            <span>{supplier.role}</span>
          </div>
          <div className='flex flex-col'>
            <label className='font-medium mb-1'>UID</label>
            <span>{supplier.uid}</span>
          </div>

          {/* Editable fields */}
          {renderField("Name", "name")}
          {renderField("Email", "email", "email")}
          {renderField("Phone", "phone", "tel")}
          {renderField("Company Phone", "companyPhone", "tel")}
          {renderField("Representative Name", "representativeName")}
          {renderField("Representative Email", "representativeEmail", "email")}
          {renderField("Representative Phone", "representativePhone", "tel")}

          {renderField("Company Name", "companyName")}
          {renderField("Description", "description")}

          {renderField("Full Address", "fullAddress")}
          {renderField("City", "city")}
          {renderField("ZIP Code", "zipCode")}
          {renderField("Country", "country")}
          {renderField("Other Cities Served", "otherCitiesServed")}
          {renderField("Region", "region")}
          {renderField("Export Countries", "exportCountries")}

          {renderField("Main Category", "mainCategory")}
          {renderField("Lead Time", "leadTime")}
          {renderField("Payment Terms", "paymentTerms")}
          {renderField("Shipping Method", "shippingMethod")}
          {renderField("Production Capacity", "productionCapacity")}

          {renderField("CR Number", "crNumber")}
          {renderField("PID Number", "pidNumber")}
          {renderField("Unified Number", "unifiedNumber")}
          {renderField("CR Document", "crDocument", "url", "View CR")}
          {renderField("CR License URL", "crLicenseUrl", "url", "View License")}
          {renderField("CR Issue (G)", "crIssueG", "date")}
          {renderField("CR Confirm (G)", "crConfirmG", "date")}
          {renderField("CR Issue (H)", "crIssueH", "date")}
          {renderField("CR Confirm (H)", "crConfirmH", "date")}

          {renderField("Account Holder Name", "accountHolderName")}
          {renderField("Account Number", "accountNumber")}
          {renderField("IBAN", "iban")}
          {renderField("SWIFT Code", "swiftCode")}
          {renderField("Bank Name", "bankName")}

          {renderField("VAT Number", "vatNumber")}
          <div className='flex flex-col'>
            <label className='font-medium mb-1'>Approved?</label>
            {isEditing ? (
              <select
                value={form.isApproved ? "true" : "false"}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    isApproved: e.target.value === "true",
                  }))
                }
                className='border px-2 py-1 rounded'
              >
                <option value='true'>Yes</option>
                <option value='false'>No</option>
              </select>
            ) : (
              <span>{supplier.isApproved ? "✅ Yes" : "❌ No"}</span>
            )}
          </div>

          {/* Logo and product images */}
          {renderField("Logo", "logoUrl", "url", "View Logo")}
          <div className='flex flex-col'>
            <label className='font-medium mb-1'>Product Images</label>
            {isEditing ? (
              <textarea
                value={(form.productImages || []).join("\n")}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    productImages: e.target.value.split("\n"),
                  }))
                }
                className='border px-2 py-1 rounded h-24'
              />
            ) : Array.isArray(supplier.productImages) &&
              supplier.productImages.length > 0 ? (
              <ul className='list-disc list-inside'>
                {supplier.productImages.map((url, idx) => (
                  <li key={idx}>
                    <a
                      href={url}
                      target='_blank'
                      rel='noreferrer'
                      className='text-blue-600 hover:underline'
                    >
                      Image {idx + 1}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <span>—</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
