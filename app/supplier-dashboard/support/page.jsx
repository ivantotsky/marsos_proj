"use client";

import { useState } from "react";
import { db } from "@/firebase/config";
import { getAuth } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

export default function SupplierSupportPage() {
  const auth = getAuth();
  const user = auth.currentUser;

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill out both fields.");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to submit a ticket.");
      return;
    }

    setLoading(true);

    try {
      const ticketId = uuidv4();
      const ticketRef = doc(db, "support_tickets", ticketId);

      await setDoc(ticketRef, {
        supplierId: user.uid,
        supplierName: user.displayName || "Unknown Supplier",
        subject,
        message,
        createdAt: new Date(),
      });

      setSubject("");
      setMessage("");
      toast.success("Support ticket submitted successfully!");
    } catch (err) {
      console.error("Error submitting ticket:", err);
      toast.error("Failed to submit support ticket.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='max-w-2xl mx-auto w-full px-4 py-6'>
      <h2 className='text-2xl font-semibold mb-4 text-[#2c6449]'>Support</h2>

      <Card className='p-6 space-y-4'>
        <div>
          <label className='block text-sm font-medium mb-1'>Subject</label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder='Enter your subject'
          />
        </div>

        <div>
          <label className='block text-sm font-medium mb-1'>Message</label>
          <Textarea
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder='Describe your issue or request'
          />
        </div>

        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Submitting..." : "Submit Ticket"}
        </Button>
      </Card>
    </div>
  );
}
