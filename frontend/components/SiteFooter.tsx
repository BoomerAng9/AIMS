/* frontend/components/SiteFooter.tsx */
export function SiteFooter() {
  return (
    <footer className="pointer-events-none fixed bottom-3 right-3 z-20">
      <div className="flex items-center gap-2">
        <span className="font-marker text-xs text-white/30 tracking-wider">CREATOR ECONOMY</span>
        <img
          src="/images/misc/made-in-plr.png"
          alt="Made in PLR"
          className="h-10 w-auto opacity-70 hover:opacity-100 transition-opacity"
        />
      </div>
    </footer>
  );
}
