/* frontend/components/SiteFooter.tsx */
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="pointer-events-none fixed bottom-3 right-3 z-20">
      <div className="flex items-center gap-2">
        <span className="font-marker text-xs text-white/30 tracking-wider">CREATOR ECONOMY</span>
        <Image
          src="/images/misc/made-in-plr.png"
          alt="Made in PLR"
          width={1024}
          height={1024}
          className="h-10 w-auto opacity-70 hover:opacity-100 transition-opacity"
        />
      </div>
    </footer>
  );
}
