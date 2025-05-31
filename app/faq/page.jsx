// app/components/HelpCenter.jsx
"use client";

import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const faqs = [
  {
    question: "How do I contact a supplier?",
    answer:
      "Once you find a product you like, click 'Contact Supplier' to start a conversation or request a quote.",
  },
  {
    question: "Are the suppliers verified?",
    answer:
      "Yes, we verify all listed suppliers to ensure quality and trust in every transaction.",
  },
  {
    question: "What payment methods are supported?",
    answer:
      "We support Visa, Mastercard, Mada, Apple Pay, Tabby, and Tamara for secure and flexible payments.",
  },
  {
    question: "How do I submit a request for quotation (RFQ)?",
    answer:
      "Click on 'Request RFQ' on any product page or from your dashboard to describe what you need.",
  },
];

export default function HelpCenter() {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredFaqs = useMemo(
    () =>
      faqs.filter((faq) =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [searchTerm]
  );

  return (
    <Card className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8'>
      <CardContent className='p-0 space-y-6'>
        {/* Header */}
        <div className='space-y-2'>
          <h1 className='text-2xl sm:text-3xl font-bold text-[#2c6449]'>
            Help Center
          </h1>
          <p className='text-gray-600 text-sm sm:text-base'>
            Need help? Start with our frequently asked questions or reach out to
            our team.
          </p>
        </div>

        {/* Search */}
        <div className='relative'>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            placeholder='Search FAQs...'
            className='pr-12'
          />
          <Search
            className='absolute top-1/2 right-4 -translate-y-1/2 text-gray-400'
            size={18}
          />
        </div>

        {/* FAQs Accordion */}
        {filteredFaqs.length > 0 ? (
          <Accordion type='single' collapsible className='space-y-4'>
            {filteredFaqs.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className='border rounded-lg'
              >
                <AccordionTrigger className='px-4 py-3 text-[#2c6449] font-medium'>
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className='px-4 pb-4 pt-1 text-gray-600'>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className='text-sm text-gray-500'>
            No FAQs matched your search. Try a different keyword.
          </p>
        )}

        {/* Contact Box */}
        <div className='text-center bg-gray-50 p-6 sm:p-8 border rounded-lg'>
          <h3 className='text-lg sm:text-xl font-semibold text-[#2c6449] mb-2'>
            Still have questions?
          </h3>
          <p className='text-sm text-gray-600 mb-4'>
            Our support team is ready to help you with anything you need.
          </p>
          <a
            href='/contact'
            className='inline-block px-5 py-2 bg-[#2c6449] text-white text-sm rounded-full hover:bg-[#24523b] transition'
          >
            Contact Us
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
