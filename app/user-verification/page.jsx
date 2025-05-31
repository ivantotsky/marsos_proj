"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "sonner";

import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone } from "lucide-react";

export default function PhoneCheckPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const allowedCodes = ["+966", "+971", "+973", "+965", "+968", "+974", "+63"];

  const [countryCode, setCountryCode] = useState("+966");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // On mount: read any previously unregisteredPhone and split it
  useEffect(() => {
    try {
      const saved = localStorage.getItem("unregisteredPhone");
      if (saved) {
        // find the longest matching country code
        const match = allowedCodes
          .sort((a, b) => b.length - a.length)
          .find((code) => saved.startsWith(code));
        if (match) {
          setCountryCode(match);
          setPhone(saved.slice(match.length));
        }
      }
    } catch (err) {
      console.warn("Could not read unregisteredPhone from localStorage", err);
    }
  }, []);

  const fullPhone = `${countryCode}${phone}`;

  const handleVerifyNumber = async () => {
    if (phone.length < 5) {
      toast.error(
        t("login.errors.invalidPhone", "Please enter a valid number.")
      );
      return;
    }

    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("phone", "==", fullPhone));
      const snap = await getDocs(q);

      if (snap.empty) {
        toast.info(
          t(
            "login.messages.noAccount",
            "You don’t have an account with us. Let’s get you signed up!"
          )
        );
        router.push(`/user-choices?phone=${encodeURIComponent(fullPhone)}`);
      } else {
        toast.success(
          t(
            "login.messages.accountFound",
            "Account found! Redirecting you to login…"
          )
        );
        router.push(`/user-login?phone=${encodeURIComponent(fullPhone)}`);
      }
    } catch (err) {
      console.error(err);
      toast.error(
        t(
          "login.errors.generic",
          "Could not verify number. Please try again later."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='lg:grid lg:grid-cols-2 min-h-screen'>
      {/* Left Column: Form */}
      <div
        className='bg-gray-50 px-4 sm:px-6 lg:px-8'
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className='flex items-center justify-center min-h-screen'>
          <Card className='w-full max-w-md bg-white shadow-lg rounded-lg'>
            <CardContent className='px-6 py-8 space-y-6'>
              <h2 className='text-xl sm:text-2xl font-extrabold text-gray-900 text-center'>
                {t("login.title.phoneCheck", "Let’s Check Your Account")}
              </h2>
              <p className='text-sm text-gray-600 text-center'>
                {t("login.desc.phoneCheck", "Enter your phone to continue.")}
              </p>

              <div className='flex gap-2'>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className='border rounded-md bg-white px-3 py-2 text-sm'
                >
                  {allowedCodes.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
                <div className='relative flex-1'>
                  <Input
                    dir={isRtl ? "rtl" : "ltr"}
                    type='tel'
                    placeholder={t("login.placeholders.phone")}
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, ""))
                    }
                    className='pr-10'
                  />
                  <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
                    <Phone className='h-5 w-5 text-gray-400' />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleVerifyNumber}
                disabled={loading}
                className='w-full py-3 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary-900 disabled:opacity-50'
              >
                {loading
                  ? t("login.buttons.verifying", "Verifying…")
                  : t("login.buttons.verify", "Verify")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Column: Branding */}
      <div className='hidden lg:flex bg-gradient-to-br from-[#2c6449] to-green-400 text-white flex-col items-center justify-center p-10'>
        <img src='/logo.svg' alt='Marsos Logo' className='w-28 mb-4' />
        <h1 className='text-4xl font-bold mb-4'>{t("login.welcome.title")}</h1>
        <p className='text-lg max-w-sm text-center opacity-80'>
          {t("login.welcome.subtitle")}
        </p>
      </div>
    </div>
  );
}
