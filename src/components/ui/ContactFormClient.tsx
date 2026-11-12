"use client";

import React, { useState } from "react";

const TOPICS = [
  { id: "general", label: "General Question" },
  { id: "feedback", label: "Feature Suggestion" },
  { id: "bug", label: "Report a Studio Issue" },
  { id: "moderation", label: "Bouquet Moderation / Removal" },
  { id: "partnership", label: "Editorial / Floral Collaboration" },
] as const;

export function ContactFormClient({ initialTopic = "general" }: { initialTopic?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(
    TOPICS.some((t) => t.id === initialTopic) ? initialTopic : "general",
  );
  const [bouquetRef, setBouquetRef] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          topic,
          bouquetRef,
          message,
        }),
      });
      const json = (await res.json()) as { received?: boolean; id?: string; error?: string };
      if (!res.ok || !json.received) {
        setErrorMsg(json.error ?? "Could not deliver message. Please review fields and retry.");
        return;
      }
      setSubmittedId(json.id ?? "received");
      setName("");
      setEmail("");
      setBouquetRef("");
      setMessage("");
    } catch {
      setErrorMsg("Network error while sending message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedId) {
    return (
      <div
        data-testid="contact-success-box"
        className="rounded-2xl border border-[#B9D7C4] bg-[#EBF4EE] p-6 text-[#235339]"
      >
        <h2 className="font-display text-2xl font-medium">Thank You — Note Received</h2>
        <p className="mt-2 text-sm leading-relaxed">
          Your inquiry has been logged safely with reference ID{" "}
          <code className="rounded bg-white/70 px-1.5 py-0.5 text-xs">{submittedId}</code>.
        </p>
        <button
          type="button"
          onClick={() => setSubmittedId(null)}
          className="mt-5 min-h-[40px] rounded-full bg-[var(--accent-primary)] px-5 text-xs font-semibold text-white"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="contact-form"
      className="space-y-4 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 text-xs font-medium text-[var(--text-primary)]">
          <span>Your Name *</span>
          <input
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Clara Bennett"
            data-testid="contact-name-input"
            className="min-h-[42px] w-full rounded-xl border border-[var(--border-strong)] bg-white px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
          />
        </label>

        <label className="block space-y-1.5 text-xs font-medium text-[var(--text-primary)]">
          <span>Email Address *</span>
          <input
            type="email"
            required
            maxLength={160}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="clara@example.com"
            data-testid="contact-email-input"
            className="min-h-[42px] w-full rounded-xl border border-[var(--border-strong)] bg-white px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 text-xs font-medium text-[var(--text-primary)]">
          <span>Topic</span>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            data-testid="contact-topic-select"
            className="min-h-[42px] w-full rounded-xl border border-[var(--border-strong)] bg-white px-3 text-sm text-[var(--text-primary)]"
          >
            {TOPICS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5 text-xs font-medium text-[var(--text-primary)]">
          <span>Bouquet Link or Slug (Optional)</span>
          <input
            type="text"
            maxLength={160}
            value={bouquetRef}
            onChange={(e) => setBouquetRef(e.target.value)}
            placeholder="e.g. /b/sample-classic-romance"
            className="min-h-[42px] w-full rounded-xl border border-[var(--border-strong)] bg-white px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
          />
        </label>
      </div>

      <label className="block space-y-1.5 text-xs font-medium text-[var(--text-primary)]">
        <span>Message *</span>
        <textarea
          required
          minLength={10}
          maxLength={1500}
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us how we can assist with your bouquet, privacy request, or feedback..."
          data-testid="contact-message-input"
          className="w-full rounded-xl border border-[var(--border-strong)] bg-white p-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
        />
      </label>

      {errorMsg && (
        <p
          role="alert"
          className="rounded-xl border border-[#E5B8B5] bg-[#FCEEEE] px-3 py-2 text-xs text-[#962D28]"
        >
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        aria-busy={submitting}
        data-testid="contact-submit-btn"
        className="min-h-[44px] w-full rounded-full bg-[var(--accent-primary)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--accent-primary-hover)] disabled:opacity-60 sm:w-auto"
      >
        {submitting ? "Sending Inquiry…" : "Send Message"}
      </button>
    </form>
  );
}

