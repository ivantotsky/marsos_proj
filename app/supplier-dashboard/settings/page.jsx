"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { getAuth } from "firebase/auth";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function SupplierSettingsPage() {
  const auth = getAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    companyName: "",
    contactEmail: "",
    phone: "",
    description: "",
  });

  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchSettings = async () => {
      if (!currentUser) return;

      const docRef = doc(db, "suppliers", currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          companyName: data.companyName || "",
          contactEmail: data.contactEmail || "",
          phone: data.phone || "",
          description: data.description || "",
        });
      }

      setLoading(false);
    };

    fetchSettings();
  }, [currentUser]);

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      const docRef = doc(db, "suppliers", currentUser.uid);
      await setDoc(docRef, settings, { merge: true });

      toast.success("Settings updated successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings.");
    }
  };

  return (
    <div className='max-w-4xl mx-auto w-full px-4 py-6'>
      <h2 className='text-2xl font-semibold mb-4 text-[#2c6449]'>
        Supplier Settings
      </h2>

      <Card className='p-6 space-y-4'>
        {loading ? (
          <p className='text-muted-foreground text-sm'>Loading settings...</p>
        ) : (
          <>
            <div>
              <label className='block text-sm font-medium mb-1'>
                Company Name
              </label>
              <Input
                value={settings.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                placeholder='Enter your company name'
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-1'>
                Contact Email
              </label>
              <Input
                type='email'
                value={settings.contactEmail}
                onChange={(e) => handleChange("contactEmail", e.target.value)}
                placeholder='Enter contact email'
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-1'>Phone</label>
              <Input
                value={settings.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder='Enter phone number'
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-1'>
                Company Description
              </label>
              <Textarea
                rows={4}
                value={settings.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder='Tell us more about your company'
              />
            </div>

            <Button onClick={handleSave} className='mt-2'>
              Save Settings
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
