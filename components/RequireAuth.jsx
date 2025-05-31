// components/RequireAuth.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/user-login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className='p-4 text-center'> </div>;
  }

  return <>{children}</>;
}
