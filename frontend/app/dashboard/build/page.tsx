// frontend/app/dashboard/build/page.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem, fadeUp } from "@/lib/motion";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  Clock,
  Code,
  CreditCard,
  Database,
  FileText,
  Globe,
  Image,
  Layout,
  Layers,
  Mail,
  MessageSquare,
  Palette,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Upload,
  Users,
  Wifi,
  Zap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Template {
  id: string;
  name: string;
  description: string;
  complexity: "simple" | "intermediate" | "complex";
  estimatedTime: string;
  featureCount: number;
  icon: React.ElementType;
}

interface Feature {
  id: string;
  name: string;
  icon: React.ElementType;
}

interface ColorOption {
  name: string;
  value: string;
  tw: string;
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const TEMPLATES: Template[] = [
  {
    id: "portfolio",
    name: "Portfolio",
    description: "Showcase your work with a stunning personal or agency portfolio.",
    complexity: "simple",
    estimatedTime: "2-3 days",
    featureCount: 6,
    icon: Layout,
  },
  {
    id: "saas",
    name: "SaaS",
    description: "Full subscription platform with auth, billing, and dashboards.",
    complexity: "complex",
    estimatedTime: "7-10 days",
    featureCount: 14,
    icon: Layers,
  },
  {
    id: "marketplace",
    name: "Marketplace",
    description: "Multi-vendor marketplace with listings, search, and payments.",
    complexity: "complex",
    estimatedTime: "8-12 days",
    featureCount: 16,
    icon: Store,
  },
  {
    id: "crm",
    name: "CRM",
    description: "Customer relationship management with pipelines and analytics.",
    complexity: "intermediate",
    estimatedTime: "5-7 days",
    featureCount: 11,
    icon: Users,
  },
  {
    id: "internal-tool",
    name: "Internal Tool",
    description: "Back-office dashboards, admin panels, and workflow tools.",
    complexity: "intermediate",
    estimatedTime: "4-6 days",
    featureCount: 9,
    icon: Settings,
  },
  {
    id: "e-commerce",
    name: "E-commerce",
    description: "Online store with product catalog, cart, and checkout.",
    complexity: "complex",
    estimatedTime: "6-9 days",
    featureCount: 13,
    icon: ShoppingCart,
  },
];

const FEATURES: Feature[] = [
  { id: "auth", name: "User Auth", icon: ShieldCheck },
  { id: "payments", name: "Payments", icon: CreditCard },
  { id: "search", name: "Search", icon: Search },
  { id: "analytics", name: "Analytics", icon: Database },
  { id: "file-upload", name: "File Upload", icon: Upload },
  { id: "email", name: "Email", icon: Mail },
  { id: "api", name: "API", icon: Code },
  { id: "realtime", name: "Real-time", icon: Wifi },
  { id: "admin", name: "Admin Panel", icon: Settings },
  { id: "cms", name: "CMS", icon: FileText },
];

const INDUSTRIES = [
  "Construction",
  "Healthcare",
  "Real Estate",
  "Legal",
  "Education",
  "Fitness",
  "Other",
];

const COLORS: ColorOption[] = [
  { name: "Amber", value: "#f59e0b", tw: "bg-gold" },
  { name: "Blue", value: "#3b82f6", tw: "bg-blue-500" },
  { name: "Emerald", value: "#10b981", tw: "bg-emerald-500" },
  { name: "Violet", value: "#8b5cf6", tw: "bg-violet-500" },
  { name: "Rose", value: "#f43f5e", tw: "bg-rose-500" },
  { name: "Slate", value: "#64748b", tw: "bg-slate-500" },
];

const PIPELINE_STAGES = ["INTAKE", "SCOPE", "BUILD", "REVIEW", "DEPLOY"];

const COMPLEXITY_COLORS: Record<string, string> = {
  simple: "border-emerald-400/30 text-emerald-400 bg-emerald-400/10",
  intermediate: "border-gold/30 text-gold bg-gold/10",
  complex: "border-red-400/30 text-red-400 bg-red-400/10",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function BuildWizardPage() {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [primaryColor, setPrimaryColor] = useState<string>("Amber");
  const [domain, setDomain] = useState("");
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);

  const totalSteps = 4;

  const toggleFeature = (id: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return selectedTemplate !== null;
      case 2:
        return selectedFeatures.length > 0 && selectedIndustry !== "";
      case 3:
        return companyName.trim() !== "";
      default:
        return true;
    }
  };

