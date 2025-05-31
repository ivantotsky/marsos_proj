// app/auth/pending/page.jsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PendingPage() {
  const router = useRouter();

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
      <Card className='max-w-md w-full'>
        <CardHeader>
          <CardTitle>Your registration is pending</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-sm text-gray-700'>
            Thanks for registering! Your account is under review. You’ll get an
            SMS as soon as an administrator approves you.
          </p>
          <Button
            variant='outline'
            onClick={() => router.push("/")}
            className='w-full'
          >
            Go to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
