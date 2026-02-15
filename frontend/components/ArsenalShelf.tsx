// frontend/components/ArsenalShelf.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { shelfSlide, staggerContainer } from "@/lib/motion/variants";
import { Layers, Plus, ArrowRight } from "lucide-react";

interface ShelfPlug {
  id: string;
  name: string;
  status: string;
}

export function ArsenalShelf() {
  const [plugs, setPlugs] = useState<ShelfPlug[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/plugs")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const items = Array.isArray(data) ? data : data.plugs || [];
        setPlugs(items.slice(0, 8)); // max 8 in shelf
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusDot = (status: string) => {
    switch (status) {
      case "live":
      case "deployed":
        return "bg-emerald-400";
      case "building":
        return "bg-blue-400 animate-pulse";
      default:
        return "bg-gold/60";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[0.6rem] uppercase tracking-[0.25em] text-gold/50 font-mono">
          Arsenal
        </h2>
        <Link
          href="/dashboard/plugs"
          className="text-[0.6rem] text-white/30 hover:text-gold transition-colors flex items-center gap-1"
        >
          View all <ArrowRight size={10} />
        </Link>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex gap-3 overflow-x-auto pb-2 scroll-snap-x snap-mandatory no-scrollbar"
      >
        {/* Loading skeletons */}
        {loading &&
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="wireframe-card flex-shrink-0 w-[120px] h-[160px] animate-pulse p-3"
            >
              <div className="h-8 w-8 rounded-lg bg-white/5 mb-3" />
              <div className="h-2 w-16 bg-white/5 rounded mb-2" />
              <div className="h-2 w-10 bg-white/5 rounded" />
            </div>
          ))}

        {/* Plug cartridges */}
        {!loading &&
          plugs.map((plug) => (
            <motion.div key={plug.id} variants={shelfSlide} className="snap-start">
              <Link
                href={`/dashboard/plugs/${plug.id}`}
                className="wireframe-card flex-shrink-0 w-[120px] h-[160px] p-3 flex flex-col items-center justify-between text-center hover:border-gold/20 transition-all group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-wireframe-stroke bg-white/[0.02] text-white/30 group-hover:text-gold group-hover:border-gold/30 transition-colors">
                  <Layers size={18} />
                </div>
                <div className="mt-2 flex-1 flex flex-col justify-center">
                  <p className="text-[0.65rem] font-medium text-white/70 leading-tight line-clamp-2 group-hover:text-white transition-colors">
                    {plug.name}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${statusDot(plug.status)}`} />
                  <span className="text-[0.5rem] uppercase font-mono text-white/30 tracking-wider">
                    {plug.status}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}

        {/* "+" add slot */}
        <motion.div variants={shelfSlide} className="snap-start">
          <Link
            href="/dashboard/build"
            className="wireframe-card border-dashed flex-shrink-0 w-[120px] h-[160px] p-3 flex flex-col items-center justify-center text-center hover:border-gold/20 transition-all group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-white/15 text-white/20 group-hover:border-gold/30 group-hover:text-gold transition-all">
              <Plus size={18} />
            </div>
            <p className="mt-3 text-[0.6rem] text-white/30 group-hover:text-gold/80 transition-colors">
              New Plug
            </p>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
