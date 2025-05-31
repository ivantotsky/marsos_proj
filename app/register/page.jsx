"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Register() {
  const router = useRouter();

  const handleRoleSelection = (role) => {
    if (role === "supplier") {
      router.push("/supplier");
    } else if (role === "buyer") {
      router.push("/buyer");
    }
  };

  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4'>
      <div className='text-center mb-6'>
        <Image
          src='/logo.svg'
          alt='Logo'
          width={80}
          height={80}
          className='mx-auto mb-2'
        />
        <h2 className='text-2xl font-bold text-[#2d6a4f]'>Register as a</h2>
      </div>

      <div className='w-full max-w-sm bg-white p-6 rounded-lg shadow text-center'>
        <div className='flex justify-between mb-6 gap-4'>
          <Button
            onClick={() => handleRoleSelection("buyer")}
            className='w-full bg-[#2d6a4f] hover:bg-[#245e45] text-white font-bold'
          >
            Buyer
          </Button>
          {/* 
          <Button
            onClick={() => handleRoleSelection("supplier")}
            className="w-full bg-[#2d6a4f] hover:bg-[#245e45] text-white font-bold"
          >
            Supplier
          </Button> 
          */}
        </div>

        <p className='text-sm text-gray-600 mb-2'>
          Already have an account?{" "}
          <a
            href='/user-login'
            className='text-[#2d6a4f] font-semibold hover:underline'
          >
            Login
          </a>
        </p>

        <a
          href='/guest'
          className='text-[#2d6a4f] font-semibold hover:underline text-sm'
        >
          Browse as a Guest
        </a>
      </div>
    </div>
  );
}
