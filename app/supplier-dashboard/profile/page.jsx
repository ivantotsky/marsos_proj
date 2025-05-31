// app/supplier/[supplierId]/manage/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { db } from "@/firebase/config";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// Unified list of all editable text fields:
const textFields = [
  /* company info */
  "companyName",
  "companyNameAr",
  "companyDescriptionEn",
  "companyDescriptionAr",
  "address",
  "addressAr",
  "city",
  "region",
  "zipCode",
  "country",
  "otherCitiesServed",
  "businessType",
  "yearOfEstablishment",
  "numberOfEmployees",
  "rating",
  "averageResponseTime",
  "productCertification",
  "plantArea",
  "registeredCapital",
  "auditReportNo",

  /* docs & regs */
  "crNumber",
  "crLicenseUrl",
  "vatNumber",
  "vatDocUrl",

  /* contact & branding */
  "companyPhone",
  "companyEmail",
  "logoUrl",

  /* authorized person */
  "authPersonName",
  "designation",
  "authPersonEmail",
  "authPersonMobile",
  "nun",
  "personalIdNumber",
  "dateType",
  "issueDate",
  "crIssueG",
  "crIssueH",
  "crConfirmG",
  "crConfirmH",
];

// split into left (company) vs right (authorized-person) columns:
const companyFields = [
  "companyName",
  "companyNameAr",
  "companyDescriptionEn",
  "companyDescriptionAr",
  "address",
  "addressAr",
  "city",
  "region",
  "zipCode",
  "country",
  "otherCitiesServed",
  "businessType",
  "yearOfEstablishment",
  "numberOfEmployees",
  "rating",
  "averageResponseTime",
  "productCertification",
  "plantArea",
  "registeredCapital",
  "auditReportNo",
  "crNumber",
  "crLicenseUrl",
  "vatNumber",
  "vatDocUrl",
  "companyPhone",
  "companyEmail",
  "logoUrl",
];

const authFields = [
  "authPersonName",
  "designation",
  "authPersonEmail",
  "authPersonMobile",
  "nun",
  "personalIdNumber",
  "dateType",
  "issueDate",
  "crIssueG",
  "crIssueH",
  "crConfirmG",
  "crConfirmH",
];

