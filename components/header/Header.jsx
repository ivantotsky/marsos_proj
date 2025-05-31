"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { useDispatch, useSelector } from "react-redux";
import useAuth from "@/hooks/useAuth";
import { logout } from "@/store/authSlice";

import LanguageSelector from "@/components/header/LanguageSelector";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "../ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "../ui/sheet";
import { DialogTitle } from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import {
  Menu,
  User,
  Send,
  MessageSquare,
  ShoppingCart,
  MapPin,
  Home,
  LogOut as LogOutIcon,
} from "react-feather";

// Dynamically load the desktop search component
const ProductSearch = dynamic(
  () => import("@/components/header/ProductSearch"),
  { ssr: false }
);

export default function Header({ setShowRFQModal }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const dispatch = useDispatch();
  const router = useRouter();

  const { loading, user } = useAuth();
  const userRole = user?.role;
  const displayName = user?.displayName || user?.email || t("header.signin");
  const cartCount = useSelector((s) => s.cart.count);

  // --- Geolocation states ---
  const [coords, setCoords] = useState(null);
  const [locError, setLocError] = useState(null);
  const [locationName, setLocationName] = useState(null);

  // 1) On mount, request browser geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Save coords (rounded for readability)
        setCoords({ lat: latitude.toFixed(3), lng: longitude.toFixed(3) });
      },
      (error) => {
        setLocError(error.message);
      }
    );
  }, []);

  // 2) Once coords is set, fire a reverse-geocoding request to Nominatim
  useEffect(() => {
    if (!coords) return;

    const { lat, lng } = coords;
    // Use OpenStreetMap Nominatim reverse-geocoding
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Reverse geocoding failed");
        return res.json();
      })
      .then((data) => {
        const address = data.address || {};
        // Try to get suburb/neighborhood first, then city
        const suburb =
          address.suburb ||
          address.neighbourhood ||
          address.village ||
          address.hamlet ||
          null;
        const city =
          address.city ||
          address.town ||
          address.village ||
          address.county ||
          null;

        if (suburb && city) {
          setLocationName(`${suburb}, ${city}`);
        } else if (city) {
          setLocationName(city);
        } else if (data.display_name) {
          setLocationName(data.display_name);
        } else {
          setLocError("Name not found");
        }
      })
      .catch(() => {
        setLocError("Reverse geocoding error");
      });
  }, [coords]);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const onLogout = async () => {
    const role = userRole;
    await dispatch(logout()).unwrap();
    setUserMenuOpen(false);
    setSheetOpen(false);
    // Redirect admins to /admin-login, others to /user-login
    window.location.href = role === "admin" ? "/admin-login" : "/user-login";
  };

  if (loading) {
    return (
      <header className='w-full bg-white shadow'>
        <div className='p-4 text-center text-sm text-muted-foreground'>
          {t("header.loading")}
        </div>
      </header>
    );
  }

  // Helper to decide what to show under the MapPin icon
  const renderLocationText = () => {
    if (locationName) {
      return locationName;
    } else if (locError) {
      return "Unavailable";
    } else {
      return "Detecting…";
    }
  };

  return (
    <header className='w-full bg-white/90 backdrop-blur-md shadow-sm z-50'>
      {/* Top row: Logo + (desktop search) + desktop icons + mobile icons */}
      <div className='max-w-full mx-auto flex items-center justify-between px-4 md:px-6 h-26'>
        {/* Logo */}
        <Link href='/' className='flex-shrink-0'>
          <Image src='/logo.svg' alt='Logo' width={48} height={48} />
        </Link>

        {/* Desktop search */}
        <div className='hidden md:flex flex-1 mx-6'>
          <ProductSearch />
        </div>

        {/* Desktop icons */}
        <div className='hidden lg:flex items-start space-x-8 ml-6 text-[#2c6449]'>
          {/* User dropdown */}
          <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
            <PopoverTrigger asChild>
              <button className='flex flex-col items-center hover:text-green-800'>
                <User size={18} />
                <span className='text-sm mt-1'>{displayName}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              align='end'
              className='w-40 text-sm z-[9999]'
              sideOffset={8}
              forceMount
            >
              {user ? (
                <>
                  <Button
                    variant='ghost'
                    className='w-full justify-start'
                    onClick={() => {
                      setUserMenuOpen(false);
                      if (userRole === "buyer") router.push("/buyer-dashboard");
                      else if (userRole === "supplier")
                        router.push("/supplier-dashboard");
                      else router.push("/admin-dashboard");
                    }}
                  >
                    {t("header.dashboard")}
                  </Button>
                  <Button
                    variant='ghost'
                    className='w-full justify-start'
                    onClick={onLogout}
                  >
                    {t("header.logout")}
                  </Button>
                </>
              ) : (
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  onClick={() => {
                    setUserMenuOpen(false);
                    router.push("/user-login");
                  }}
                >
                  {t("header.signin")}
                </Button>
              )}
            </PopoverContent>
          </Popover>

          {/* RFQ */}
          <button
            onClick={() => setShowRFQModal(true)}
            className='flex flex-col items-center hover:text-green-800'
          >
            <Send size={18} />
            <span className='text-sm mt-1'>{t("header.request_rfq")}</span>
          </button>

          {/* Messages – only show if user is signed in */}
          {user && (
            <Link
              href='/buyer-messages'
              className='flex flex-col items-center hover:text-green-800'
            >
              <MessageSquare size={18} />
              <span className='text-sm mt-1'>{t("header.messages")}</span>
            </Link>
          )}

          {/* Cart */}
          {userRole !== "admin" && (
            <Link
              href='/cart'
              className='relative flex flex-col items-center hover:text-green-800'
            >
              <ShoppingCart size={18} />
              <span className='text-sm mt-1'>{t("header.cart")}</span>
              {cartCount > 0 && (
                <span className='absolute -top-1 -right-2 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center'>
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {/* Location (no longer a link; show detected location name) */}
          <div className='flex flex-col items-center text-[#2c6449]'>
            <MapPin size={18} />
            <span className='text-xs mt-2'>{renderLocationText()}</span>
          </div>

          {/* Language selector (desktop) */}
          <div className='flex flex-col items-center hover:text-green-800'>
            <LanguageSelector />
          </div>
        </div>

        {/* Mobile & Medium icons */}
        <div className='flex lg:hidden items-center space-x-2'>
          <LanguageSelector />
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button size='icon' variant='ghost'>
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side={isRtl ? "right" : "left"} className='w-64'>
              <SheetTitle className='sr-only'>Menu</SheetTitle>
              <DialogTitle>
                <VisuallyHidden>Menu</VisuallyHidden>
              </DialogTitle>
              <div className='flex flex-col mt-4 space-y-4 text-[#2c6449]'>
                {/* Home */}
                <Link href='/' onClick={() => setSheetOpen(false)}>
                  <Button
                    variant='ghost'
                    className='w-full justify-start flex items-center gap-2'
                  >
                    <Home size={16} />
                    {t("header.home")}
                  </Button>
                </Link>

                {/* Messages – only show if user is signed in */}
                {user && (
                  <Link
                    href='/buyer-messages'
                    onClick={() => setSheetOpen(false)}
                  >
                    <Button
                      variant='ghost'
                      className='w-full justify-start flex items-center gap-2'
                    >
                      <MessageSquare size={16} />
                      {t("header.messages")}
                    </Button>
                  </Link>
                )}

                {/* Cart */}
                {userRole !== "admin" && userRole !== "supplier" && (
                  <Link href='/cart' onClick={() => setSheetOpen(false)}>
                    <Button
                      variant='ghost'
                      className='w-full justify-start flex items-center gap-2 relative'
                    >
                      <ShoppingCart size={16} />
                      {t("header.cart")}
                      {cartCount > 0 && (
                        <span className='absolute top-1 right-4 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center'>
                          {cartCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                )}

                {/* RFQ */}
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full justify-start flex items-center gap-2 border-[#2c6449] text-[#2c6449]'
                  onClick={() => {
                    setShowRFQModal(true);
                    setSheetOpen(false);
                  }}
                >
                  <Send size={16} />
                  {t("header.request_rfq")}
                </Button>

                {/* Location (mobile) – show detected location name */}
                <Button
                  variant='ghost'
                  className='w-full justify-start flex items-center gap-2'
                  onClick={() => setSheetOpen(false)}
                >
                  <MapPin size={16} />
                  <span className='text-xs'>{renderLocationText()}</span>
                </Button>

                {/* Dashboard / Auth */}
                {user ? (
                  <>
                    <Button
                      variant='ghost'
                      className='w-full justify-start'
                      onClick={() => {
                        setSheetOpen(false);
                        if (userRole === "buyer")
                          router.push("/buyer-dashboard");
                        else if (userRole === "supplier")
                          router.push("/supplier-dashboard");
                        else router.push("/admin-dashboard");
                      }}
                    >
                      {t("header.dashboard")}
                    </Button>
                    <Button
                      variant='ghost'
                      className='w-full justify-start'
                      onClick={onLogout}
                    >
                      <LogOutIcon size={16} className='mr-2' />
                      {t("header.logout")}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant='ghost'
                    className='w-full justify-start'
                    onClick={() => {
                      setSheetOpen(false);
                      router.push("/user-login");
                    }}
                  >
                    <User size={16} className='mr-2' />
                    {t("header.signin")}
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile search bar (below top row on small & medium) */}
      <div className='block md:hidden px-4 pb-4'>
        <ProductSearch />
      </div>

      {/* Secondary nav (desktop only) */}
      <div className='hidden lg:block bg-white border-y border-gray-200'>
        <div className='max-w-7xl mx-auto px-6 flex items-center h-10 text-[#2c6449] text-md space-x-8'>
          <Link
            href='/categories'
            className='font-semibold hover:text-green-800'
          >
            {t("header.all_categories")}
          </Link>
          <Link href='/' className='hover:text-green-800'>
            {t("header.featured")}
          </Link>
          <Link href='/' className='hover:text-green-800'>
            {t("header.trending")}
          </Link>
          <div className='flex-1' />
          <Link href='/' className='hover:text-green-800'>
            {t("header.secured_trading")}
          </Link>
          <Link href='/faq' className='hover:text-green-800'>
            {t("header.help_center")}
          </Link>
          <Link href='/become-supplier' className='hover:text-green-800'>
            {t("header.become_supplier")}
          </Link>
        </div>
      </div>
    </header>
  );
}
