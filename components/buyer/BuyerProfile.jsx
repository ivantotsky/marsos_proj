// components/buyer/BuyerProfile.jsx
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import useAuth from "@/hooks/useAuth";
import { db } from "@/firebase/config";
import { useTranslation } from "react-i18next";
import { showSuccess, showError } from "@/utils/toastUtils";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { Loader2 } from "lucide-react";

export default function BuyerProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    crNumber: "",
    vatNumber: "",
    logoUrl: "",
  });

  const storage = getStorage();
  const { t } = useTranslation();

  // 1️⃣ Load Firestore profile
  useEffect(() => {
    if (authLoading) return;

    const fetchProfile = async () => {
      if (!user) {
        setError(t("buyer_profile.errors.no_user_logged_in"));
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          setError(t("buyer_profile.errors.no_profile_found"));
        } else {
          const data = snap.data();
          setProfile({ id: snap.id, ...data });
          setFormData({
            name: data.name ?? "",
            email: data.email ?? "",
            address: data.address ?? "",
            phone: data.phone ?? "",
            crNumber: data.crNumber ?? "",
            vatNumber: data.vatNumber ?? "",
            logoUrl: data.logoUrl ?? "",
          });
        }
      } catch (err) {
        console.error(err);
        setError(t("buyer_profile.errors.failed_to_load_profile"));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile().catch((err) => {
      console.error("Unhandled fetchProfile error:", err);
      setError(t("buyer_profile.errors.failed_to_load_profile"));
      setLoading(false);
    });
  }, [user, authLoading, t]);

  // 2️⃣ Handle inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 3️⃣ Upload logo
  const handleFileUpload = (file) => {
    if (!file || !user) return;
    setUploading(true);

    const storageRef = ref(storage, `logos/${user.uid}/${file.name}`);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      "state_changed",
      null,
      (err) => {
        console.error(err);
        showError(t("buyer_profile.errors.logo_upload_failed"));
        setUploading(false);
      },
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          setFormData((prev) => ({ ...prev, logoUrl: url }));
          showSuccess(t("buyer_profile.messages.logo_uploaded_success"));
        } catch (err) {
          console.error(err);
          showError(t("buyer_profile.errors.logo_upload_failed"));
        } finally {
          setUploading(false);
        }
      }
    );
  };

  // 4️⃣ Save updates
  const handleSave = async () => {
    if (!user) {
      setError(t("buyer_profile.errors.no_user_logged_in"));
      return;
    }
    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, formData);
      setProfile((prev) => ({ ...prev, ...formData }));
      showSuccess(t("buyer_profile.messages.profile_updated_success"));
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      showError(t("buyer_profile.errors.failed_to_update_profile"));
    } finally {
      setLoading(false);
    }
  };

  // 5️⃣ Render loading & error states
  if (authLoading || loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }
  if (error) {
    return <p className='text-destructive text-center mt-6'>{error}</p>;
  }

  // 6️⃣ Render main UI
  return (
    <Card className='max-w-3xl mx-auto my-8'>
      <CardHeader>
        <CardTitle>{t("buyer_profile.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex space-x-6 mb-6'>
          <Avatar className='w-24 h-24'>
            {profile.logoUrl ? (
              <AvatarImage src={profile.logoUrl} alt={profile.name} />
            ) : (
              <AvatarFallback>
                {profile.name?.[0] ?? user.email?.[0] ?? "?"}
              </AvatarFallback>
            )}
          </Avatar>
          <div className='flex-1'>
            {isEditing ? (
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {[
                  "name",
                  "email",
                  "address",
                  "phone",
                  "crNumber",
                  "vatNumber",
                ].map((field) => (
                  <div key={field}>
                    <Label htmlFor={field}>
                      {t(`buyer_profile.fields.${field}`)}
                    </Label>
                    <Input
                      id={field}
                      name={field}
                      value={formData[field]}
                      onChange={handleInputChange}
                    />
                  </div>
                ))}
                <div className='col-span-full'>
                  <Label htmlFor='logo'>{t("buyer_profile.fields.logo")}</Label>
                  <input
                    id='logo'
                    type='file'
                    accept='image/*'
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                    className='block w-full text-sm file:border-0 file:bg-transparent file:text-primary'
                  />
                  {uploading && (
                    <p className='text-sm text-muted-foreground mt-1'>
                      {t("buyer_profile.actions.uploading_logo")}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className='space-y-2'>
                {[
                  "name",
                  "email",
                  "address",
                  "phone",
                  "crNumber",
                  "vatNumber",
                ].map((field) => (
                  <p key={field}>
                    <span className='font-medium'>
                      {t(`buyer_profile.fields.${field}`)}:
                    </span>{" "}
                    {profile[field]}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className='flex justify-end space-x-2'>
        {isEditing ? (
          <>
            <Button variant='secondary' onClick={() => setIsEditing(false)}>
              {t("buyer_profile.actions.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={uploading}>
              {t("buyer_profile.actions.save")}
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)}>
            {t("buyer_profile.actions.edit")}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
