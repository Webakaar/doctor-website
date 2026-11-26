"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

export function ContactFormClient() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Appointment Enquiry");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, subject, message })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to send enquiry.");
      } else {
        setSubmitted(true);
        setName("");
        setPhone("");
        setEmail("");
        setMessage("");
      }
    } catch {
      setError("Network error while submitting enquiry.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="card-clinical border-emerald-200 bg-emerald-50/50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <h3 className="mt-3 text-lg font-bold text-slate-900">
          Enquiry Received
        </h3>
        <p className="mt-1.5 text-sm text-slate-600">
          Thank you for reaching out. Our hospital front-desk team will respond shortly.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="btn-secondary mt-5"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-clinical space-y-4 p-6 sm:p-8">
      <h2 className="text-xl font-bold text-slate-900">Send an Enquiry</h2>
      <p className="text-sm text-slate-600">
        Have a question about departments, consultation timings, or health check-ups?
      </p>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="input-clinical"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Phone Number *
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98XXXXXXXX"
            className="input-clinical"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Email Address *
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input-clinical"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Enquiry Type *
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="input-clinical"
          >
            <option>Appointment Enquiry</option>
            <option>Department &amp; Doctor Availability</option>
            <option>Billing &amp; Payment Support</option>
            <option>Feedback &amp; Care Experience</option>
            <option>Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-700">
          Message *
        </label>
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can our hospital team assist you?"
          className="input-clinical"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full py-3"
      >
        <Send className="h-4 w-4" />
        <span>{submitting ? "Sending..." : "Submit Enquiry"}</span>
      </button>
    </form>
  );
}