export default function ManageProfilePage() {
  const { t } = useTranslation();
  const { user: currentUser } = useSelector((s) => s.auth);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState("");

  useEffect(() => {
    if (!currentUser?.uid) return;
    (async () => {
      const snap = await getDoc(doc(db, "users", currentUser.uid));
      if (snap.exists()) {
        const data = snap.data();
        data.crNumber = data.crNumber || data.commercialReg || "";
        data.crLicenseUrl =
          data.crLicenseUrl || data.crDocUrl || data.crLicense || "";
        data.vatNumber = data.vatNumber || data.vatRegNumber || "";
        data.vatDocUrl = data.vatDocUrl || "";
        data.companyPhone = data.companyPhone || data.phone || "";
        data.companyEmail = data.companyEmail || data.email || "";
        data.logoUrl = data.logoUrl || data.companyLogo || "";
        data.companyDescriptionEn = data.companyDescriptionEn || "";
        data.companyDescriptionAr = data.companyDescriptionAr || "";
        setFormData(data);
      }
      setLoading(false);
    })();
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const handleArrayChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({
      ...f,
      [name]: value.split(",").map((s) => s.trim()),
    }));
  };

  const uploadFile = (file, key) => {
    if (!file || !currentUser) return;
    setUploadingKey(key);
    const path = `profiles/${currentUser.uid}/${key}/${file.name}`;
    const task = uploadBytesResumable(storageRef(getStorage(), path), file);
    task.on(
      "state_changed",
      null,
      () => {
        toast.error(t("profile.uploadFailed", { key }));
        setUploadingKey("");
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        setFormData((f) => ({ ...f, [key]: url }));
        toast.success(t("profile.uploaded", { key }));
        setUploadingKey("");
      }
    );
  };

  const handleDeleteFile = (key) => {
    setFormData((f) => ({ ...f, [key]: "" }));
  };

  const handleSave = async () => {
    if (!currentUser?.uid) return;
    try {
      await updateDoc(doc(db, "users", currentUser.uid), formData);
      toast.success(t("profile.updated"));
      setIsEditing(false);
    } catch {
      toast.error(t("profile.updateFailed"));
    }
  };

  if (loading) return <div className='p-8'>{t("common.loading")}…</div>;
  if (!currentUser || currentUser.role !== "supplier")
    return <div className='p-8'>{t("common.notAuthorized")}</div>;

  const PreviewOrLink = ({ url, alt }) => {
    if (!url) return null;
    if (url.match(/\.(pdf)$/i)) {
      return (
        <div className='mb-2'>
          <object data={url} type='application/pdf' width='100%' height='200px'>
            <a href={url} target='_blank' rel='noopener'>
              {t("profile.view", { what: alt })}
            </a>
          </object>
        </div>
      );
    }
    return (
      <img src={url} alt={alt} className='w-24 h-24 object-contain mb-2' />
    );
  };

  return (
    <Card className='max-w-6xl mx-auto my-8 p-4'>
      <CardHeader>
        <div className='flex justify-between items-center'>
          <CardTitle>{t("profile.manageTitle")}</CardTitle>
          <div className='flex gap-2'>
            {!isEditing && (
              <Button
                size='sm'
                variant='default'
                onClick={() => setIsEditing(true)}
              >
                {t("profile.edit")}
              </Button>
            )}
            <Button
              size='sm'
              variant='secondary'
              onClick={() =>
                window.open(`/supplier/${currentUser.uid}/products`, "_blank")
              }
            >
              {t("profile.viewProfile")}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Two-column split with center border */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8 md:divide-x md:divide-gray-200'>
          {/* COMPANY DETAILS */}
          <div className='pr-4'>
            <h3 className='text-lg font-semibold mb-4'>
              {t("profile.companyDetails")}
            </h3>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
              {companyFields.map((field) => (
                <div key={field}>
                  <Label>{t(`profile.${field}`)}</Label>
                  {["crLicenseUrl", "vatDocUrl", "logoUrl"].includes(field) ? (
                    <>
                      <PreviewOrLink
                        url={formData[field]}
                        alt={t(`profile.${field}`)}
                      />
                      <div className='flex items-center gap-2'>
                        <Input
                          type='file'
                          accept={field === "crLicenseUrl" ? ".pdf" : "image/*"}
                          onChange={(e) => uploadFile(e.target.files[0], field)}
                          disabled={!isEditing || uploadingKey === field}
                        />
                        {formData[field] && isEditing && (
                          <Button
                            size='sm'
                            variant='destructive'
                            onClick={() => handleDeleteFile(field)}
                          >
                            {t("profile.delete")}
                          </Button>
                        )}
                      </div>
                    </>
                  ) : field === "otherCitiesServed" ? (
                    <Input
                      className='text-primary'
                      name={field}
                      value={(formData[field] || []).join(", ")}
                      onChange={handleArrayChange}
                      disabled={!isEditing}
                    />
                  ) : (
                    <Input
                      className='text-primary'
                      name={field}
                      value={formData[field] ?? ""}
                      onChange={handleChange}
                      disabled={
                        field === "crNumber" ||
                        field === "vatNumber" ||
                        !isEditing
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AUTHORIZED PERSON */}
          <div className='pl-4'>
            <h3 className='text-lg font-semibold mb-4'>
              {t("profile.authorizedPerson")}
            </h3>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
              {authFields.map((field) => (
                <div key={field}>
                  <Label>{t(`profile.${field}`)}</Label>
                  <Input
                    className='text-primary'
                    type={
                      [
                        "issueDate",
                        "crIssueG",
                        "crIssueH",
                        "crConfirmG",
                        "crConfirmH",
                      ].includes(field)
                        ? "date"
                        : "text"
                    }
                    name={field}
                    value={formData[field] ?? ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Save / Cancel */}
        {isEditing && (
          <div className='flex gap-4'>
            <Button onClick={handleSave} disabled={!!uploadingKey}>
              {t("profile.save")}
            </Button>
            <Button variant='outline' onClick={() => setIsEditing(false)}>
              {t("profile.cancel")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
