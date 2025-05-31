// app/suppliers/page.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { db } from "@/firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";

import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("role", "==", "supplier")
        );
        const snap = await getDocs(q);
        setSuppliers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching suppliers:", err);
      }
    };
    fetchSuppliers();
  }, []);

  const industries = useMemo(
    () => Array.from(new Set(suppliers.map((s) => s.industry).filter(Boolean))),
    [suppliers]
  );

  const filtered = useMemo(
    () =>
      suppliers.filter((s) => {
        const name = (s.name || "").toLowerCase();
        if (!name.includes(search.toLowerCase())) return false;
        if (industryFilter && s.industry !== industryFilter) return false;
        return true;
      }),
    [suppliers, search, industryFilter]
  );

  return (
    <section className='max-w-6xl mx-auto px-6 py-12'>
      <h1 className='text-3xl font-bold text-[#2c6449] mb-4'>
        Verified Top Suppliers
      </h1>
      <p className='text-gray-600 mb-6 max-w-2xl'>
        Discover top-rated manufacturers and suppliers across the Kingdom of
        Saudi Arabia. All suppliers are verified for quality, communication, and
        operational excellence.
      </p>

      {/* Filters */}
      <div className='flex flex-col md:flex-row gap-4 mb-8'>
        <Input
          placeholder='Search suppliers...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='md:w-1/2'
        />

        <select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className='w-full md:w-1/4 px-4 py-2 border rounded-lg shadow-sm'
        >
          <option value=''>All Categories</option>
          {industries.map((ind) => (
            <option key={ind} value={ind}>
              {ind}
            </option>
          ))}
        </select>
      </div>

      {/* Supplier Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'>
        {filtered.map((sup) => (
          <Card key={sup.id} className='shadow-sm hover:shadow-md transition'>
            <CardContent className='p-4'>
              <div className='flex items-start gap-4 mb-3'>
                {sup.logo ? (
                  <img
                    src={sup.logo}
                    alt={sup.name}
                    className='w-14 h-14 rounded-full border border-gray-300 object-cover'
                  />
                ) : (
                  <div className='w-14 h-14 rounded-full bg-[#2c6449] flex items-center justify-center text-white font-semibold text-sm border border-gray-300'>
                    {sup.name?.[0]?.toUpperCase() ?? "S"}
                  </div>
                )}

                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <h2 className='font-semibold text-[#2c6449]'>{sup.name}</h2>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        sup.status === "online" ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    <span className='text-xs text-gray-500'>
                      {sup.status === "online" ? "Online" : "Offline"}
                    </span>
                  </div>
                  {sup.location && (
                    <p className='text-xs text-gray-500'>{sup.location}</p>
                  )}
                  <span className='inline-block mt-1 text-xs bg-gray-100 text-[#2c6449] px-2 py-[2px] rounded-full'>
                    {sup.industry ?? "General"}
                  </span>
                </div>
              </div>

              <p className='text-sm text-gray-700 mb-3'>{sup.description}</p>

              <div className='flex flex-wrap gap-2 justify-end'>
                <Link href={`/supplier/${sup.id}`}>
                  <Button size='sm' variant='default'>
                    View Products
                  </Button>
                </Link>
                <Link href={`/chat/product/${sup.id}`}>
                  <Button size='sm' variant='outline'>
                    Contact Supplier
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
