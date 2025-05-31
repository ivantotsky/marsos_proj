"use client";

import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/config";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MailIcon, LockIcon } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);

      if (user.email !== "marsos@ayn-almanal.com") {
        toast.error("Access denied: Not an admin account");
        setLoading(false);
        return;
      }

      // 1️⃣ Create the session cookie via your API
      const idToken = await user.getIdToken();
      const res = await fetch("/api/sessionLogin", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) throw new Error("Failed to create session");

      toast.success("Login successful");
      // 2️⃣ HARD redirect so the new cookie is sent on the next request:
      window.location.href = "/admin-dashboard";
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Invalid credentials or session setup failed");
      setLoading(false);
    }
  };

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 min-h-[80vh] items-center bg-white'>
      {/* Left: Login Form */}
      <div className='flex flex-col justify-center px-6 py-12 lg:px-24 h-full'>
        <h1 className='mb-8 text-2xl font-semibold text-center'>
          Marsos Admin
        </h1>

        <div className='mx-auto w-full max-w-md space-y-6'>
          {/* Email */}
          <div className='space-y-1'>
            <label htmlFor='email' className='text-sm font-medium'>
              Email
            </label>
            <div className='relative'>
              <Input
                id='email'
                type='email'
                placeholder='admin@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='pr-10'
              />
              <MailIcon className='absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
            </div>
          </div>

          {/* Password */}
          <div className='space-y-1'>
            <label htmlFor='password' className='text-sm font-medium'>
              Password
            </label>
            <div className='relative'>
              <Input
                id='password'
                type='password'
                placeholder='••••••••'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='pr-10'
              />
              <LockIcon className='absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
            </div>
          </div>

          {/* Login Button */}
          <Button
            onClick={handleLogin}
            disabled={loading}
            className='w-full bg-[#2c6449] hover:bg-[#24523b] text-white'
          >
            {loading ? "Logging in…" : "Login"}
          </Button>
        </div>
      </div>

      {/* Right Panel */}
      <div className='hidden lg:flex h-full bg-gray-100 items-center justify-center'>
        <img src='/logo.svg' alt='Logo' className='w-40 h-40 object-contain' />
      </div>
    </div>
  );
}
