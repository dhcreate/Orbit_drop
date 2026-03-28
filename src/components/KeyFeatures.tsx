"use client";

const FEATURES = [
  {
    accentClass: "bg-[#4F8EF7]",
    icon: "🚀",
    title: "No Login Required",
    description:
      "Completely free and open to use. Just open the app, create or join a room, and start sharing. Zero friction for any user anywhere.",
  },
  {
    accentClass: "bg-orange-500",
    icon: "📦",
    title: "No File Compression",
    description:
      "Files are sent exactly as they are — no quality loss, no format restrictions. Every file type is supported, full fidelity guaranteed.",
  },
  {
    accentClass: "bg-violet-500",
    icon: "📊",
    title: "Multi-File Upload",
    description:
      "Upload multiple files simultaneously with a live progress bar showing individual file sizes and real-time upload progress.",
  },
  {
    accentClass: "bg-emerald-500",
    icon: "⏱️",
    title: "24-Hour Persistence",
    description:
      "Files remain accessible as long as the room is active. All files are automatically and securely deleted after 24 hours.",
  },
] as const;

export function KeyFeatures() {
  return (
    <section className="w-full text-left" aria-labelledby="key-features-heading">
      <h2
        id="key-features-heading"
        className="mb-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#4F8EF7] md:mb-8"
      >
        Key features
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        {FEATURES.map((f) => (
          <article
            key={f.title}
            className="flex overflow-hidden rounded-xl border border-white/[0.08] bg-[rgba(12,14,18,0.65)] shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-sm"
          >
            <div
              className={`w-1 shrink-0 sm:w-1.5 ${f.accentClass}`}
              aria-hidden
            />
            <div className="flex min-w-0 flex-1 flex-col gap-3 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl leading-none" aria-hidden>
                  {f.icon}
                </span>
                <h3 className="font-semibold leading-snug text-white">
                  {f.title}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-neutral-400">
                {f.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
