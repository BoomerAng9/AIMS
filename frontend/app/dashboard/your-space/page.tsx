// frontend/app/dashboard/your-space/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { User, Camera, Settings, Activity, Users, Building2, Loader2 } from "lucide-react";
import { SpaceStation } from "@/components/your-space/SpaceStation";
import { Spacecraft } from "@/components/your-space/Spacecraft";

// StarfieldBackground uses framer-motion with useRef — safe for client but
// dynamic-import keeps the bundle lean for SSR and avoids hydration flicker.
const StarfieldBackground = dynamic(
  () => import("@/components/your-space/StarfieldBackground").then((m) => m.StarfieldBackground),
  { ssr: false }
);

interface UserStats {
  tasksCompleted: number;
  activeAgents: number;
  projects: number;
  uptime: string;
}

export default function YourSpacePage() {
  const { data: session, status } = useSession();
  const [bio, setBio] = useState(
    "Builder, operator, and orchestrator. Leveraging AI agents to ship faster and think bigger."
  );
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    tasksCompleted: 0,
    activeAgents: 0,
    projects: 0,
    uptime: "—",
  });

  // Fetch live project count
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          const projects = data.projects || [];
          const completed = projects.filter((p: any) => p.status === "completed" || p.status === "deployed").length;
          setUserStats(prev => ({
            ...prev,
            projects: projects.length,
            tasksCompleted: completed,
          }));
        }
      } catch {
        // Silent fallback
      }
    }
    fetchStats();
  }, []);

  // Space station & spacecraft state (tied to profile)
  const [showShip, setShowShip] = useState(false);
  const [stationData, setStationData] = useState({
    fuel: 847,
    maxFuel: 1000,
    materials: 234,
    crewCount: 23,
    visitors: 156,
  });

  const stats = [
    { label: "Tasks Completed", value: String(userStats.tasksCompleted), icon: Activity },
    { label: "Active Agents", value: String(userStats.activeAgents || "—"), icon: Users },
    { label: "Projects", value: String(userStats.projects), icon: Building2 },
    { label: "Uptime", value: userStats.uptime, icon: Activity },
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

  const userName = session?.user?.name || "ACHEEVY Operator";
  const userEmail = session?.user?.email || "";
  const userRole = (session?.user as any)?.role || "USER";
  const memberSince = session?.user ? "Member" : "—";

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20 animate-in fade-in">
        <Loader2 size={24} className="animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="relative animate-in fade-in duration-700">
      {/* Subtle starfield behind the profile — light theme, contained within page */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl opacity-50 pointer-events-none">
        <StarfieldBackground
          starCount={120}
          showPlanets={false}
          showNebulae
          showShootingStars={false}
          theme="light"
          contained
        />
      </div>

      {/* Two-column layout: profile info left, hero image right */}
      <div className="flex flex-col-reverse lg:flex-row gap-6 lg:gap-8">
        {/* Left Column: Profile Info */}
        <div className="w-full lg:w-[45%] space-y-6">
          {/* Header */}
          <header>
            <p className="text-xs uppercase tracking-[0.3em] text-gold/50 mb-1">
              Profile &amp; Identity
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100 font-display">
              YOUR SPACE
            </h1>
          </header>

          {/* User Info Card */}
          <section className="rounded-3xl border border-wireframe-stroke bg-[#18181B]/70 p-6 backdrop-blur-2xl space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold">
                <User size={22} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">
                  {userName}
                </h2>
                <p className="text-xs text-zinc-500 font-mono">
                  {userEmail || `@${userName.toLowerCase().replace(/\s+/g, '')}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-zinc-500">
                  Role
                </p>
                <p className="text-sm text-zinc-400">{userRole === "OWNER" ? "Platform Owner" : "Member"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-zinc-500">
                  Status
                </p>
                <p className="text-sm text-emerald-400">{memberSince}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-zinc-500">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-wireframe-stroke bg-[#111113]/80 p-3 text-sm text-zinc-100 outline-none focus:border-gold/30 transition-colors resize-none leading-relaxed"
              />
            </div>
          </section>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-wireframe-stroke bg-[#18181B]/70 p-4 backdrop-blur-xl"
              >
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon size={13} className="text-gold" />
                  <p className="text-xs uppercase tracking-wider text-zinc-500">
                    {stat.label}
                  </p>
                </div>
                <p className="text-2xl font-bold text-zinc-100 font-display">
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
            <p className="text-sm italic text-zinc-600 tracking-wide">
              &ldquo;Activity breeds Activity.&rdquo;
            </p>
          </div>
        </div>

        {/* Right Column: Hero Profile Image */}
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
                  ? "opacity-0 hover:opacity-100 bg-[#18181B]/70"
                  : "opacity-100"
              }`}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/20 bg-[#1F1F23]/60 backdrop-blur-sm">
                <Camera size={28} className="text-gold/80" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-zinc-100">
                  {profileImage ? "Change Image" : "Upload Profile Image"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
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
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/60 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Space Station & Spacecraft ──────────────────────────── */}
      <div className="mt-8 space-y-6">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-gold/50 mb-1">
            Home Base &amp; Fleet
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-display">
            YOUR STATION
          </h2>
        </header>

        {/* Station / Ship toggle */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setShowShip(false)}
            className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all ${
              !showShip
                ? "bg-gold/10 border-gold/30 text-gold"
                : "bg-slate-50 border-wireframe-stroke text-slate-400 hover:text-slate-600"
            }`}
          >
            Station
          </button>
          <button
            onClick={() => setShowShip(true)}
            className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all ${
              showShip
                ? "bg-gold/10 border-gold/30 text-gold"
                : "bg-slate-50 border-wireframe-stroke text-slate-400 hover:text-slate-600"
            }`}
          >
            Spacecraft
          </button>
        </div>

        {/* Conditionally show Station or Ship */}
        {!showShip ? (
          <SpaceStation
            name={userName + "'s Station"}
            level="moon"
            fuel={stationData.fuel}
            maxFuel={stationData.maxFuel}
            materials={stationData.materials}
            crewCount={stationData.crewCount}
            visitors={stationData.visitors}
            onLaunch={() => setShowShip(true)}
            onMine={() => {
              setStationData((prev) => ({
                ...prev,
                fuel: Math.min(prev.fuel + 50, prev.maxFuel),
                materials: prev.materials + 10,
              }));
            }}
            onBuild={() => console.log("Build with Claude Code")}
          />
        ) : (
          <Spacecraft
            name="Star Chaser"
            shipClass="cruiser"
            fuel={stationData.fuel}
            maxFuel={stationData.maxFuel}
            speed={12}
            cargo={45}
            maxCargo={100}
            isLaunched={false}
            onCustomize={() => console.log("Customize ship")}
          />
        )}
      </div>
    </div>
  );
}
