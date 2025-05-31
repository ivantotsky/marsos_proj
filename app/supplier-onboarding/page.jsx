// app/supplier-onboarding/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";

const STEP_KEYS = [
  "supplier.steps.authNun",
  "supplier.steps.verifyDate",
  "supplier.steps.completeDetails",
];

const PHONE_CODES = ["+966", "+971", "+973", "+965", "+968", "+974", "+63"];

export default function SupplierOnboardingPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation("common");
  const isRtl = i18n.dir() === "rtl";

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 0
  const [nun, setNun] = useState("");

  // Step 1
  const [dateType, setDateType] = useState("hijri");
  const [issueDate, setIssueDate] = useState("");

  // Step 2: Company Details
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [commercialReg, setCommercialReg] = useState("");
  const [crIssueG, setCrIssueG] = useState("");
  const [crIssueH, setCrIssueH] = useState("");
  const [crConfirmG, setCrConfirmG] = useState("");
  const [crConfirmH, setCrConfirmH] = useState("");
  const [vatRegNumber, setVatRegNumber] = useState("");
  const [companyPhoneCode, setCompanyPhoneCode] = useState("+966");
  const [companyPhone, setCompanyPhone] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");

  // Step 2: Authorized Person
  const [authPersonName, setAuthPersonName] = useState("");
  const [authPersonEmail, setAuthPersonEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authPhoneCode, setAuthPhoneCode] = useState("+966");
  const [authPersonMobile, setAuthPersonMobile] = useState("");
  const [designation, setDesignation] = useState("");
  const [personalIdNumber, setPersonalIdNumber] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("unregisteredPhone");
      if (saved) {
        const match = PHONE_CODES.sort((a, b) => b.length - a.length).find(
          (code) => saved.startsWith(code)
        );
        if (match) {
          setAuthPhoneCode(match);
          setAuthPersonMobile(saved.slice(match.length));
        }
      }
    } catch {}
  }, []);

  const authenticateNun = async () => {
    if (!nun) {
      toast.error(t("supplier.errors.nunRequired"));
      return;
    }
    setLoading(true);
    try {
      toast.success(t("supplier.messages.authSuccess"));
      setStep(1);
    } catch {
      toast.error(t("supplier.errors.authFailed"));
    } finally {
      setLoading(false);
    }
  };

  const verifyIssueDate = async () => {
    if (!issueDate) {
      toast.error(t("supplier.errors.dateRequired"));
      return;
    }
    setLoading(true);
    try {
      toast.success(t("supplier.messages.dateVerified"));
      setStep(2);
    } catch {
      toast.error(t("supplier.errors.dateFailed"));
    } finally {
      setLoading(false);
    }
  };

  const submitOnboarding = async (e) => {
    e.preventDefault();
    if (
      !companyName ||
      !companyEmail ||
      !commercialReg ||
      !crIssueG ||
      !crIssueH ||
      !crConfirmG ||
      !crConfirmH ||
      !vatRegNumber ||
      !companyPhone ||
      !city ||
      !zipCode ||
      !country ||
      !address ||
      !authPersonName ||
      !authPersonEmail ||
      !authPassword ||
      !authPersonMobile ||
      !designation ||
      !personalIdNumber
    ) {
      toast.error(t("supplier.errors.completeAllFields"));
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "users"), {
        phone: authPhoneCode + authPersonMobile,
        password: authPassword,
        nun,
        dateType,
        issueDate,
        companyName,
        companyEmail,
        commercialReg,
        crIssueG,
        crIssueH,
        crConfirmG,
        crConfirmH,
        vatRegNumber,
        companyPhone: companyPhoneCode + companyPhone,
        city,
        zipCode,
        country,
        address,
        authPersonName,
        authPersonEmail,
        authPersonMobile: authPhoneCode + authPersonMobile,
        designation,
        personalIdNumber,
        role: "supplier",
        approved: false,
        createdAt: serverTimestamp(),
      });
      toast.success(t("supplier.messages.submitted"));
      router.push("/pending");
    } catch {
      toast.error(t("supplier.errors.submitFailed"));
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <>
            <label className='block text-sm font-medium'>
              {t("supplier.labels.nun")} *
            </label>
            <input
              className='mt-1 w-full p-2 border rounded'
              value={nun}
              onChange={(e) => setNun(e.target.value)}
              placeholder={t("supplier.placeholders.nun")}
            />
            <button
              onClick={authenticateNun}
              disabled={loading}
              className='mt-6 w-full bg-primary text-white py-2 rounded'
            >
              {loading
                ? t("supplier.buttons.authenticating")
                : t("supplier.buttons.authenticate")}
            </button>
          </>
        );
      case 1:
        return (
          <>
            <div className='flex gap-4 mb-4'>
              {["hijri", "gregorian"].map((type) => (
                <label key={type} className='inline-flex items-center gap-2'>
                  <input
                    type='radio'
                    name='dateType'
                    value={type}
                    checked={dateType === type}
                    onChange={() => setDateType(type)}
                    className='h-4 w-4'
                  />
                  <span>{t(`supplier.labels.${type}`)}</span>
                </label>
              ))}
            </div>
            <label className='block text-sm font-medium'>
              {t("supplier.labels.issueDate")} *
            </label>
            <input
              type='date'
              className='mt-1 w-full p-2 border rounded'
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
            <button
              onClick={verifyIssueDate}
              disabled={loading}
              className='mt-6 w-full bg-primary text-white py-2 rounded'
            >
              {loading
                ? t("supplier.buttons.verifyingDate")
                : t("supplier.buttons.verify")}
            </button>
          </>
        );
      case 2:
        return (
          <form
            onSubmit={submitOnboarding}
            className='grid gap-4 md:grid-cols-2 text-sm'
          >
            <fieldset className='space-y-3'>
              <legend className='text-base sm:text-lg font-semibold text-[#2c6449] mb-2'>
                {t("onboarding.legends.companyDetails")}
              </legend>

              <div>
                <label className='block mb-1'>
                  {t("onboarding.labels.companyName")}
                </label>
                <input
                  name='companyName'
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  placeholder={t("onboarding.placeholders.companyName")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>

              <div>
                <label className='block mb-1'>
                  {t("onboarding.labels.companyEmail")}
                </label>
                <input
                  type='email'
                  name='companyEmail'
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  required
                  placeholder={t("onboarding.placeholders.companyEmail")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>

              <div>
                <label className='block mb-1'>
                  {t("onboarding.labels.nun")}
                </label>
                <input
                  name='nun'
                  value={nun}
                  readOnly
                  className='w-full p-1 border rounded bg-gray-100 text-sm'
                />
              </div>

              <div>
                <label className='block mb-1'>
                  {t("onboarding.labels.commercialReg")}
                </label>
                <input
                  name='commercialReg'
                  value={commercialReg}
                  onChange={(e) => setCommercialReg(e.target.value)}
                  required
                  placeholder={t("onboarding.placeholders.commercialReg")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>

              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <label className='block mb-1'>
                    {t("onboarding.labels.crIssueG")}
                  </label>
                  <input
                    type='date'
                    name='crIssueG'
                    value={crIssueG}
                    onChange={(e) => setCrIssueG(e.target.value)}
                    required
                    className='w-full p-1 border rounded text-sm'
                  />
                </div>
                <div>
                  <label className='block mb-1'>
                    {t("onboarding.labels.crIssueH")}
                  </label>
                  <input
                    type='date'
                    name='crIssueH'
                    value={crIssueH}
                    onChange={(e) => setCrIssueH(e.target.value)}
                    required
                    className='w-full p-1 border rounded text-sm'
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <label className='block mb-1'>
                    {t("onboarding.labels.crConfirmG")}
                  </label>
                  <input
                    type='date'
                    name='crConfirmG'
                    value={crConfirmG}
                    onChange={(e) => setCrConfirmG(e.target.value)}
                    required
                    className='w-full p-1 border rounded text-sm'
                  />
                </div>
                <div>
                  <label className='block mb-1'>
                    {t("onboarding.labels.crConfirmH")}
                  </label>
                  <input
                    type='date'
                    name='crConfirmH'
                    value={crConfirmH}
                    onChange={(e) => setCrConfirmH(e.target.value)}
                    required
                    className='w-full p-1 border rounded text-sm'
                  />
                </div>
              </div>

              <div>
                <label className='block mb-1'>
                  {t("onboarding.labels.vatRegNumber")}
                </label>
                <input
                  name='vatRegNumber'
                  value={vatRegNumber}
                  onChange={(e) => setVatRegNumber(e.target.value)}
                  required
                  placeholder={t("onboarding.placeholders.vatRegNumber")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>

              <div>
                <label className='block mb-1'>
                  {t("onboarding.labels.companyPhone")}
                </label>
                <div className='flex'>
                  <select
                    value={companyPhoneCode}
                    onChange={(e) => setCompanyPhoneCode(e.target.value)}
                    className='p-1 border rounded-l text-sm bg-gray-50'
                  >
                    {PHONE_CODES.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                  <input
                    type='tel'
                    name='companyPhone'
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    required
                    placeholder={t("onboarding.placeholders.companyPhone")}
                    className='flex-1 p-1 border rounded-r text-sm'
                  />
                </div>
              </div>

              <div>
                <label className='block mb-1'>
                  {t("onboarding.labels.city")}
                </label>
                <input
                  name='city'
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  placeholder={t("onboarding.placeholders.city")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>

              <div>
                <label className='block mb-1'>
                  {t("onboarding.labels.zipCode")}
                </label>
                <input
                  name='zipCode'
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  required
                  placeholder={t("onboarding.placeholders.zipCode")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>

              <div>
                <label className='block mb-1'>
                  {t("onboarding.labels.country")}
                </label>
                <input
                  name='country'
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  placeholder={t("onboarding.placeholders.country")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>

              <div>
                <label className='block mb-1'>
                  {t("onboarding.labels.address")}
                </label>
                <textarea
                  name='address'
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  rows={3}
                  placeholder={t("onboarding.placeholders.address")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>
            </fieldset>

            <fieldset className='space-y-3'>
              <legend className='text-base sm:text-lg font-semibold text-[#2c6449] mb-2'>
                {t("onboarding.legends.authorizedPerson")}
              </legend>

              <div>
                <label className='block mb-1'>
                  {t("onboarding.labels.authPersonName")}
                </label>
                <input
                  name='authPersonName'
                  value={authPersonName}
                  onChange={(e) => setAuthPersonName(e.target.value)}
                  required
                  placeholder={t("onboarding.placeholders.authPersonName")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>

              <div className='bg-yellow-50 p-2 rounded'>
                <label className='block mb-1 font-medium text-[#2c6449]'>
                  {t("onboarding.labels.authPersonEmail")}
                </label>
                <input
                  type='email'
                  name='authPersonEmail'
                  value={authPersonEmail}
                  onChange={(e) => setAuthPersonEmail(e.target.value)}
                  required
                  placeholder={t("onboarding.placeholders.authPersonEmail")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>

              <div className='bg-yellow-50 p-2 rounded'>
                <label className='block mb-1 font-medium text-[#2c6449]'>
                  {t("onboarding.labels.authPassword")}
                </label>
                <input
                  type='password'
                  name='authPassword'
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  placeholder={t("onboarding.placeholders.authPassword")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>

              <div className='bg-yellow-50 p-2 rounded'>
                <label className='block mb-1 font-medium text-[#2c6449]'>
                  {t("onboarding.labels.authPhone")}
                </label>
                <div className='flex'>
                  <select
                    value={authPhoneCode}
                    onChange={(e) => setAuthPhoneCode(e.target.value)}
                    className='p-1 border rounded-l text-sm bg-gray-50'
                  >
                    {PHONE_CODES.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                  <input
                    type='tel'
                    name='authPersonMobile'
                    value={authPersonMobile}
                    onChange={(e) => setAuthPersonMobile(e.target.value)}
                    required
                    placeholder={t("onboarding.placeholders.authPersonMobile")}
                    className='flex-1 p-1 border rounded-r text-sm'
                  />
                </div>
              </div>

              <div>
                <label className='block mb-1'>
                  {t("onboarding.labels.designation")}
                </label>
                <input
                  name='designation'
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  required
                  placeholder={t("onboarding.placeholders.designation")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>

              <div>
                <label className='block mb-1'>
                  {t("onboarding.labels.personalIdNumber")}
                </label>
                <input
                  name='personalIdNumber'
                  value={personalIdNumber}
                  onChange={(e) => setPersonalIdNumber(e.target.value)}
                  required
                  placeholder={t("onboarding.placeholders.personalIdNumber")}
                  className='w-full p-1 border rounded text-sm'
                />
              </div>
            </fieldset>

            <button
              type='submit'
              disabled={loading}
              className='bg-[#2c6449] text-white py-2 rounded md:col-span-2'
            >
              {loading
                ? t("supplier.buttons.uploading")
                : t("supplier.buttons.submit")}
            </button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className='min-h-[80vh] flex items-center justify-center bg-gray-50 p-4'
    >
      <Card className='w-full max-w-2xl bg-white shadow-lg rounded-lg h-full'>
        <CardContent className='p-8 flex flex-col h-full'>
          <h1 className='text-2xl font-bold text-center mb-6'>
            {t("supplier.welcome.title")}
          </h1>
          <div className='flex justify-center gap-4 mb-8'>
            {STEP_KEYS.map((key, i) => (
              <div key={key} className='flex items-center gap-2'>
                <div
                  className={
                    i === step
                      ? "bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center"
                      : "bg-gray-200 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center"
                  }
                >
                  {i + 1}
                </div>
                <span
                  className={i === step ? "font-semibold text-primary" : ""}
                >
                  {t(key)}
                </span>
              </div>
            ))}
          </div>
          <div className='flex-1 overflow-auto'>{renderStepContent()}</div>
        </CardContent>
      </Card>
    </div>
  );
}
