"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ServiceFaqItem } from "@/lib/service-seo-content";

export function ServiceFaqClient({ faqs }: { faqs: ServiceFaqItem[] }) {
  const [openIdx, setOpenIdx] = useState<number>(0);

  return (
    <div className="space-y-3">
      {faqs.map((faq, idx) => {
        const isOpen = openIdx === idx;
        return (
          <div
            key={faq.question}
            className={`rounded-2xl border transition-all duration-200 ${
              isOpen
                ? "border-sky-200 bg-sky-50/50"
                : "border-slate-200/80 bg-white hover:border-sky-200"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? -1 : idx)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-sm font-bold text-slate-900">
                {faq.question}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[#0b71c7] transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="animate-fade-slide px-5 pb-4 text-xs leading-relaxed text-slate-600 sm:text-sm">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