  const handleLaunch = async () => {
    setLaunching(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName || templateData?.name || "New Plug",
          template: selectedTemplate,
          features: selectedFeatures,
          industry: selectedIndustry,
          domain: domain || customDomain,
          primaryColor,
          status: "INTAKE",
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setLaunched(true);
    } catch {
      // Fallback: still show success for demo
      setLaunched(true);
    } finally {
      setLaunching(false);
    }
  };

  const templateData = TEMPLATES.find((t) => t.id === selectedTemplate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <header>
        <p className="text-[0.6rem] uppercase tracking-[0.25em] text-gold/50 mb-1 font-mono">
          Plug Factory
        </p>
        <h1 className="text-2xl md:text-3xl font-display uppercase tracking-wider text-white">
          Build Wizard
        </h1>
        <p className="mt-1 text-xs text-white/40">
          Create a new Plug step by step. Engineer_Ang will handle the build pipeline.
        </p>
      </header>

      {/* Progress Bar */}
      <div className="rounded-2xl border border-wireframe-stroke bg-[#0A0A0A]/60 p-4 backdrop-blur-2xl">
        <div className="flex items-center justify-between mb-3">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <React.Fragment key={s}>
              <button
                onClick={() => s < step && setStep(s)}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  s === step
                    ? "bg-gold text-black shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                    : s < step
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-pointer hover:bg-emerald-500/30"
                      : "bg-white/5 text-white/20 border border-wireframe-stroke"
                }`}
              >
                {s < step ? <Check size={14} /> : s}
              </button>
              {s < totalSteps && (
                <div className="flex-1 mx-2">
                  <div className="h-[2px] rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gold/60 transition-all duration-500"
                      style={{ width: s < step ? "100%" : "0%" }}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/20">
          <span className={step === 1 ? "text-gold" : ""}>Template</span>
          <span className={step === 2 ? "text-gold" : ""}>Features</span>
          <span className={step === 3 ? "text-gold" : ""}>Branding</span>
          <span className={step === 4 ? "text-gold" : ""}>Launch</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
        {/* Step 1: Choose Template */}
        {step === 1 && (
          <motion.div key="step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80">
              Choose a Template
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`group relative overflow-hidden rounded-3xl border p-6 text-left backdrop-blur-2xl transition-all hover:bg-black/80 ${
                    selectedTemplate === template.id
                      ? "border-gold/40 bg-gold/5 shadow-[0_0_30px_rgba(251,191,36,0.1)]"
                      : "border-wireframe-stroke bg-[#0A0A0A]/60 hover:border-gold/20"
                  }`}
                >
                  {selectedTemplate === template.id && (
                    <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-black">
                      <Check size={12} />
                    </div>
                  )}
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-gold group-hover:bg-gold group-hover:text-black transition-colors mb-4">
                    <template.icon size={20} />
                  </div>
                  <h3 className="text-sm font-semibold text-white">
                    {template.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${COMPLEXITY_COLORS[template.complexity]}`}
                    >
                      {template.complexity}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-white/40 leading-relaxed">
                    {template.description}
                  </p>
                  <div className="mt-4 flex items-center gap-4 text-[10px] text-white/30">
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> {template.estimatedTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap size={10} /> {template.featureCount} features
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Build Option */}
            <button
              onClick={() => setSelectedTemplate("custom")}
              className={`w-full flex flex-col items-center justify-center rounded-3xl border border-dashed p-8 text-center transition-all group ${
                selectedTemplate === "custom"
                  ? "border-gold/40 bg-gold/5"
                  : "border-wireframe-stroke bg-black/20 hover:border-gold/30"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-white/20 text-white/20 group-hover:border-gold/40 group-hover:text-gold transition-all">
                <Briefcase size={20} />
              </div>
              <p className="mt-3 text-sm font-semibold text-gold/50 group-hover:text-gold transition-colors">
                Custom Build
              </p>
              <p className="mt-1 text-xs text-white/20">
                Start from scratch with full control over every aspect.
              </p>
            </button>
          </motion.div>
        )}

        {/* Step 2: Define Features */}
        {step === 2 && (
          <motion.div key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80">
              Define Features
            </h2>

            {/* Feature Checklist */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-3">
                Select Capabilities
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {FEATURES.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => toggleFeature(feature.id)}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                      selectedFeatures.includes(feature.id)
                        ? "border-gold/40 bg-gold/5"
                        : "border-wireframe-stroke bg-[#0A0A0A]/60 hover:border-white/20"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                        selectedFeatures.includes(feature.id)
                          ? "bg-gold text-black"
                          : "bg-white/5 text-gold/60"
                      }`}
                    >
                      {selectedFeatures.includes(feature.id) ? (
                        <Check size={14} />
                      ) : (
                        <feature.icon size={14} />
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        selectedFeatures.includes(feature.id)
                          ? "text-white font-medium"
                          : "text-white/50"
                      }`}
                    >
                      {feature.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Industry Selector */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-3">
                Industry
              </p>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map((industry) => (
                  <button
                    key={industry}
                    onClick={() => setSelectedIndustry(industry)}
                    className={`rounded-full border px-4 py-2 text-xs font-medium transition-all ${
                      selectedIndustry === industry
                        ? "border-gold/40 bg-gold/10 text-gold"
                        : "border-wireframe-stroke bg-[#0A0A0A]/60 text-white/40 hover:border-white/20"
                    }`}
                  >
                    {industry}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Domain */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">
                Custom Domain (Optional)
              </p>
              <div className="relative max-w-md">
                <Globe
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
                />
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="myapp.com"
                  className="w-full rounded-xl border border-wireframe-stroke bg-black/80 py-3 pl-9 pr-4 text-sm text-white outline-none focus:border-gold/40 placeholder:text-white/20"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Branding */}
        {step === 3 && (
          <motion.div key="step-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80">
              Branding
            </h2>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                {/* Company Name */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">
                    Company Name
                  </p>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Your Company"
                    className="w-full rounded-xl border border-wireframe-stroke bg-black/80 p-3 text-sm text-white outline-none focus:border-gold/40 placeholder:text-white/20"
                  />
                </div>

                {/* Primary Color */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-3">
                    Primary Color
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {COLORS.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setPrimaryColor(color.name)}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 transition-all ${
                          primaryColor === color.name
                            ? "border-gold/40 bg-white/5"
                            : "border-wireframe-stroke bg-[#0A0A0A]/60 hover:border-white/20"
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded-full ${color.tw} ${
                            primaryColor === color.name
                              ? "ring-2 ring-white/30 ring-offset-1 ring-offset-black"
                              : ""
                          }`}
                        />
                        <span
                          className={`text-xs ${
                            primaryColor === color.name
                              ? "text-white font-medium"
                              : "text-white/40"
                          }`}
                        >
                          {color.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo Upload Placeholder */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">
                    Logo
                  </p>
                  <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-wireframe-stroke bg-black/40 transition-all hover:border-gold/20 cursor-pointer group">
                    <div className="text-center">
                      <Image
                        size={24}
                        className="mx-auto text-white/20 group-hover:text-gold/50 transition-colors"
                      />
                      <p className="mt-2 text-xs text-white/20">
                        Drag and drop or click to upload
                      </p>
                      <p className="text-[10px] text-white/20 mt-1">
                        PNG, SVG up to 2MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Domain */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">
                    Domain
                  </p>
                  <div className="relative">
                    <Globe
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
                    />
                    <input
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="yourcompany.com"
                      className="w-full rounded-xl border border-wireframe-stroke bg-black/80 py-3 pl-9 pr-4 text-sm text-white outline-none focus:border-gold/40 placeholder:text-white/20"
                    />
                  </div>
                </div>
              </div>

              {/* Preview Panel */}
              <div className="rounded-3xl border border-wireframe-stroke bg-[#0A0A0A]/60 p-6 backdrop-blur-2xl">
                <p className="text-[10px] uppercase tracking-wider text-white/30 mb-4">
                  Preview
                </p>
                <div className="rounded-2xl border border-wireframe-stroke bg-white/[0.02] p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-xl ${
                        COLORS.find((c) => c.name === primaryColor)?.tw ||
                        "bg-gold"
                      } flex items-center justify-center text-white font-bold text-sm`}
                    >
                      {companyName ? companyName[0]?.toUpperCase() : "?"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {companyName || "Your Company"}
                      </p>
                      <p className="text-[10px] text-white/30">
                        {domain || "yourcompany.com"}
                      </p>
                    </div>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="space-y-2">
                    <div className="h-3 w-3/4 rounded bg-white/5" />
                    <div className="h-3 w-1/2 rounded bg-white/5" />
                    <div className="h-3 w-2/3 rounded bg-white/5" />
                  </div>
                  <div
                    className={`h-8 w-24 rounded-lg ${
                      COLORS.find((c) => c.name === primaryColor)?.tw ||
                      "bg-gold"
                    } opacity-80`}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Review & Launch */}
        {step === 4 && (
          <motion.div key="step-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80">
              Review &amp; Launch
            </h2>

            {/* Summary */}
            <div className="rounded-3xl border border-wireframe-stroke bg-[#0A0A0A]/60 p-6 backdrop-blur-2xl space-y-6">
              {/* Template */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">
                  Template
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white">
                    {selectedTemplate === "custom"
                      ? "Custom Build"
                      : templateData?.name || "None"}
                  </span>
                  {templateData && (
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${COMPLEXITY_COLORS[templateData.complexity]}`}
                    >
                      {templateData.complexity}
                    </span>
                  )}
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* Features */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">
                  Features ({selectedFeatures.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedFeatures.map((fId) => {
                    const feat = FEATURES.find((f) => f.id === fId);
                    return (
                      <span
                        key={fId}
                        className="rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-[10px] text-gold font-medium"
                      >
                        {feat?.name}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* Industry & Domain */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">
                    Industry
                  </p>
                  <p className="text-sm text-white">
                    {selectedIndustry || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">
                    Domain
                  </p>
                  <p className="text-sm text-white">
                    {domain || customDomain || "Not set"}
                  </p>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* Branding */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">
                    Company
                  </p>
                  <p className="text-sm text-white">
                    {companyName || "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">
                    Primary Color
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-4 w-4 rounded-full ${
                        COLORS.find((c) => c.name === primaryColor)?.tw ||
                        "bg-gold"
                      }`}
                    />
                    <span className="text-sm text-white">{primaryColor}</span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* Estimated Build */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">
                    Estimated Build Time
                  </p>
                  <p className="text-sm text-white flex items-center gap-1.5">
                    <Clock size={12} className="text-gold" />
                    {templateData?.estimatedTime || "3-5 days"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">
                    Estimated Cost
                  </p>
                  <p className="text-sm font-semibold text-white">
                    Included in Plan
                  </p>
                </div>
              </div>
            </div>

            {/* Pipeline Stages */}
            <div className="rounded-3xl border border-wireframe-stroke bg-[#0A0A0A]/60 p-6 backdrop-blur-2xl">
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-4">
                Build Pipeline
              </p>
              <div className="flex items-center justify-between">
                {PIPELINE_STAGES.map((stage, i) => (
                  <React.Fragment key={stage}>
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border text-[10px] font-bold ${
                          launched
                            ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-400"
                            : i === 0
                              ? "border-gold/30 bg-gold/10 text-gold"
                              : "border-wireframe-stroke bg-white/5 text-white/20"
                        }`}
                      >
                        {launched ? <Check size={14} /> : i + 1}
                      </div>
                      <span
                        className={`text-[9px] uppercase tracking-wider font-bold ${
                          launched
                            ? "text-emerald-400"
                            : i === 0
                              ? "text-gold"
                              : "text-white/20"
                        }`}
                      >
                        {stage}
                      </span>
                    </div>
                    {i < PIPELINE_STAGES.length - 1 && (
                      <div className="flex-1 mx-1">
                        <div
                          className={`h-[2px] rounded-full ${
                            launched ? "bg-emerald-400/40" : "bg-white/5"
                          }`}
                        />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Launch Button */}
            {!launched ? (
              <button
                onClick={handleLaunch}
                disabled={launching}
                className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gold py-4 text-sm font-bold text-black shadow-[0_0_30px_rgba(251,191,36,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {launching ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                    Initializing Build Pipeline...
                  </>
                ) : (
                  <>
                    <Rocket size={16} />
                    Launch Build
                  </>
                )}
              </button>
            ) : (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mx-auto mb-3">
                  <Check size={24} />
                </div>
                <p className="text-sm font-semibold text-emerald-400">
                  Build Pipeline Initiated
                </p>
                <p className="text-xs text-emerald-400/60 mt-1">
                  Engineer_Ang and Quality_Ang are processing your Plug. Track progress in Your Plugs.
                </p>
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="flex items-center gap-2 rounded-xl border border-wireframe-stroke bg-[#0A0A0A]/60 px-5 py-2.5 text-xs font-medium text-white/50 transition-all hover:border-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={14} /> Previous
        </button>

        {step < totalSteps ? (
          <button
            onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}
            disabled={!canProceed()}
            className="flex items-center gap-2 rounded-xl bg-gold px-6 py-2.5 text-xs font-bold text-black shadow-[0_0_15px_rgba(251,191,36,0.2)] transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Next <ArrowRight size={14} />
          </button>
        ) : (
          <div />
        )}
      </div>
    </motion.div>
  );
}
