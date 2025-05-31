"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth, db } from "@/firebase/config";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { toast } from "sonner";

import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Phone } from "lucide-react";

import { useSelector, useDispatch } from "react-redux";
import { fetchSessionUser } from "@/store/authSlice";

export default function AuthPage() {
  // ─── 1) All hooks up front, no conditional calls ───────────────────────
  const router = useRouter();
  const dispatch = useDispatch();
  const { t, i18n, ready } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const { user, loading: authLoading } = useSelector((s) => s.auth);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [countryCode, setCountryCode] = useState("+966");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("phone"); // "phone" or "otp"
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [userId, setUserId] = useState("");

  // redirect if already logged in
  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  // reset signup prompt when inputs change
  useEffect(() => {
    setShowSignupPrompt(false);
  }, [countryCode, phone]);

  // ─── 2) Early guard AFTER all hooks ────────────────────────────────
  if (!mounted || !ready || authLoading) {
    return null;
  }

  // ─── 3) Helper and handlers (non-hook code) ───────────────────────
  const fullPhoneNumber = `${countryCode}${phone}`;

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible", callback: () => {} }
      );
    }
  };

  const handleSendOtp = async () => {
    if (!termsAccepted) {
      toast.error(t("login.errors.mustAcceptTerms"));
      return;
    }
    if (phone.length < 7) {
      toast.error(t("login.errors.invalidPhone"));
      return;
    }
    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("phone", "==", fullPhoneNumber));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        localStorage.setItem("unregisteredPhone", fullPhoneNumber);
        setShowSignupPrompt(true);
        setLoading(false);
        return;
      }
      setupRecaptcha();
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        fullPhoneNumber,
        window.recaptchaVerifier
      );
      window.confirmationResult = confirmationResult;
      toast.success(t("login.messages.otpSent"));
      setStage("otp");
    } catch (err) {
      console.error(err);
      toast.error(t("login.errors.otpSendFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      toast.error(t("login.errors.invalidOtp"));
      return;
    }
    setLoading(true);
    try {
      const result = await window.confirmationResult.confirm(otp);
      const userCred = result.user;
      setUserId(userCred.uid);

      // exchange ID-token for session cookie
      const idToken = await userCred.getIdToken();
      await fetch("/api/sessionLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      // Immediately update Redux with the new session
      await dispatch(fetchSessionUser()).unwrap();

      // Firestore lookup & routing
      const usersRef = collection(db, "users");
      const qPhone = query(usersRef, where("phone", "==", fullPhoneNumber));
      const snapPhone = await getDocs(qPhone);

      let data, targetRoute;
      if (!snapPhone.empty) {
        data = snapPhone.docs[0].data();
        targetRoute = data.role === "supplier" ? "/supplier-dashboard" : "/";
      } else {
        const userDoc = await getDoc(doc(db, "users", userCred.uid));
        if (userDoc.exists()) {
          data = userDoc.data();
          targetRoute = data.role === "supplier" ? "/supplier-dashboard" : "/";
        } else {
          return router.push(`/buyer-onboarding?uid=${userCred.uid}`);
        }
      }

      toast.success(t("login.messages.welcomeBack"));
      router.push(targetRoute);
    } catch (err) {
      console.error(err);
      toast.error(t("login.errors.otpVerifyFailed"));
    } finally {
      setLoading(false);
    }
  };

  // ─── 4) Render UI ────────────────────────────────────────────
  return (
    <div className='lg:grid lg:grid-cols-2 min-h-[80vh] items-center'>
      {/* Left Column: Form */}
      <div
        className='bg-gray-50 px-4 sm:px-6 lg:px-8 h-full'
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className='flex items-center justify-center h-full'>
          <div className='w-full max-w-md space-y-8'>
            {/* Heading */}
            <div className='text-center mt-4'>
              <h2 className='text-xl sm:text-2xl font-extrabold text-gray-900'>
                {t(`login.title.${stage}`)}
              </h2>
              <p className='mt-2 text-sm text-gray-600'>
                {t(`login.desc.${stage}`)}
              </p>
            </div>

            <Card className='bg-white shadow-lg rounded-lg overflow-hidden'>
              <CardContent className='px-6 py-8 space-y-6'>
                {stage === "phone" && (
                  <>
                    {/* country code + phone input */}
                    <div className='relative flex gap-2'>
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className='border rounded-md bg-white px-3 py-2 text-sm w-32'
                      >
                        <option value='+966'>
                          {t("login.phoneCodes.sa")} (+966)
                        </option>
                        <option value='+971'>
                          {t("login.phoneCodes.ae")} (+971)
                        </option>
                        <option value='+973'>
                          {t("login.phoneCodes.bh")} (+973)
                        </option>
                        <option value='+965'>
                          {t("login.phoneCodes.kw")} (+965)
                        </option>
                        <option value='+968'>
                          {t("login.phoneCodes.om")} (+968)
                        </option>
                        <option value='+974'>
                          {t("login.phoneCodes.qa")} (+974)
                        </option>
                        <option value='+63'>
                          {t("login.phoneCodes.ph")} (+63)
                        </option>
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

                    {/* terms + signup prompt */}
                    <div className='space-y-2'>
                      <label className='flex items-center space-x-2 text-sm'>
                        <input
                          type='checkbox'
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className='h-4 w-4 text-black border-gray-300 rounded'
                        />
                        <span>
                          {t("login.labels.acceptTerms")}{" "}
                          <a
                            href='/terms'
                            target='_blank'
                            className='text-primary font-medium hover:underline'
                          >
                            {t("login.links.terms")}
                          </a>{" "}
                          {t("login.labels.and")}{" "}
                          <a
                            href='/privacy'
                            target='_blank'
                            className='text-primary font-medium hover:underline'
                          >
                            {t("login.links.privacy")}
                          </a>
                        </span>
                      </label>

                      {showSignupPrompt && (
                        <div className='space-y-2'>
                          <p className='text-center text-sm text-gray-700'>
                            {t("login.messages.noAccount")}
                          </p>
                          <Button
                            onClick={() =>
                              router.push(
                                `/user-choices?phone=${encodeURIComponent(
                                  fullPhoneNumber
                                )}`
                              )
                            }
                            className='w-full py-3 px-4 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-900'
                          >
                            {t("login.buttons.signUp")}
                          </Button>
                        </div>
                      )}
                    </div>

                    {!showSignupPrompt && (
                      <Button
                        onClick={handleSendOtp}
                        disabled={loading || !termsAccepted}
                        className='w-full py-3 px-4 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-900 disabled:opacity-50'
                      >
                        {loading
                          ? t("login.buttons.sending")
                          : t("login.buttons.sendOtp")}
                      </Button>
                    )}
                  </>
                )}

                {stage === "otp" && (
                  <>
                    {/* OTP entry */}
                    <div className='flex justify-center'>
                      <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup className='flex justify-center space-x-2'>
                          {Array.from({ length: 6 }).map((_, i) => (
                            <InputOTPSlot
                              key={i}
                              index={i}
                              className='w-10 h-10 text-center border rounded-md'
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    {/* verify OTP */}
                    <Button
                      onClick={handleVerifyOtp}
                      disabled={loading}
                      className='w-full py-3 px-4 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-900 disabled:opacity-50'
                    >
                      {loading
                        ? t("login.buttons.verifying")
                        : t("login.buttons.verifyOtp")}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Right Column: Branding */}
      <div className='hidden lg:flex h-full bg-gradient-to-br from-[#2c6449] to-green-400 text-white flex-col items-center justify-center p-10'>
        <img src='/logo.svg' alt='Marsos Logo' className='w-28 mb-4' />
        <h1 className='text-4xl font-bold mb-4'>{t("login.welcome.title")}</h1>
        <p className='text-lg max-w-sm text-center opacity-80'>
          {t("login.welcome.subtitle")}
        </p>
      </div>

      <div id='recaptcha-container' className='hidden' />
    </div>
  );
}
