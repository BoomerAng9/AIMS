"use client";

type Props = {
  /** Position: fixed bottom bar or inline */
  position?: "fixed" | "inline";
};

export function MottoBar({ position = "inline" }: Props) {
  const base =
    "text-center text-[0.65rem] uppercase tracking-[0.35em] text-gold/40 select-none font-display";

  if (position === "fixed") {
    return (
      <div className={`absolute bottom-0 left-0 right-0 z-10 py-2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none ${base}`}>
        Activity breeds Activity.
      </div>
    );
  }

  return (
    <div className={`py-3 ${base}`}>
      <span className="inline-block border-t border-b border-gold/10 py-2 px-6">
        Activity breeds Activity.
      </span>
    </div>
  );
}
