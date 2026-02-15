// frontend/app/dashboard/your-space/page.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { User, Camera, Settings, Activity, Users, Building2 } from "lucide-react";

export default function YourSpacePage() {
  const [bio, setBio] = useState(
    "Builder, operator, and orchestrator. Leveraging AI agents to ship faster and think bigger."
  );
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const stats = [
    { label: "Tasks Completed", value: "47", icon: Activity },
    { label: "Active Agents", value: "5", icon: Users },
    { label: "PMO Offices", value: "6", icon: Building2 },
    { label: "Uptime", value: "99.8%" , icon: Activity },
  ];

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setProfileImage(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setProfileImage(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="animate-in fade-in duration-700">
      {/* Two-column layout: profile info left, hero image right */}
      <div className="flex flex-col-reverse lg:flex-row gap-6 lg:gap-8">
        {/* ─── Left Column: Profile Info ─── */}
        <div className="w-full lg:w-[45%] space-y-6">
          {/* Header */}
          <header>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold/50 mb-1">
              Profile &amp; Identity
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white font-display">
              YOUR SPACE
            </h1>
          </header>

          {/* User Info Card */}
          <section className="rounded-3xl border border-wireframe-stroke bg-black/60 p-6 backdrop-blur-2xl space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold">
                <User size={22} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  ACHEEVY Operator
                </h2>
                <p className="text-xs text-white/40 font-mono">@operator</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-white/30">
                Member Since
              </p>
              <p className="text-sm text-white/50">January 2025</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-white/30">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-wireframe-stroke bg-black/80 p-3 text-sm text-white outline-none focus:border-gold/30 transition-colors resize-none leading-relaxed"
              />
            </div>
          </section>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-wireframe-stroke bg-black/60 p-4 backdrop-blur-xl"
              >
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon size={13} className="text-gold" />
                  <p className="text-[10px] uppercase tracking-wider text-white/30">
                    {stat.label}
                  </p>
                </div>
                <p className="text-2xl font-bold text-white font-display">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Edit Profile", icon: User },
              { label: "Manage Agents", icon: Settings },
              { label: "View Activity", icon: Activity },
            ].map((action) => (
              <button
                key={action.label}
                className="flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-5 py-2.5 text-xs font-semibold text-gold transition-all hover:bg-gold-light hover:scale-105 active:scale-95"
              >
                <action.icon size={14} />
                {action.label}
              </button>
            ))}
          </div>

          {/* Motto */}
          <div className="pt-2 pb-4">
            <p className="text-sm italic text-white/20 tracking-wide">
              &ldquo;Activity breeds Activity.&rdquo;
            </p>
          </div>
        </div>

        {/* ─── Right Column: Hero Profile Image ─── */}
        <div className="w-full lg:w-[55%]">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative h-[300px] lg:min-h-[600px] lg:h-full w-full rounded-3xl overflow-hidden border transition-all ${
              dragOver
                ? "border-gold/30 shadow-[0_0_60px_rgba(251,191,36,0.3)]"
                : "border-gold/20 shadow-[0_0_40px_rgba(251,191,36,0.15)]"
            }`}
          >
            <Image
              src={profileImage || "/images/acheevy/acheevy-office-plug.png"}
              alt={profileImage ? "Profile" : "ACHEEVY Office — Default Background"}
              fill
              className="object-cover"
              unoptimized={!!profileImage}
            />

            {/* Upload overlay */}
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center gap-4 transition-opacity ${
                profileImage
                  ? "opacity-0 hover:opacity-100 bg-black/60"
                  : "opacity-100"
              }`}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/20 bg-black/40 backdrop-blur-sm">
                <Camera size={28} className="text-gold/80" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white">
                  {profileImage ? "Change Image" : "Upload Profile Image"}
                </p>
                <p className="mt-1 text-xs text-white/30">
                  Drop your image here or click to browse
                </p>
              </div>
              <label className="cursor-pointer rounded-full border border-gold/20 bg-gold/10 px-5 py-2 text-xs font-semibold text-gold transition-all hover:bg-gold-light hover:scale-105 active:scale-95">
                Browse Files
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Subtle corner accent */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
