
export default function DesktopRequiredPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F8F6] px-6 py-10 font-sans text-stone-900">
      <section className="w-full max-w-[380px] rounded-xl border border-stone-200 bg-white p-7 text-center shadow-[0_8px_30px_-20px_rgba(0,0,0,0.18)]">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-stone-100">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7 text-stone-700"
          >
            <rect x="3" y="4" width="18" height="13" rx="2" />
            <path d="M8 21h8m-4-4v4" />
          </svg>
        </div>

        <h1 className="text-xl font-medium tracking-tight">
          Desktop required
        </h1>

        <p className="mt-3 text-sm leading-6 text-stone-600">
          This page is available on desktop and laptop
          browsers only. Please open this link on your
          computer to continue.
        </p>
      </section>
    </main>
  );
}
