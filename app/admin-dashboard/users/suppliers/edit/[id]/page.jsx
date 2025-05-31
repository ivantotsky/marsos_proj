// app/admin-dashboard/users/suppliers/edit/[id]/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function TextField({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={onChange} />
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder }) {
  // Always pass a string to `value` (even if empty)
  const safeValue = value || "";
  return (
    <div>
      <Label>{label}</Label>
      <Select value={safeValue} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function MultiSelectField({ label, value, onChange, options, placeholder }) {
  // Always pass an array to `value` (even if empty)
  const safeValue = Array.isArray(value) ? value : [];
  return (
    <div>
      <Label>{label}</Label>
      <Select multiple value={safeValue} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function PhoneField({
  countryCode,
  mainNumber,
  setCountryCode,
  setMainNumber,
}) {
  const countryOptions = ["+966", "+971", "+973", "+974", "+965", "+968"].map(
    (c) => ({ label: c, value: c })
  );
  return (
    <div>
      <Label>Phone</Label>
      <div className='flex gap-2'>
        <SelectField
          label='' // we already rendered Label above
          value={countryCode}
          onChange={setCountryCode}
          options={countryOptions}
          placeholder='+966'
        />
        <Input
          className='flex-1'
          value={mainNumber}
          onChange={(e) => setMainNumber(e.target.value)}
        />
      </div>
    </div>
  );
}

export default function EditSupplierPage() {
  const { id: supplierId } = useParams();
  const router = useRouter();

  const [supplier, setSupplier] = useState({
    name: "",
    email: "",
    companyName: "",
    city: "",
    otherCitiesServed: [],
    logoUrl: "",
    crLicenseUrl: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);

  const [countryCode, setCountryCode] = useState("+966");
  const [mainNumber, setMainNumber] = useState("");

  const saudiCities = [
    "Riyadh",
    "Jeddah",
    "Mecca",
    "Medina",
    "Dammam",
    "Khobar",
    "Taif",
    "Tabuk",
    "Qatif",
    "Abha",
    "Khamis Mushait",
    "Al Khafji",
    "Hafar Al-Batin",
    "Al Qunfudhah",
    "Yanbu",
    "Najran",
    "Jizan",
    "Al Hasa",
    "Hail",
    "Al Baha",
    "Al Jubail",
  ];

  useEffect(() => {
    async function fetchSupplier() {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "users", supplierId));
        if (snap.exists()) {
          const data = snap.data();
          const normalized = {
            name: data.name || "",
            email: data.email || "",
            companyName: data.companyName || "",
            city: data.city || "",
            otherCitiesServed: data.otherCitiesServed || [],
            logoUrl: data.logoUrl || "",
            crLicenseUrl: data.crLicenseUrl || "",
            phone: data.phone || "",
          };
          const match = normalized.phone.match(/^(\+\d+)(\d{6,})$/);
          if (match) {
            setCountryCode(match[1]);
            setMainNumber(match[2]);
          }
          setSupplier(normalized);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSupplier();
  }, [supplierId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "users", supplierId), {
        ...supplier,
        phone: `${countryCode}${mainNumber}`,
      });
      router.back();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p className='p-4'>Loading…</p>;

  return (
    <Card className='max-w-2xl mx-auto my-8'>
      <CardHeader>
        <CardTitle>Edit Supplier</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <TextField
            label='Name'
            value={supplier.name}
            onChange={(e) => setSupplier({ ...supplier, name: e.target.value })}
          />

          <PhoneField
            countryCode={countryCode}
            mainNumber={mainNumber}
            setCountryCode={setCountryCode}
            setMainNumber={setMainNumber}
          />

          <TextField
            label='Email'
            type='email'
            value={supplier.email}
            onChange={(e) =>
              setSupplier({ ...supplier, email: e.target.value })
            }
          />

          <TextField
            label='Company Name'
            value={supplier.companyName}
            onChange={(e) =>
              setSupplier({ ...supplier, companyName: e.target.value })
            }
          />

          {supplier.logoUrl && (
            <div>
              <Label>Existing Logo</Label>
              <img
                src={supplier.logoUrl}
                alt='Logo'
                className='w-32 h-32 object-contain mb-2'
              />
            </div>
          )}

          {supplier.crLicenseUrl && (
            <div>
              <Label>Existing CR License</Label>
              <img
                src={supplier.crLicenseUrl}
                alt='CR License'
                className='w-full h-48 object-contain mb-2'
              />
            </div>
          )}

          <SelectField
            label='City'
            value={supplier.city}
            onChange={(city) => setSupplier({ ...supplier, city })}
            options={saudiCities.map((c) => ({ label: c, value: c }))}
            placeholder='Select a city'
          />

          <MultiSelectField
            label='Other Cities Served'
            value={supplier.otherCitiesServed}
            onChange={(vals) =>
              setSupplier({ ...supplier, otherCitiesServed: vals })
            }
            options={saudiCities.map((c) => ({ label: c, value: c }))}
            placeholder='Select cities'
          />

          <div className='flex justify-end gap-2'>
            <Button type='submit'>Save Changes</Button>
            <Button variant='outline' onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
