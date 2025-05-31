"use client";

import { useState } from "react";
import { Search } from "react-feather";

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

const HelpCenter = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFaqs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14'>
      <header className='mb-6'>
        <h1 className='text-2xl sm:text-3xl font-bold text-[#2c6449]'>
          Help Center
        </h1>
        <p className='text-gray-600 text-sm sm:text-base mt-2'>
          Need help? Start with our frequently asked questions or reach out to
          our team.
        </p>
      </header>

      {/* Search Bar */}
      <div className='relative mb-10'>
        <input
          type='text'
          placeholder='Search FAQs...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2c6449] text-sm'
        />
        <Search className='absolute top-3 right-4 text-gray-400' size={18} />
      </div>

      {/* FAQ List */}
      <div className='space-y-6'>
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => (
            <article key={index} className='border-b pb-4'>
              <h2 className='font-semibold text-[#2c6449] mb-1 text-base sm:text-lg'>
                {faq.question}
              </h2>
              <p className='text-gray-600 text-sm'>{faq.answer}</p>
            </article>
          ))
        ) : (
          <p className='text-sm text-gray-500'>
            No FAQs matched your search. Try a different keyword.
          </p>
        )}
      </div>

      {/* Contact Box */}
      <div className='mt-14 bg-gray-50 p-6 sm:p-8 border rounded-lg text-center'>
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
    </section>
  );
};

export default HelpCenter;
