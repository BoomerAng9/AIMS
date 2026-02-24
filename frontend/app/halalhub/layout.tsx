import type { ReactNode } from "react";
import Link from "next/link";

export const metadata = {
  title: "HalalHub | Halal Marketplace",
  description: "Your trusted halal marketplace. Verified vendors, certified products, delivered fresh.",
};

export default function HalalHubLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100">
      {/* Nav */}
      <nav className="sticky top-0 z-50 h-16 border-b border-white/8 bg-[#09090B]/80 backdrop-blur-xl">
        <div className="h-full max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6">
          <Link href="/halalhub" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">H</div>
            <span className="font-bold text-lg tracking-tight">HalalHub</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/halalhub/shop" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Browse</Link>
            <Link href="/halalhub#vendors" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Vendors</Link>
            <Link href="/halalhub#about" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">About</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/halalhub/login" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors hidden sm:block">Sign In</Link>
            <Link href="/halalhub/signup/customer" className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium flex items-center hover:bg-emerald-500 transition-colors">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/8 bg-[#111113]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">H</div>
                <span className="font-bold text-lg">HalalHub</span>
              </div>
              <p className="text-sm text-zinc-500">Your trusted halal marketplace. Verified vendors, certified products.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-300 mb-3">Shop</h4>
              <div className="space-y-2">
                <Link href="/halalhub/shop/meat-poultry" className="block text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Meat & Poultry</Link>
                <Link href="/halalhub/shop/pantry" className="block text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Pantry & Spices</Link>
                <Link href="/halalhub/shop/bakery" className="block text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Bakery & Sweets</Link>
                <Link href="/halalhub/shop/beverages" className="block text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Beverages</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-300 mb-3">Company</h4>
              <div className="space-y-2">
                <Link href="/halalhub#about" className="block text-sm text-zinc-500 hover:text-zinc-300 transition-colors">About</Link>
                <Link href="/halalhub#vendors" className="block text-sm text-zinc-500 hover:text-zinc-300 transition-colors">For Vendors</Link>
                <Link href="/halalhub/login" className="block text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Sign In</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-300 mb-3">Trust</h4>
              <div className="space-y-2">
                <span className="block text-sm text-zinc-500">{"\u2713"} Halal Certified</span>
                <span className="block text-sm text-zinc-500">{"\u2713"} Verified Vendors</span>
                <span className="block text-sm text-zinc-500">{"\u2713"} Fresh Delivery</span>
                <span className="block text-sm text-zinc-500">{"\u2713"} Secure Payments</span>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/8 text-center text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} HalalHub &middot; Powered by A.I.M.S.
          </div>
        </div>
      </footer>
    </div>
  );
}
