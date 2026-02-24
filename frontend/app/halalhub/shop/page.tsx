"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, Star } from "lucide-react";

const PRODUCTS = [
  { id: 1, name: "Zabiha Chicken Breast", vendor: "FreshHalal Co.", price: "$12.99/lb", rating: 4.8, category: "meat-poultry", image: "\u{1F357}" },
  { id: 2, name: "Organic Basmati Rice", vendor: "SpiceWorld", price: "$8.99", rating: 4.9, category: "pantry", image: "\u{1F35A}" },
  { id: 3, name: "Date & Honey Cake", vendor: "Sunnah Bakery", price: "$24.99", rating: 4.7, category: "bakery", image: "\u{1F370}" },
  { id: 4, name: "Premium Lamb Shoulder", vendor: "FreshHalal Co.", price: "$18.99/lb", rating: 4.9, category: "meat-poultry", image: "\u{1F969}" },
  { id: 5, name: "Moroccan Mint Tea", vendor: "TeaHouse", price: "$6.99", rating: 4.6, category: "beverages", image: "\u{1F375}" },
  { id: 6, name: "Ras El Hanout Blend", vendor: "SpiceWorld", price: "$9.99", rating: 4.8, category: "pantry", image: "\u{1FAD9}" },
  { id: 7, name: "Chicken Biryani Kit", vendor: "ReadyMeals", price: "$15.99", rating: 4.5, category: "ready-to-eat", image: "\u{1F372}" },
  { id: 8, name: "Halal Miswak Pack", vendor: "PureCare", price: "$4.99", rating: 4.7, category: "personal-care", image: "\u{1FAA5}" },
];

const CATEGORIES_FILTER = ["All", "Meat & Poultry", "Pantry", "Bakery", "Beverages", "Ready-to-Eat", "Personal Care"];

export default function HalalHubShopPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = PRODUCTS.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.vendor.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "All" || p.category === activeCategory.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-");
    return matchSearch && matchCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Browse Products</h1>
        <p className="text-sm text-zinc-500">Certified halal products from verified vendors</p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or vendors..."
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#111113] border border-white/10 text-zinc-100 placeholder-zinc-500 text-sm focus:border-emerald-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES_FILTER.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeCategory === cat ? "bg-emerald-600 text-white" : "bg-[#111113] border border-white/8 text-zinc-400 hover:text-zinc-200 hover:border-white/15"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((product) => (
          <div key={product.id} className="group rounded-xl border border-white/8 bg-[#111113] overflow-hidden hover:border-emerald-500/30 transition-all">
            <div className="aspect-square bg-[#18181B] flex items-center justify-center text-5xl">{product.image}</div>
            <div className="p-4">
              <div className="flex items-center gap-1 mb-1">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-xs text-zinc-400">{product.rating}</span>
              </div>
              <h3 className="text-sm font-semibold text-zinc-100 mb-0.5 group-hover:text-emerald-400 transition-colors">{product.name}</h3>
              <p className="text-xs text-zinc-500 mb-2">{product.vendor}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-emerald-400">{product.price}</span>
                <button className="h-8 px-3 rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-xs font-medium text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all">
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-zinc-500">No products found matching your search.</p>
        </div>
      )}
    </div>
  );
}
