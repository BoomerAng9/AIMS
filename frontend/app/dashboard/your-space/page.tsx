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
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-200/50 mb-1">
              Profile &amp; Identity
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-amber-50 font-display">
              YOUR SPACE
            </h1>
          </header>

          {/* User Info Card */}
          <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-300">
                <User size={22} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-amber-50">
                  ACHEEVY Operator
                </h2>
                <p className="text-xs text-amber-100/50 font-mono">@operator</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-amber-100/40">
                Member Since
              </p>
              <p className="text-sm text-amber-100/70">January 2025</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-amber-100/40">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-white/5 bg-black/80 p-3 text-sm text-amber-50 outline-none focus:border-amber-300 transition-colors resize-none leading-relaxed"
              />
            </div>
          </section>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/5 bg-black/60 p-4 backdrop-blur-xl"
              >
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon size={13} className="text-amber-300/70" />
                  <p className="text-[10px] uppercase tracking-wider text-amber-100/40">
                    {stat.label}
                  </p>
                </div>
                <p className="text-2xl font-bold text-amber-50 font-display">
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
                className="flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/5 px-5 py-2.5 text-xs font-semibold text-amber-300 transition-all hover:bg-amber-300/15 hover:scale-105 active:scale-95"
              >
                <action.icon size={14} />
                {action.label}
              </button>
            ))}
          </div>

          {/* Motto */}
          <div className="pt-2 pb-4">
            <p className="text-sm italic text-amber-100/30 tracking-wide">
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
                ? "border-amber-300/60 shadow-[0_0_60px_rgba(251,191,36,0.3)]"
                : "border-amber-300/20 shadow-[0_0_40px_rgba(251,191,36,0.15)]"
            }`}
          >
            {profileImage ? (
              <Image
                src={profileImage}
                alt="Profile"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              /* Placeholder gradient */
              <div className="absolute inset-0 bg-gradient-to-b from-amber-400/20 via-amber-600/10 to-black" />
            )}

            {/* Upload overlay */}
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center gap-4 transition-opacity ${
                profileImage
                  ? "opacity-0 hover:opacity-100 bg-black/60"
                  : "opacity-100"
              }`}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-amber-300/30 bg-black/40 backdrop-blur-sm">
                <Camera size={28} className="text-amber-300/80" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-amber-50/80">
                  {profileImage ? "Change Image" : "Upload Profile Image"}
                </p>
                <p className="mt-1 text-xs text-amber-100/40">
                  Drop your image here or click to browse
                </p>
              </div>
              <label className="cursor-pointer rounded-full border border-amber-300/30 bg-amber-300/10 px-5 py-2 text-xs font-semibold text-amber-300 transition-all hover:bg-amber-300/20 hover:scale-105 active:scale-95">
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
