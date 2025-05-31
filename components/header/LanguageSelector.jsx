// components/header/LanguageSelector.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Globe } from "react-feather";

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState("ar");
  const [open, setOpen] = useState(false);

  // On mount, read your stored lang (cookie or localStorage)
  useEffect(() => {
    const cookieMatch = document.cookie.match(/(^|;)\s*i18next=([^;]+)/);
    const savedLang =
      cookieMatch?.[2] || localStorage.getItem("app-language") || "ar";

    applyLanguage(savedLang, { skipRefresh: true });
  }, []);

  // helper to apply language everywhere
  const applyLanguage = async (lng, { skipRefresh = false } = {}) => {
    await i18n.changeLanguage(lng);
    setSelectedLanguage(lng);

    // make direction change
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";

    // persist in localStorage (for your client-only code)
    localStorage.setItem("app-language", lng);

    // persist in cookie (for SSR metadata)
    document.cookie = `i18next=${lng}; path=/; samesite=strict`;

    // re-run server components / metadata
    if (!skipRefresh) {
      router.refresh();
    }
  };

  const changeLanguage = (lng) => {
    applyLanguage(lng);
    setOpen(false);
  };

  const labelMap = { ar: "العربية", en: "English" };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='ghost' className='flex items-center space-x-1'>
          <Globe size={18} />
          <span className='text-sm'>{labelMap[selectedLanguage]}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align='end'
        className='w-40 text-sm z-[9999]'
        sideOffset={8}
        forceMount
      >
        <Button
          variant={selectedLanguage === "ar" ? "default" : "ghost"}
          className='w-full justify-start'
          onClick={() => changeLanguage("ar")}
        >
          العربية
        </Button>
        <Button
          variant={selectedLanguage === "en" ? "default" : "ghost"}
          className='w-full justify-start'
          onClick={() => changeLanguage("en")}
        >
          English
        </Button>
      </PopoverContent>
    </Popover>
  );
};

export default LanguageSelector;
