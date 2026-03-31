'use client';
import { useState } from 'react';
import { ChevronDown, BookOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { statementOfFaith } from '@/data/beliefsContent';

export default function PrivateStatementOfFaithPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 pb-24">
      <div className="max-w-3xl mx-auto">
        
        {/* Back Button for Dashboard Users */}
        <Link href="/dashboard" className="mb-6 inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
        </Link>

        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif font-bold text-slate-900 mb-4">Our Statement of Faith</h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            The foundational beliefs and scriptural truths that guide our assembly, our worship, and our daily lives.
          </p>
        </div>

        {/* Accordion Container */}
        <div className="space-y-4">
          {statementOfFaith.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div 
                key={index} 
                className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md ${
                  isOpen ? 'border-teal-300 ring-1 ring-teal-100' : 'border-slate-200'
                }`}
              >
                {/* Clickable Header */}
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                >
                  <h2 className={`text-xl font-bold font-serif transition-colors ${isOpen ? 'text-teal-700' : 'text-slate-800'}`}>
                    {item.title}
                  </h2>
                  <div className={`p-2 rounded-full transition-transform duration-300 ${isOpen ? 'bg-teal-50 text-teal-600 rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                    <ChevronDown size={20} />
                  </div>
                </button>

                {/* Expanding Content Area */}
                <div 
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="p-6 pt-0 border-t border-slate-50 mt-2">
                    {/* The Main Belief Text */}
                    <div className="text-slate-600 leading-relaxed whitespace-pre-wrap mb-6">
                      {item.text}
                    </div>
                    
                    {/* The Bible Verses (Styled as a distinct footer) */}
                    <div className="flex items-start bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <BookOpen size={18} className="text-teal-600 mr-3 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Scriptural Foundation</span>
                        <p className="text-sm font-medium text-slate-700 italic">
                          {item.verses}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}