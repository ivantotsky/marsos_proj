"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  Youtube,
  Globe,
} from "react-feather";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  useEffect(() => {
    // Avoid injecting the seal script twice
    if (!document.getElementById("gogetssl-seal-script")) {
      const script = document.createElement("script");
      script.src =
        "https://gogetssl-cdn.s3.eu-central-1.amazonaws.com/site-seals/gogetssl-seal.js";
      script.async = true;
      script.id = "gogetssl-seal-script";
      document.body.appendChild(script);
    }
  }, []);

  const paymentLogos = [
    { src: "/visa.png", alt: "Visa" },
    { src: "/master.png", alt: "Mastercard" },
    { src: "/applepay.png", alt: "Apple Pay" },
    { src: "/mada.png", alt: "Mada" },
    { src: "/tamara.png", alt: "Tamara" },
    { src: "/tabby.png", alt: "Tabby" },
  ];

  return (
    <footer className='bg-[#2c6449] text-white text-sm'>
      <div className='max-w-screen-xl mx-auto px-4 py-10'>
        {/* Top Grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6'>
          {/* About */}
          <div>
            <h3 className='font-semibold mb-3'>{t("footer.aboutTitle")}</h3>
            <p className='text-gray-200'>{t("footer.aboutText")}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className='font-semibold mb-3'>{t("footer.quickLinks")}</h3>
            <ul className='space-y-2'>
              <li>
                <Link href='/top-supplier' className='hover:underline'>
                  {t("footer.browseSuppliers")}
                </Link>
              </li>
              <li>
                <Link href='/products' className='hover:underline'>
                  {t("footer.exploreProducts")}
                </Link>
              </li>
              <li>
                <Link href='/categories' className='hover:underline'>
                  {t("footer.viewCategories")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className='font-semibold mb-3'>{t("footer.support")}</h3>
            <ul className='space-y-2'>
              <li>
                <Link href='/faq' className='hover:underline'>
                  {t("footer.helpCenter")}
                </Link>
              </li>
              <li>
                <Link
                  href='/updated-terms-and-conditions'
                  className='hover:underline'
                >
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link
                  href='/updated-privacy-policy'
                  className='hover:underline'
                >
                  {t("footer.privacy")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Language + Social */}
          <div>
            <h3 className='font-semibold mb-3'>{t("footer.language")}</h3>
            <div className='flex gap-4 mb-4 flex-wrap'>
              <button className='bg-white text-[#2c6449] px-3 py-1 rounded'>
                English
              </button>
              <button className='bg-white text-[#2c6449] px-3 py-1 rounded'>
                العربية
              </button>
            </div>
            <h3 className='font-semibold mb-3'>{t("footer.followUs")}</h3>
            <div className='flex gap-4 flex-wrap text-white'>
              <Instagram size={18} />
              <Linkedin size={18} />
              <Twitter size={18} />
              <Facebook size={18} />
              <Youtube size={18} />
              <Globe size={18} />
            </div>
          </div>
        </div>

        {/* Payments + Logo + SSL */}
        <div className='mt-10 flex flex-col md:flex-row justify-between items-center gap-y-6 border-t pt-6'>
          {/* Saudi Business Logo */}
          <div className='relative w-[180px] h-[64px]'>
            <Image
              src='/saudi_business_logo.svg'
              alt='Saudi Business Center'
              fill
              className='object-contain'
              priority
            />
          </div>
          {/* Payment Methods */}
          <div className='flex flex-wrap justify-center gap-1'>
            {paymentLogos.map(({ src, alt }, i) => (
              <Image
                key={i}
                src={src}
                alt={alt}
                width={80}
                height={50}
                className='object-contain h-6'
                style={{ width: "auto" }}
              />
            ))}
          </div>

          {/* SSL Seal */}
          <div className='text-center'>
            <a
              href='https://www.gogetssl.com'
              rel='nofollow'
              title='GoGetSSL Site Seal Logo'
            >
              <div
                id='gogetssl-animated-seal'
                style={{
                  width: "160px",
                  height: "58px",
                  display: "inline-block",
                }}
              />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className='text-center text-xs text-gray-300 mt-6'>
          {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
