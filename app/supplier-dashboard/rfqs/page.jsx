"use client";

import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { db } from "@/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useSelector } from "react-redux";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const SupplierRFQs = () => {
  const auth = getAuth();
  const { user: userData, loading: authLoading } = useSelector(
    (state) => state.auth
  );
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // wait for auth state
    if (authLoading) return;

    const currentUser = auth.currentUser;
    const supplierId = userData?.uid || currentUser?.uid;

    if (!supplierId) {
      console.warn("No supplier ID found.");
      setLoading(false);
      return;
    }

    const fetchRFQs = async () => {
      try {
        const q = query(
          collection(db, "rfqs"),
          where("supplierId", "==", supplierId)
        );
        const snapshot = await getDocs(q);
        setRfqs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching RFQs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRFQs();
  }, [authLoading, auth.currentUser, userData]);

  return (
    <div className='w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
      <h2 className='text-2xl font-semibold mb-4'>Manage RFQs</h2>

      {loading ? (
        <div className='space-y-3'>
          <Skeleton className='h-6 w-1/3' />
          <Skeleton className='h-20 rounded-md' />
          <Skeleton className='h-20 rounded-md' />
        </div>
      ) : rfqs.length === 0 ? (
        <p className='text-muted-foreground text-sm'>
          No RFQs found for your account.
        </p>
      ) : (
        <div className='space-y-4'>
          {rfqs.map((rfq) => (
            <Card key={rfq.id} className='p-4 shadow-sm'>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
                <div>
                  <h3 className='text-base font-medium'>{rfq.supplierName}</h3>
                  <p className='text-sm text-muted-foreground'>
                    Category: {rfq.category || "N/A"}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Shipping: {rfq.shipping || "N/A"}
                  </p>
                </div>
                <Badge variant='outline' className='self-start sm:self-auto'>
                  RFQ ID: {rfq.id}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupplierRFQs;
