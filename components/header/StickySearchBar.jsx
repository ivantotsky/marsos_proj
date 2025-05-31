"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { useSelector, useDispatch } from "react-redux";
import { logout as logoutAction } from "@/store/authSlice";

import RfqModal from "../rfq/Rfq";
import ProductSearch from "@/components/header/ProductSearch";
import { Button } from "../ui/button";
import { Sheet, SheetTrigger, SheetContent } from "../ui/sheet";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";

import {
  Menu,
  User,
  MessageSquare,
  ShoppingCart,
  MapPin,
  Send,
  LogOut,
  Home,
} from "react-feather";

import { useLocalization } from "@/context/LocalizationContext";

const StickySearchBar = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { selectedCountry } = useLocalization();

  const cartItemCount = useSelector((state) => state.cart.count);
  const user = useSelector((state) => state.auth.user);
  const userRole = user?.role;

  const [showRFQModal, setShowRFQModal] = useState(false);

  const handleLogout = async () => {
    try {
      await dispatch(logoutAction()).unwrap();
      router.push("/user-login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const countryNames = {
    sa: "Saudi Arabia",
    ae: "UAE",
    qa: "Qatar",
    om: "Oman",
    kw: "Kuwait",
    bh: "Bahrain",
  };

  return (
    <header className='top-0 z-[9999] w-full bg-white/90 backdrop-blur-md shadow-sm'>
      <div className='flex items-center justify-between px-2 sm:px-4 md:px-6 py-3'>
        {/* Logo */}
        <Link href='/' className='flex items-center gap-2'>
          <img
            src='/logo.svg'
            alt='Company Logo'
            className='h-14 sm:h-16 md:h-20 object-contain'
          />
        </Link>

        {/* Search */}
        <div className='flex flex-1 mx-2 sm:mx-4 max-w-full sm:max-w-3xl'>
          <ProductSearch />
        </div>

        {/* Desktop Icons */}
        <div className='hidden md:flex items-center gap-4 text-[#2c6449]'>
          {/* Delivery Location */}
          <div className='text-xs flex-col items-center hidden md:flex'>
            <span>{t("sticky.delivery_to")}</span>
            <span className='flex items-center gap-1'>
              <img
                src={`https://flagcdn.com/w20/${selectedCountry}.png`}
                alt={countryNames[selectedCountry]}
                className='w-5 h-4 object-cover rounded-sm'
              />
              {selectedCountry.toUpperCase()}
            </span>
          </div>

          {/* User Menu */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant='ghost' className='flex items-center gap-2'>
                <User size={22} />
              </Button>
            </PopoverTrigger>
            <PopoverContent align='end' className='w-40 text-sm'>
              {user ? (
                <>
                  <Button
                    variant='ghost'
                    className='w-full justify-start'
                    onClick={() => {
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
                    onClick={handleLogout}
                  >
                    {t("header.logout")}
                  </Button>
                </>
              ) : (
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  onClick={() => router.push("/user-login")}
                >
                  {t("header.signin")}
                </Button>
              )}
            </PopoverContent>
          </Popover>

          {/* Messages */}
          <Link href='/buyer-messages'>
            <Button variant='ghost' className='flex items-center gap-2'>
              <MessageSquare size={22} />
            </Button>
          </Link>

          {/* Cart */}
          {userRole !== "admin" && userRole !== "supplier" && (
            <Link href='/cart' className='relative'>
              <Button variant='ghost' className='flex items-center gap-2'>
                <ShoppingCart size={22} />
              </Button>
              {cartItemCount > 0 && (
                <span className='absolute -top-1 -right-1 bg-[#2c6449] text-white text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-center'>
                  {cartItemCount}
                </span>
              )}
            </Link>
          )}

          {/* RFQ */}
          <Button
            variant='outline'
            size='sm'
            className='flex items-center gap-2 text-[#2c6449] border-[#2c6449]'
            onClick={() => setShowRFQModal(true)}
          >
            <Send size={20} />
          </Button>

          {/* Location */}
          <Link href='/location'>
            <Button variant='ghost' className='flex items-center gap-2'>
              <MapPin size={22} />
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <div className='flex md:hidden'>
          <Sheet>
            <SheetTrigger asChild>
              <Button size='icon' variant='ghost' className='rounded-full'>
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side='left' className='w-64 max-w-[90vw]'>
              <div className='flex flex-col gap-4 mt-4 px-2 text-[#2c6449]'>
                <Link href='/'>
                  <Button variant='ghost' className='w-full justify-start'>
                    <Home size={20} className='mr-2' />
                    {t("header.home")}
                  </Button>
                </Link>

                {user ? (
                  <>
                    <Button
                      variant='ghost'
                      className='w-full justify-start'
                      onClick={() => {
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
                      onClick={handleLogout}
                    >
                      <LogOut size={20} className='mr-2' />
                      {t("header.logout")}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant='ghost'
                    className='w-full justify-start'
                    onClick={() => router.push("/user-login")}
                  >
                    <User size={20} className='mr-2' />
                    {t("header.signin")}
                  </Button>
                )}

                <Link href='/buyer-messages'>
                  <Button variant='ghost' className='w-full justify-start'>
                    <MessageSquare size={20} className='mr-2' />
                    {t("header.messages")}
                  </Button>
                </Link>

                {userRole !== "admin" && userRole !== "supplier" && (
                  <Link href='/cart'>
                    <Button variant='ghost' className='w-full justify-start'>
                      <ShoppingCart size={20} className='mr-2' />
                      {t("header.cart")}
                    </Button>
                  </Link>
                )}

                <Link href='/location'>
                  <Button variant='ghost' className='w-full justify-start'>
                    <MapPin size={20} className='mr-2' />
                    {t("header.location")}
                  </Button>
                </Link>

                <Button
                  variant='outline'
                  className='w-full justify-start text-[#2c6449] border-[#2c6449]'
                  onClick={() => setShowRFQModal(true)}
                >
                  <Send size={20} className='mr-2' />
                  {t("header.request_rfq")}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* RFQ Modal */}
      <RfqModal show={showRFQModal} onClose={() => setShowRFQModal(false)} />
    </header>
  );
};

export default StickySearchBar;
