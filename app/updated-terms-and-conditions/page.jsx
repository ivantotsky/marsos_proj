// app/components/TermsAndConditions.jsx
"use client";

import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsAndConditions() {
  const [terms, setTerms] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTerms() {
      setLoading(true);
      try {
        const ref = doc(db, "policies", "termsAndConditions");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setTerms(snap.data().content);
        } else {
          console.error("No termsAndConditions doc found");
        }
      } catch (err) {
        console.error("Error fetching terms:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTerms();
  }, []);

  const handlePrint = () => window.print();

  return (
    <Card className='max-w-7xl mx-auto mt-12 border border-gray-200 rounded-xl shadow-xl'>
      <CardHeader className='flex items-center space-x-3 border-b pb-4 px-6'>
        <FileText className='w-6 h-6 text-success' />
        <div>
          <CardTitle className='uppercase text-xl tracking-wide text-gray-900'>
            Terms &amp; Conditions
          </CardTitle>
          <CardDescription className='text-sm text-gray-500'>
            Please read these terms carefully
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className='px-6 py-4'>
        {loading ? (
          <div className='space-y-3'>
            <Skeleton className='h-4 w-1/2' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-5/6' />
            <Skeleton className='h-4 w-3/4' />
          </div>
        ) : (
          <div className='prose prose-lg prose-gray'>
            <article dangerouslySetInnerHTML={{ __html: terms }} />
          </div>
        )}
      </CardContent>

      <CardFooter className='flex justify-end space-x-2 border-t pt-3 px-6'>
        <Button variant='outline' onClick={handlePrint}>
          Print
        </Button>
      </CardFooter>
    </Card>
  );
}
