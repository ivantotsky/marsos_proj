"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "@/store/store";
import "../i18n";

import { fetchSessionUser } from "@/store/authSlice";
import { fetchCart } from "@/store/cartSlice";
import { LoadingProvider } from "@/context/LoadingContext";
import { LocalizationProvider } from "@/context/LocalizationContext";

import GlobalLoading from "@/components/global/GlobalLoading";
const Header = dynamic(() => import("@/components/header/Header"), {
  ssr: false,
});
const StickySearchBar = dynamic(
  () => import("@/components/header/StickySearchBar"),
  { ssr: false }
);
const Footer = dynamic(() => import("@/components/global/Footer"), {
  ssr: false,
});

import RfqModal from "@/components/rfq/Rfq";
import { Toaster } from "@/components/ui/sonner";

import Lenis from "@studio-freight/lenis";
import { AnimatePresence, motion } from "framer-motion";

// ——————————————
// 1) We no longer render a manual loader here.
//    GlobalLoading (inside LoadingProvider) will handle it.
// ——————————————
function AuthInitializer({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchSessionUser());
  }, [dispatch]);

  return children;
}

function CartRefresher({ children }) {
  const dispatch = useDispatch();
  const { user, loading: authLoading } = useSelector((s) => s.auth);

  useEffect(() => {
    if (!authLoading && user?.uid) {
      dispatch(fetchCart(user.uid));
    }
  }, [authLoading, user, dispatch]);

  return children;
}

function AppLayout({ children }) {
  const loading = useSelector((s) => s.auth.loading);
  const [showSticky, setShowSticky] = React.useState(false);
  const [showRFQModal, setShowRFQModal] = React.useState(false);

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 100);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: false,
    });
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  // We can keep this minimal check if you want to avoid showing
  // a blank layout before auth resolves, but GlobalLoading will cover it.
  if (loading) {
    return null;
  }

  return (
    <>
      <AnimatePresence mode='wait'>
        {!showSticky ? (
          <motion.div
            key='header'
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className='z-[9999]'
          >
            <Header setShowRFQModal={setShowRFQModal} />
          </motion.div>
        ) : (
          <motion.div
            key='sticky'
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='sticky top-0 z-[9999]'
          >
            <StickySearchBar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* set default children height to 80% of viewport */}
      <main className='min-h-[80vh]'>{children}</main>

      <Footer />

      <RfqModal show={showRFQModal} onClose={() => setShowRFQModal(false)} />

      <Toaster richColors position='top-center' containerStyle={{ top: 150 }} />
    </>
  );
}

export default function RootProvider({ children }) {
  return (
    <Provider store={store}>
      <AuthInitializer>
        <CartRefresher>
          <LoadingProvider>
            <LocalizationProvider>
              <GlobalLoading />
              <AppLayout>{children}</AppLayout>
            </LocalizationProvider>
          </LoadingProvider>
        </CartRefresher>
      </AuthInitializer>
    </Provider>
  );
}
