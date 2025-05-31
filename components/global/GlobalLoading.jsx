"use client";

import { useEffect } from "react";
import { useLoading } from "@/context/LoadingContext";
import { useRouter } from "next/navigation";
import Image from "next/image";

const GlobalLoading = () => {
  const { isLoading, startLoading, stopLoading } = useLoading();
  const router = useRouter();

  useEffect(() => {
    if (!router) return;

    const handleStart = () => startLoading();
    const handleComplete = () => stopLoading();
    const handleError = () => stopLoading();

    router.events?.on("routeChangeStart", handleStart);
    router.events?.on("routeChangeComplete", handleComplete);
    router.events?.on("routeChangeError", handleError);

    return () => {
      router.events?.off("routeChangeStart", handleStart);
      router.events?.off("routeChangeComplete", handleComplete);
      router.events?.off("routeChangeError", handleError);
    };
  }, [router, startLoading, stopLoading]);

  if (!isLoading) return null;

  return (
    <div className='fixed inset-0 z-[9999] bg-white flex items-center justify-center'>
      <div className='relative w-32 h-32 flex items-center justify-center'>
        {/* Rotating Circle */}
        <div className='absolute w-full h-full border-2 border-gray-200 border-t-[#2c6449] rounded-full animate-slow-spin'></div>

        {/* Logo in Center */}
        <Image
          src='/logo.png'
          alt='Loading Logo'
          width={120}
          height={120}
          priority
          className='object-contain rounded-full fade-in'
        />
      </div>
    </div>
  );
};

export default GlobalLoading;
