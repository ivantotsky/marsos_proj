"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function ManageTermsPage() {
  const { t } = useTranslation();
  const { user: currentUser, loading: authLoading } = useSelector(
    (state) => state.auth
  );
  const [terms, setTerms] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const fetchTerms = async () => {
      try {
        const docRef = doc(db, "terms_and_conditions", currentUser.uid);
        const docSnap = await getDoc(docRef);
        setTerms(docSnap.exists() ? docSnap.data().content : "");
      } catch (err) {
        console.error(err);
        setMessage(t("terms.fetchError"));
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, [currentUser, t]);

  const handleSave = async () => {
    try {
      const docRef = doc(db, "terms_and_conditions", currentUser.uid);
      await setDoc(docRef, {
        content: terms,
        supplierId: currentUser.uid,
        supplierName: currentUser.displayName || "",
      });
      setMessage(t("terms.saveSuccess"));
    } catch (err) {
      console.error(err);
      setMessage(t("terms.saveError"));
    }
  };

  if (authLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
      </div>
    );
  }

  return (
    <div className='w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-6'>
      <div className='bg-white p-4 sm:p-6 rounded-xl shadow-md'>
        <h2 className='text-2xl font-semibold mb-4'>{t("terms.title")}</h2>

        {loading ? (
          <div className='flex items-center space-x-2 text-sm text-muted-foreground'>
            <Loader2 className='h-5 w-5 animate-spin' />
            <span>{t("terms.loading")}</span>
          </div>
        ) : (
          <>
            <Textarea
              className='w-full mb-4 min-h-[200px]'
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder={t("terms.placeholder")}
            />

            <Button
              onClick={handleSave}
              className='w-full sm:w-auto bg-primary text-white'
            >
              {t("terms.saveButton")}
            </Button>

            {message && (
              <Alert className='mt-4'>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
          </>
        )}
      </div>
    </div>
  );
}
