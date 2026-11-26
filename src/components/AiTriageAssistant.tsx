"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  RotateCcw,
  Send,
  Sparkles,
  X
} from "lucide-react";
import type { Doctor, Service } from "@/types/hospital";
import {
  matchSymptomToDepartment,
  type TriageMatchResult
} from "@/lib/symptom-triage";

const QUICK_SYMPTOMS = [
  "Chest tightness or high blood pressure",
  "Knee pain or back stiffness",
  "Child fever or vaccination",
  "Migraine headache or dizziness",
  "Skin rash, acne or hair fall",
  "Viral fever, diabetes or fatigue"
];

export function AiTriageAssistant({
  services,
  doctors,
  emergencyPhone
}: {
  services: Service[];
  doctors: Doctor[];
  emergencyPhone: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [match, setMatch] = useState<TriageMatchResult | null>(null);
  const [choosingOther, setChoosingOther] = useState(false);

  // Keep /book uncluttered while patient completes booking
  if (pathname.startsWith("/book")) {
    return null;
  }

  function runTriage(problemText: string) {
    const trimmed = problemText.trim();
    if (!trimmed) return;
    setSubmittedQuery(trimmed);
    setInput("");
    setChoosingOther(false);
    setAnalyzing(true);

    setTimeout(() => {
      const result = matchSymptomToDepartment(trimmed, services, doctors);
      setMatch(result);
      setAnalyzing(false);
    }, 320);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runTriage(input);
  }

  function handleBookRedirect(serviceId: string) {
    const params = new URLSearchParams();
    params.set("service", serviceId);
    if (submittedQuery) {
      params.set("reason", submittedQuery);
    }
    setIsOpen(false);
    router.push(`/book?${params.toString()}`);
  }

  function handleReset() {
    setSubmittedQuery("");
    setMatch(null);
    setChoosingOther(false);
    setInput("");
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Chat Panel */}
      {isOpen && (
        <div className="animate-fade-slide flex w-[calc(100vw-2rem)] max-w-[390px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[#06213e] via-[#083463] to-[#0b71c7] px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <Sparkles className="h-4 w-4 text-sky-200" />
              </div>
              <div>
                <p className="text-sm font-extrabold">AI Care Assistant</p>
                <p className="text-[11px] text-sky-200">
                  Instant Department Finder
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {submittedQuery && (
                <button
                  type="button"
                  onClick={handleReset}
                  aria-label="Start new enquiry"
                  className="rounded-lg p-1.5 text-sky-100 hover:bg-white/15 hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close AI Assistant"
                className="rounded-lg p-1.5 text-sky-100 hover:bg-white/15 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Conversation Body */}
          <div className="max-h-[420px] space-y-4 overflow-y-auto bg-[#f8fbff] p-4">
            {/* AI Greeting Bubble */}
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0b71c7] text-white">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-slate-200/80 bg-white px-4 py-3 text-xs leading-relaxed text-slate-800 shadow-sm sm:text-sm">
                <p className="font-bold text-slate-900">
                  Hello! What problem are you suffering from?
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Describe your symptoms below and I&apos;ll recommend the right medical department.
                </p>
              </div>
            </div>

            {/* Quick Symptom Suggestions (before user submits) */}
            {!submittedQuery && (
              <div className="flex flex-wrap gap-1.5 pl-9">
                {QUICK_SYMPTOMS.map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => runTriage(sym)}
                    className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-[#0b71c7] transition hover:border-[#0b71c7] hover:bg-sky-50"
                  >
                    {sym}
                  </button>
                ))}
              </div>
            )}

            {/* User Message Bubble */}
            {submittedQuery && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#06213e] px-4 py-2.5 text-xs font-medium text-white shadow-sm sm:text-sm">
                  {submittedQuery}
                </div>
              </div>
            )}

            {/* Analyzing Indicator */}
            {analyzing && (
              <div className="flex items-center gap-2 pl-9 text-xs font-semibold text-[#0b71c7]">
                <Sparkles className="h-3.5 w-3.5 animate-spin" />
                <span>Matching your enquiry to our medical departments...</span>
              </div>
            )}

            {/* AI Department Recommendation + Confirmation */}
            {!analyzing && match && (
              <div className="animate-fade-slide flex items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0b71c7] text-white">
                  <Bot className="h-3.5 w-3.5" />
                </div>

                <div className="flex-1 space-y-3">
                  {match.isEmergency && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-800">
                      <div className="flex items-center gap-1.5 font-extrabold">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                        <span>Urgent Symptom Notice</span>
                      </div>
                      <p className="mt-1">
                        If this is severe or sudden, please call our 24×7 Emergency Helpline immediately at{" "}
                        <strong>{emergencyPhone}</strong>.
                      </p>
                    </div>
                  )}

                  <div className="rounded-2xl rounded-tl-sm border border-sky-200 bg-white p-4 shadow-sm">
                    <p className="text-xs leading-relaxed text-slate-700 sm:text-sm">
                      This enquiry seems related to{" "}
                      <strong className="font-extrabold text-[#0b71c7]">
                        {match.service.name}
                      </strong>
                      . Is this correct?
                    </p>

                    <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                      <p className="font-bold text-slate-900">
                        {match.service.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {match.service.shortDescription}
                      </p>
                      {match.suggestedDoctor && (
                        <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>
                            Specialist: {match.suggestedDoctor.fullName} (₹
                            {match.suggestedDoctor.consultationFee})
                          </span>
                        </p>
                      )}
                    </div>

                    {!choosingOther ? (
                      <div className="mt-3.5 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => handleBookRedirect(match.service.id)}
                          className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0b71c7] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#06213e]"
                        >
                          <span>Yes, Book {match.service.name.split("&")[0].trim()}</span>
                          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setChoosingOther(true)}
                          className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold text-slate-600 hover:border-sky-300 hover:text-[#0b71c7]"
                        >
                          No, Choose Another Department
                        </button>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                        <p className="text-[11px] font-bold text-slate-600">
                          Select the department you want to book:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {services.map((svc) => (
                            <button
                              key={svc.id}
                              type="button"
                              onClick={() => handleBookRedirect(svc.id)}
                              className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50/70 px-3 py-1.5 text-[11px] font-bold text-[#0b71c7] transition hover:bg-[#0b71c7] hover:text-white"
                            >
                              <span>{svc.name}</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-slate-200 bg-white px-3.5 py-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your symptom or problem..."
              className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0b71c7] focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || analyzing}
              aria-label="Send symptom enquiry"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0b71c7] text-white shadow-sm transition hover:bg-[#06213e] disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Corner Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Open AI Symptom Assistant"
        className="group flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#06213e] via-[#083463] to-[#0b71c7] py-3 pl-4 pr-5 text-white shadow-2xl shadow-blue-950/35 ring-4 ring-white/80 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-blue-900/40"
      >
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
          <Sparkles className="h-4 w-4 text-sky-200 transition-transform duration-300 group-hover:rotate-12" />
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
        </span>
        <div className="text-left leading-tight">
          <span className="block text-xs font-extrabold">AI Care Guide</span>
          <span className="block text-[10px] text-sky-200">
            Find Right Doctor
          </span>
        </div>
      </button>
    </div>
  );
}
