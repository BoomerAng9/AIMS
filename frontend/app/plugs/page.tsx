import { LogoWallBackground } from "@/components/LogoWallBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PLUG_REGISTRY } from "@/lib/plugs/registry";
import {
  Trophy, Calculator, FileSearch, Mail, BarChart3,
  ArrowRight, Zap, Lock,
} from "lucide-react";
import Link from "next/link";

const ICON_MAP: Record<string, React.ElementType> = {
  trophy: Trophy,
  calculator: Calculator,
  "file-search": FileSearch,
  mail: Mail,
  "bar-chart-3": BarChart3,
};

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  amber:   { bg: "bg-gold/10",   border: "border-amber-500/20",   text: "text-gold",   glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]" },
  emerald: { bg: "bg-emerald-500/10",  border: "border-emerald-500/20", text: "text-emerald-400",  glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]" },
  blue:    { bg: "bg-blue-500/10",     border: "border-blue-500/20",    text: "text-blue-400",     glow: "shadow-[0_0_20px_rgba(59,130,246,0.15)]" },
  pink:    { bg: "bg-pink-500/10",     border: "border-pink-500/20",    text: "text-pink-400",     glow: "shadow-[0_0_20px_rgba(236,72,153,0.15)]" },
  violet:  { bg: "bg-violet-500/10",   border: "border-violet-500/20",  text: "text-violet-400",   glow: "shadow-[0_0_20px_rgba(139,92,246,0.15)]" },
};

const TIER_LABELS: Record<string, { label: string; price: string }> = {
  free: { label: "ACCESS", price: "Free" },
  starter: { label: "STARTER", price: "$9/mo" },
  pro: { label: "PRO", price: "$29/mo" },
  enterprise: { label: "ENTERPRISE", price: "$199/mo" },
};

export default function PlugCatalogPage() {
  return (
    <LogoWallBackground mode="dashboard">
      <SiteHeader />

      <main className="flex-1 container max-w-7xl py-8 px-4 md:px-6">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="h-6 w-6 text-gold" />
            <h1 className="text-3xl font-display text-white tracking-wide">Plug Catalog</h1>
          </div>
          <p className="text-zinc-400 max-w-2xl">
            Browse deployable AI micro-products. Each Plug snaps into the Locale infrastructure
            and is ready to run with zero configuration.
          </p>
        </div>

        {/* Tier Legend */}
        <div className="flex flex-wrap gap-3 mb-8">
          {Object.entries(TIER_LABELS).map(([key, { label, price }]) => (
            <span
              key={key}
              className="inline-flex items-center gap-2 rounded-full border border-wireframe-stroke bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-zinc-400"
            >
              {label} <span className="text-gold font-display">{price}</span>
            </span>
          ))}
        </div>

        {/* Plug Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PLUG_REGISTRY.map((plug) => {
            const Icon = ICON_MAP[plug.icon] || Zap;
            const colors = COLOR_MAP[plug.color] || COLOR_MAP.amber;
            const tier = TIER_LABELS[plug.tier];
            const isActive = plug.status === "active";

            return (
              <Card
                key={plug.id}
                className={`group relative hover:bg-white/5 transition-all ${isActive ? colors.glow : "opacity-75"}`}
              >
                {/* Priority Badge */}
                {plug.priority === "critical" && (
                  <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-gold text-black text-[9px] font-bold uppercase tracking-wider">
                    Priority
                  </div>
                )}

                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className={`p-2.5 rounded-xl ${colors.bg} ${colors.border} border`}>
                      <Icon className={`h-6 w-6 ${colors.text}`} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase tracking-wider text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">
                        {tier.label}
                      </span>
                      {isActive ? (
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                      ) : (
                        <Lock className="h-3 w-3 text-zinc-600" />
                      )}
                    </div>
                  </div>
                  <CardTitle className="mt-4 text-lg">{plug.name}</CardTitle>
                  <CardDescription>
                    {plug.vertical} &middot; {plug.type}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {plug.description}
                  </p>

                  {/* Feature Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {plug.features.slice(0, 3).map((f) => (
                      <span
                        key={f}
                        className="text-[10px] bg-white/5 border border-wireframe-stroke text-zinc-500 rounded px-1.5 py-0.5"
                      >
                        {f}
                      </span>
                    ))}
                    {plug.features.length > 3 && (
                      <span className="text-[10px] text-zinc-600">
                        +{plug.features.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  {isActive ? (
                    <Link href={`/plugs/${plug.slug}`}>
                      <Button variant="acheevy" size="sm" className="w-full mt-2 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                        Launch Plug <ArrowRight className="h-3.5 w-3.5 ml-2" />
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="glass" size="sm" className="w-full mt-2" disabled>
                      Coming Soon
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </LogoWallBackground>
  );
}
