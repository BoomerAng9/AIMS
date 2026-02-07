// frontend/app/dashboard/build/page.tsx
"use client";

import React, { useState } from "react";
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
  { name: "Amber", value: "#f59e0b", tw: "bg-amber-400" },
  { name: "Blue", value: "#3b82f6", tw: "bg-blue-500" },
  { name: "Emerald", value: "#10b981", tw: "bg-emerald-500" },
  { name: "Violet", value: "#8b5cf6", tw: "bg-violet-500" },
  { name: "Rose", value: "#f43f5e", tw: "bg-rose-500" },
  { name: "Slate", value: "#64748b", tw: "bg-slate-500" },
];

const PIPELINE_STAGES = ["INTAKE", "SCOPE", "BUILD", "REVIEW", "DEPLOY"];

const COMPLEXITY_COLORS: Record<string, string> = {
  simple: "border-emerald-400/30 text-emerald-400 bg-emerald-400/10",
  intermediate: "border-amber-400/30 text-amber-400 bg-amber-400/10",
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
    // Simulate POST to /api/plugs
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLaunched(true);
    setLaunching(false);
  };

  const templateData = TEMPLATES.find((t) => t.id === selectedTemplate);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <header>
        <p className="text-[10px] uppercase tracking-[0.3em] text-amber-200/50 mb-1">
          Plug Factory
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-amber-50 font-display">
          BUILD WIZARD
        </h1>
        <p className="mt-1 text-sm text-amber-100/50">
          Create a new Plug step by step. Engineer_Ang will handle the build pipeline.
        </p>
      </header>

      {/* Progress Bar */}
      <div className="rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-2xl">
        <div className="flex items-center justify-between mb-3">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <React.Fragment key={s}>
              <button
                onClick={() => s < step && setStep(s)}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  s === step
                    ? "bg-amber-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                    : s < step
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-pointer hover:bg-emerald-500/30"
                      : "bg-white/5 text-amber-100/30 border border-white/5"
                }`}
              >
                {s < step ? <Check size={14} /> : s}
              </button>
              {s < totalSteps && (
                <div className="flex-1 mx-2">
                  <div className="h-[2px] rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-amber-400/60 transition-all duration-500"
                      style={{ width: s < step ? "100%" : "0%" }}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between text-[10px] uppercase tracking-widest text-amber-100/30">
          <span className={step === 1 ? "text-amber-300" : ""}>Template</span>
          <span className={step === 2 ? "text-amber-300" : ""}>Features</span>
          <span className={step === 3 ? "text-amber-300" : ""}>Branding</span>
          <span className={step === 4 ? "text-amber-300" : ""}>Launch</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {/* Step 1: Choose Template */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90">
              Choose a Template
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`group relative overflow-hidden rounded-3xl border p-6 text-left backdrop-blur-2xl transition-all hover:bg-black/80 ${
                    selectedTemplate === template.id
                      ? "border-amber-300/40 bg-amber-300/5 shadow-[0_0_30px_rgba(251,191,36,0.1)]"
                      : "border-white/10 bg-black/60 hover:border-amber-300/20"
                  }`}
                >
                  {selectedTemplate === template.id && (
                    <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-black">
                      <Check size={12} />
                    </div>
                  )}
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-amber-200 group-hover:bg-amber-300 group-hover:text-black transition-colors mb-4">
                    <template.icon size={20} />
                  </div>
                  <h3 className="text-sm font-semibold text-amber-50">
                    {template.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${COMPLEXITY_COLORS[template.complexity]}`}
                    >
                      {template.complexity}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-amber-100/50 leading-relaxed">
                    {template.description}
                  </p>
                  <div className="mt-4 flex items-center gap-4 text-[10px] text-amber-100/40">
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
                  ? "border-amber-300/40 bg-amber-300/5"
                  : "border-white/10 bg-black/20 hover:border-amber-300/30"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-white/20 text-amber-100/30 group-hover:border-amber-300/40 group-hover:text-amber-300 transition-all">
                <Briefcase size={20} />
              </div>
              <p className="mt-3 text-sm font-semibold text-amber-200/50 group-hover:text-amber-200 transition-colors">
                Custom Build
              </p>
              <p className="mt-1 text-xs text-amber-100/30">
                Start from scratch with full control over every aspect.
              </p>
            </button>
          </div>
        )}

        {/* Step 2: Define Features */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90">
              Define Features
            </h2>

            {/* Feature Checklist */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-amber-100/40 mb-3">
                Select Capabilities
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {FEATURES.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => toggleFeature(feature.id)}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                      selectedFeatures.includes(feature.id)
                        ? "border-amber-300/40 bg-amber-300/5"
                        : "border-white/10 bg-black/60 hover:border-white/20"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                        selectedFeatures.includes(feature.id)
                          ? "bg-amber-400 text-black"
                          : "bg-white/5 text-amber-200/60"
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
                          ? "text-amber-50 font-medium"
                          : "text-amber-100/60"
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
              <p className="text-[10px] uppercase tracking-wider text-amber-100/40 mb-3">
                Industry
              </p>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map((industry) => (
                  <button
                    key={industry}
                    onClick={() => setSelectedIndustry(industry)}
                    className={`rounded-full border px-4 py-2 text-xs font-medium transition-all ${
                      selectedIndustry === industry
                        ? "border-amber-300/40 bg-amber-300/10 text-amber-200"
                        : "border-white/10 bg-black/60 text-amber-100/50 hover:border-white/20"
                    }`}
                  >
                    {industry}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Domain */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-amber-100/40 mb-2">
                Custom Domain (Optional)
              </p>
              <div className="relative max-w-md">
                <Globe
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-100/30"
                />
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="myapp.com"
                  className="w-full rounded-xl border border-white/10 bg-black/80 py-3 pl-9 pr-4 text-sm text-amber-50 outline-none focus:border-amber-300/40 placeholder:text-amber-100/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Branding */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90">
              Branding
            </h2>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                {/* Company Name */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-amber-100/40 mb-2">
                    Company Name
                  </p>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Your Company"
                    className="w-full rounded-xl border border-white/10 bg-black/80 p-3 text-sm text-amber-50 outline-none focus:border-amber-300/40 placeholder:text-amber-100/20"
                  />
                </div>

                {/* Primary Color */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-amber-100/40 mb-3">
                    Primary Color
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {COLORS.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setPrimaryColor(color.name)}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 transition-all ${
                          primaryColor === color.name
                            ? "border-amber-300/40 bg-white/5"
                            : "border-white/10 bg-black/60 hover:border-white/20"
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
                              ? "text-amber-50 font-medium"
                              : "text-amber-100/50"
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
                  <p className="text-[10px] uppercase tracking-wider text-amber-100/40 mb-2">
                    Logo
                  </p>
                  <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/40 transition-all hover:border-amber-300/20 cursor-pointer group">
                    <div className="text-center">
                      <Image
                        size={24}
                        className="mx-auto text-amber-100/20 group-hover:text-amber-300/50 transition-colors"
                      />
                      <p className="mt-2 text-xs text-amber-100/30">
                        Drag and drop or click to upload
                      </p>
                      <p className="text-[10px] text-amber-100/20 mt-1">
                        PNG, SVG up to 2MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Domain */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-amber-100/40 mb-2">
                    Domain
                  </p>
                  <div className="relative">
                    <Globe
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-100/30"
                    />
                    <input
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="yourcompany.com"
                      className="w-full rounded-xl border border-white/10 bg-black/80 py-3 pl-9 pr-4 text-sm text-amber-50 outline-none focus:border-amber-300/40 placeholder:text-amber-100/20"
                    />
                  </div>
                </div>
              </div>

              {/* Preview Panel */}
              <div className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
                <p className="text-[10px] uppercase tracking-wider text-amber-100/40 mb-4">
                  Preview
                </p>
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-xl ${
                        COLORS.find((c) => c.name === primaryColor)?.tw ||
                        "bg-amber-400"
                      } flex items-center justify-center text-white font-bold text-sm`}
                    >
                      {companyName ? companyName[0]?.toUpperCase() : "?"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-50">
                        {companyName || "Your Company"}
                      </p>
                      <p className="text-[10px] text-amber-100/40">
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
                      "bg-amber-400"
                    } opacity-80`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Launch */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90">
              Review &amp; Launch
            </h2>

            {/* Summary */}
            <div className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl space-y-6">
              {/* Template */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-amber-100/40 mb-2">
                  Template
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-amber-50">
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
                <p className="text-[10px] uppercase tracking-wider text-amber-100/40 mb-2">
                  Features ({selectedFeatures.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedFeatures.map((fId) => {
                    const feat = FEATURES.find((f) => f.id === fId);
                    return (
                      <span
                        key={fId}
                        className="rounded-full border border-amber-300/20 bg-amber-300/5 px-3 py-1 text-[10px] text-amber-200 font-medium"
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
                  <p className="text-[10px] uppercase tracking-wider text-amber-100/40 mb-1">
                    Industry
                  </p>
                  <p className="text-sm text-amber-50">
                    {selectedIndustry || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-amber-100/40 mb-1">
                    Domain
                  </p>
                  <p className="text-sm text-amber-50">
                    {domain || customDomain || "Not set"}
                  </p>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* Branding */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-amber-100/40 mb-1">
                    Company
                  </p>
                  <p className="text-sm text-amber-50">
                    {companyName || "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-amber-100/40 mb-1">
                    Primary Color
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-4 w-4 rounded-full ${
                        COLORS.find((c) => c.name === primaryColor)?.tw ||
                        "bg-amber-400"
                      }`}
                    />
                    <span className="text-sm text-amber-50">{primaryColor}</span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* Estimated Build */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-amber-100/40 mb-1">
                    Estimated Build Time
                  </p>
                  <p className="text-sm text-amber-50 flex items-center gap-1.5">
                    <Clock size={12} className="text-amber-300" />
                    {templateData?.estimatedTime || "3-5 days"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-amber-100/40 mb-1">
                    Estimated Cost
                  </p>
                  <p className="text-sm font-semibold text-amber-50">
                    Included in Plan
                  </p>
                </div>
              </div>
            </div>

            {/* Pipeline Stages */}
            <div className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
              <p className="text-[10px] uppercase tracking-wider text-amber-100/40 mb-4">
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
                              ? "border-amber-300/30 bg-amber-400/10 text-amber-300"
                              : "border-white/10 bg-white/5 text-amber-100/30"
                        }`}
                      >
                        {launched ? <Check size={14} /> : i + 1}
                      </div>
                      <span
                        className={`text-[9px] uppercase tracking-wider font-bold ${
                          launched
                            ? "text-emerald-400"
                            : i === 0
                              ? "text-amber-300"
                              : "text-amber-100/30"
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
                className="w-full flex items-center justify-center gap-3 rounded-2xl bg-amber-400 py-4 text-sm font-bold text-black shadow-[0_0_30px_rgba(251,191,36,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
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
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/60 px-5 py-2.5 text-xs font-medium text-amber-100/60 transition-all hover:border-white/20 hover:text-amber-50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={14} /> Previous
        </button>

        {step < totalSteps ? (
          <button
            onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}
            disabled={!canProceed()}
            className="flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-2.5 text-xs font-bold text-black shadow-[0_0_15px_rgba(251,191,36,0.2)] transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Next <ArrowRight size={14} />
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
