// app/user-choices/page.jsx
"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function UserChoicesPage() {
  return (
    <Suspense fallback={null}>
      <InnerUserChoicesPage />
    </Suspense>
  );
}

function InnerUserChoicesPage() {
  const router = useRouter();
  const params = useSearchParams();

  const countryCode = params.get("countryCode") || "+966";
  const phone = params.get("phone") || "";
  const fullPhone = countryCode + phone;

  const { t, i18n } = useTranslation("common");
  const isRtl = i18n.dir() === "rtl";

  const [loadingRole, setLoadingRole] = useState(null);

  const choose = (role) => {
    setLoadingRole(role);
    if (role === "supplier") {
      router.push(
        "/supplier-onboarding?phone=" + encodeURIComponent(fullPhone)
      );
    } else {
      router.push(
        "/buyer-onboarding?countryCode=" +
          encodeURIComponent(countryCode) +
          "&phone=" +
          encodeURIComponent(phone)
      );
    }
  };

  return (
    <div className='lg:grid lg:grid-cols-2 min-h-[80vh] items-center'>
      {/* Left Column */}
      <div
        className='bg-gray-50 px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center'
        dir={isRtl ? "rtl" : "ltr"}
      >
        <Card className='w-full max-w-md bg-white shadow-lg rounded-lg'>
          <CardContent className='px-6 py-8 space-y-6'>
            <h2 className='text-xl sm:text-2xl font-extrabold text-gray-900 text-center'>
              {t("user-choice.login.chooseRole")}
            </h2>
            <p className='text-sm text-gray-600 text-center'>
              {t("user-choice.login.desc.chooseRole")}
            </p>
            <div className='flex gap-4'>
              <Button
                variant='outline'
                onClick={() => choose("buyer")}
                disabled={loadingRole !== null}
                className='flex-1 py-3 text-sm font-medium'
              >
                {loadingRole === "buyer"
                  ? t("user-choice.login.buttons.loading")
                  : t("user-choice.login.roles.buyer")}
              </Button>
              <Button
                variant='outline'
                onClick={() => choose("supplier")}
                disabled={loadingRole !== null}
                className='flex-1 py-3 text-sm font-medium'
              >
                {loadingRole === "supplier"
                  ? t("user-choice.login.buttons.loading")
                  : t("user-choice.login.roles.supplier")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column */}
      <div className='hidden lg:flex h-full bg-gradient-to-br from-[#2c6449] to-green-400 text-white flex-col items-center justify-center p-10'>
        <img src='/logo.svg' alt='Marsos Logo' className='w-28 mb-4' />
        <h1 className='text-4xl font-bold mb-4'>{t("login.welcome.title")}</h1>
        <p className='text-lg max-w-sm text-center opacity-80'>
          {t("login.welcome.subtitle")}
        </p>
      </div>
    </div>
  );
}
