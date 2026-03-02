'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Search' },
  { href: '/analyze', label: 'Intel' },
  { href: '/flip', label: 'Flip Calc' },
  { href: '/k1', label: 'K1 Tax' },
] as const;

interface NavBarProps {
  children?: React.ReactNode;
}

export function NavBar({ children }: NavBarProps) {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0A0A0F]">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-[#D4A843] tracking-wide">
            BLOCKWISE AI
          </h1>
          <span className="text-xs text-zinc-500">by A.I.M.S.</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label }) => {
            const isActive =
              href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#D4A843]/10 text-[#D4A843]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {children && (
        <div className="flex items-center gap-3">{children}</div>
      )}
    </header>
  );
}
