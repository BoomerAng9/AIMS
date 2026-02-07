// frontend/app/dashboard/make-it-mine/page.tsx
"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Layers,
  Layout,
  Palette,
  Repeat2,
  Settings,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  ToggleLeft,
  ToggleRight,
  Users,
  Zap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types & Data                                                       */
/* ------------------------------------------------------------------ */

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  features: string[];
  terminology: { original: string; label: string }[];
  previewColor: string;
}

interface TermMapping {
  original: string;
  custom: string;
}

interface FeatureToggle {
  id: string;
  name: string;
  enabled: boolean;
}

const TEMPLATES: Template[] = [
  {
    id: "portfolio",
    name: "Portfolio",
    description: "Showcase your work with a stunning personal or agency portfolio.",
    icon: Layout,
    features: ["Projects Gallery", "About Page", "Contact Form", "Blog", "Analytics", "SEO Optimization"],
    terminology: [
      { original: "Project", label: "What to call a project" },
      { original: "Client", label: "What to call a client" },
      { original: "Gallery", label: "What to call the gallery" },
    ],
    previewColor: "bg-violet-500",
  },
  {
    id: "saas",
    name: "SaaS",
    description: "Full subscription platform with auth, billing, and dashboards.",
    icon: Layers,
    features: ["User Auth", "Subscription Billing", "Dashboard", "Team Management", "API Access", "Analytics", "Admin Panel", "Email Notifications"],
    terminology: [
      { original: "Workspace", label: "What to call a workspace" },
      { original: "Member", label: "What to call a member" },
      { original: "Plan", label: "What to call a plan" },
    ],
    previewColor: "bg-blue-500",
  },
  {
    id: "marketplace",
    name: "Marketplace",
    description: "Multi-vendor marketplace with listings, search, and payments.",
    icon: Store,
    features: ["Product Listings", "Vendor Profiles", "Search & Filters", "Payments", "Reviews", "Messaging", "Admin Panel", "Categories"],
    terminology: [
      { original: "Product", label: "What to call a product" },
      { original: "Vendor", label: "What to call a vendor" },
      { original: "Order", label: "What to call an order" },
    ],
    previewColor: "bg-emerald-500",
  },
  {
    id: "crm",
    name: "CRM",
    description: "Customer relationship management with pipelines and analytics.",
    icon: Users,
    features: ["Contact Management", "Deal Pipeline", "Task Tracking", "Email Integration", "Reports", "Team Roles", "Activity Log", "Import/Export"],
    terminology: [
      { original: "Contact", label: "What to call a contact" },
      { original: "Deal", label: "What to call a deal" },
      { original: "Pipeline", label: "What to call a pipeline" },
    ],
    previewColor: "bg-amber-500",
  },
  {
    id: "internal-tool",
    name: "Internal Tool",
    description: "Back-office dashboards, admin panels, and workflow tools.",
    icon: Settings,
    features: ["Data Tables", "Forms", "Role-Based Access", "Audit Logs", "Notifications", "Dashboard Widgets", "File Management"],
    terminology: [
      { original: "Record", label: "What to call a record" },
      { original: "Department", label: "What to call a department" },
      { original: "Workflow", label: "What to call a workflow" },
    ],
    previewColor: "bg-slate-500",
  },
  {
    id: "e-commerce",
    name: "E-commerce",
    description: "Online store with product catalog, cart, and checkout.",
    icon: ShoppingCart,
    features: ["Product Catalog", "Shopping Cart", "Checkout", "Payments", "Inventory", "Order Management", "Customer Accounts", "Reviews", "Coupons"],
    terminology: [
      { original: "Product", label: "What to call a product" },
      { original: "Cart", label: "What to call the cart" },
      { original: "Order", label: "What to call an order" },
    ],
    previewColor: "bg-rose-500",
  },
];

const INDUSTRIES = [
  { id: "construction", label: "Construction", mappings: { Product: "Material", Contact: "Subcontractor", Deal: "Bid", Vendor: "Supplier", Order: "Purchase Order", Project: "Job Site", Pipeline: "Bid Pipeline", Cart: "Quote", Record: "Log Entry", Workspace: "Crew", Member: "Foreman", Client: "General Contractor", Gallery: "Project Portfolio", Department: "Trade", Workflow: "Work Order", Plan: "Contract" } },
  { id: "healthcare", label: "Healthcare", mappings: { Product: "Service", Contact: "Patient", Deal: "Case", Vendor: "Provider", Order: "Appointment", Project: "Treatment Plan", Pipeline: "Patient Flow", Cart: "Care Package", Record: "Medical Record", Workspace: "Practice", Member: "Practitioner", Client: "Patient", Gallery: "Case Studies", Department: "Specialty", Workflow: "Care Protocol", Plan: "Coverage" } },
  { id: "real-estate", label: "Real Estate", mappings: { Product: "Property", Contact: "Lead", Deal: "Listing", Vendor: "Agent", Order: "Offer", Project: "Development", Pipeline: "Listing Pipeline", Cart: "Shortlist", Record: "Transaction", Workspace: "Brokerage", Member: "Agent", Client: "Buyer", Gallery: "Property Gallery", Department: "Office", Workflow: "Closing Process", Plan: "Commission Plan" } },
  { id: "legal", label: "Legal", mappings: { Product: "Service", Contact: "Client", Deal: "Case", Vendor: "Attorney", Order: "Filing", Project: "Matter", Pipeline: "Case Pipeline", Cart: "Engagement", Record: "Case File", Workspace: "Firm", Member: "Associate", Client: "Client", Gallery: "Case Archive", Department: "Practice Area", Workflow: "Case Procedure", Plan: "Retainer" } },
  { id: "education", label: "Education", mappings: { Product: "Course", Contact: "Student", Deal: "Enrollment", Vendor: "Instructor", Order: "Registration", Project: "Curriculum", Pipeline: "Enrollment Pipeline", Cart: "Course Cart", Record: "Transcript", Workspace: "Classroom", Member: "Teacher", Client: "Parent", Gallery: "Course Catalog", Department: "Faculty", Workflow: "Academic Process", Plan: "Tuition Plan" } },
  { id: "fitness", label: "Fitness", mappings: { Product: "Program", Contact: "Member", Deal: "Membership", Vendor: "Trainer", Order: "Booking", Project: "Training Plan", Pipeline: "Member Pipeline", Cart: "Session Cart", Record: "Activity Log", Workspace: "Gym", Member: "Trainer", Client: "Client", Gallery: "Transformation Gallery", Department: "Studio", Workflow: "Training Routine", Plan: "Membership Plan" } },
];

const COLOR_OPTIONS = [
  { name: "Amber", tw: "bg-amber-400", accent: "border-amber-400" },
  { name: "Blue", tw: "bg-blue-500", accent: "border-blue-500" },
  { name: "Emerald", tw: "bg-emerald-500", accent: "border-emerald-500" },
  { name: "Violet", tw: "bg-violet-500", accent: "border-violet-500" },
  { name: "Rose", tw: "bg-rose-500", accent: "border-rose-500" },
  { name: "Slate", tw: "bg-slate-500", accent: "border-slate-500" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function MakeItMinePage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [termMappings, setTermMappings] = useState<TermMapping[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [selectedColor, setSelectedColor] = useState("Amber");
  const [featureToggles, setFeatureToggles] = useState<FeatureToggle[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const template = TEMPLATES.find((t) => t.id === selectedTemplate);
  const industry = INDUSTRIES.find((i) => i.id === selectedIndustry);

  const handleSelectTemplate = (id: string) => {
    const tmpl = TEMPLATES.find((t) => t.id === id);
    if (!tmpl) return;

    setSelectedTemplate(id);
    setTermMappings(
      tmpl.terminology.map((t) => ({ original: t.original, custom: t.original }))
    );
    setFeatureToggles(
      tmpl.features.map((f) => ({
        id: f.toLowerCase().replace(/\s+/g, "-").replace(/[&/]/g, ""),
        name: f,
        enabled: true,
      }))
    );
    setSelectedIndustry(null);
    setShowPreview(false);
  };

  const handleSelectIndustry = (industryId: string) => {
    setSelectedIndustry(industryId);
    const ind = INDUSTRIES.find((i) => i.id === industryId);
    if (!ind || !template) return;

    // Auto-map terminology based on industry presets
    setTermMappings(
      template.terminology.map((t) => ({
        original: t.original,
        custom:
          (ind.mappings as Record<string, string>)[t.original] || t.original,
      }))
    );
  };

  const updateTermMapping = (original: string, custom: string) => {
    setTermMappings((prev) =>
      prev.map((m) => (m.original === original ? { ...m, custom } : m))
    );
  };

  const toggleFeature = (featureId: string) => {
    setFeatureToggles((prev) =>
      prev.map((f) =>
        f.id === featureId ? { ...f, enabled: !f.enabled } : f
      )
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <header>
        <p className="text-[10px] uppercase tracking-[0.3em] text-amber-200/50 mb-1">
          Clone Engine
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-amber-50 font-display">
          MAKE IT MINE
        </h1>
        <p className="mt-1 text-sm text-amber-100/50">
          Clone an existing template and customize it for your industry.
          Picker_Ang matches the right tools. Engineer_Ang handles the build.
        </p>
      </header>

      {/* Template Gallery */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Copy size={14} className="text-amber-200" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
            Choose a Template to Clone
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => handleSelectTemplate(tmpl.id)}
              className={`group relative overflow-hidden rounded-3xl border p-6 text-left backdrop-blur-2xl transition-all ${
                selectedTemplate === tmpl.id
                  ? "border-amber-300/40 bg-amber-300/5 shadow-[0_0_30px_rgba(251,191,36,0.1)]"
                  : "border-white/10 bg-black/60 hover:border-amber-300/20 hover:bg-black/80"
              }`}
            >
              {selectedTemplate === tmpl.id && (
                <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-black">
                  <Check size={12} />
                </div>
              )}
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-amber-200 group-hover:bg-amber-300 group-hover:text-black transition-colors mb-3">
                <tmpl.icon size={20} />
              </div>
              <h3 className="text-sm font-semibold text-amber-50">{tmpl.name}</h3>
              <p className="mt-2 text-xs text-amber-100/50 leading-relaxed">
                {tmpl.description}
              </p>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-amber-100/30">
                <Zap size={10} /> {tmpl.features.length} features
              </div>
              <div className="mt-3">
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300/70 group-hover:text-amber-300">
                  <Copy size={10} /> Clone this template
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Customization Panel -- shown when template is selected */}
      {selectedTemplate && template && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Industry Selector */}
          <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Tag size={14} className="text-amber-200" />
              <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
                Industry Preset
              </h2>
            </div>
            <p className="text-xs text-amber-100/40 mb-4">
              Select your industry and terminology will auto-map to match.
            </p>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind.id}
                  onClick={() => handleSelectIndustry(ind.id)}
                  className={`rounded-full border px-4 py-2 text-xs font-medium transition-all ${
                    selectedIndustry === ind.id
                      ? "border-amber-300/40 bg-amber-300/10 text-amber-200"
                      : "border-white/10 bg-black/60 text-amber-100/50 hover:border-white/20"
                  }`}
                >
                  {ind.label}
                </button>
              ))}
            </div>
          </section>

          {/* Terminology Mapper */}
          <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Repeat2 size={14} className="text-amber-200" />
              <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
                Terminology Mapper
              </h2>
            </div>
            <p className="text-xs text-amber-100/40 mb-4">
              Rename the default terms to match your industry language.
            </p>
            <div className="space-y-3">
              {termMappings.map((mapping) => (
                <div
                  key={mapping.original}
                  className="flex items-center gap-4 rounded-2xl bg-white/[0.03] p-4"
                >
                  <div className="flex-1">
                    <p className="text-[9px] uppercase tracking-wider text-amber-100/30 mb-1">
                      Original
                    </p>
                    <p className="text-sm text-amber-100/50 font-mono">
                      {mapping.original}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-amber-300/30 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[9px] uppercase tracking-wider text-amber-100/30 mb-1">
                      Your Term
                    </p>
                    <input
                      type="text"
                      value={mapping.custom}
                      onChange={(e) =>
                        updateTermMapping(mapping.original, e.target.value)
                      }
                      className="w-full rounded-lg border border-white/10 bg-black/80 px-3 py-1.5 text-sm text-amber-50 font-mono outline-none focus:border-amber-300/40 placeholder:text-amber-100/20"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Branding */}
          <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Palette size={14} className="text-amber-200" />
              <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
                Branding
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
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

              {/* Color Picker */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-amber-100/40 mb-2">
                  Primary Color
                </p>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-all ${
                        selectedColor === color.name
                          ? "border-amber-300/40 bg-white/5"
                          : "border-white/10 bg-black/60 hover:border-white/20"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full ${color.tw} ${
                          selectedColor === color.name
                            ? "ring-2 ring-white/30 ring-offset-1 ring-offset-black"
                            : ""
                        }`}
                      />
                      <span className="text-[10px] text-amber-100/50">
                        {color.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Feature Toggles */}
          <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={14} className="text-amber-200" />
              <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
                Feature Toggles
              </h2>
            </div>
            <p className="text-xs text-amber-100/40 mb-4">
              Add or remove features from the cloned template.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {featureToggles.map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => toggleFeature(feature.id)}
                  className={`flex items-center justify-between rounded-2xl border p-4 transition-all ${
                    feature.enabled
                      ? "border-emerald-400/20 bg-emerald-500/5"
                      : "border-white/5 bg-white/[0.02]"
                  }`}
                >
                  <span
                    className={`text-xs ${
                      feature.enabled
                        ? "text-amber-50 font-medium"
                        : "text-amber-100/30 line-through"
                    }`}
                  >
                    {feature.name}
                  </span>
                  {feature.enabled ? (
                    <ToggleRight size={20} className="text-emerald-400" />
                  ) : (
                    <ToggleLeft size={20} className="text-amber-100/20" />
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Before / After Preview */}
          <section className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-2xl">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-200" />
                <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-200/90 font-display">
                  Before / After Preview
                </h2>
              </div>
              {showPreview ? (
                <ChevronDown size={16} className="text-amber-200/60" />
              ) : (
                <ChevronRight size={16} className="text-amber-200/60" />
              )}
            </button>

            {showPreview && (
              <div className="mt-6 grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Original */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-amber-100/30 mb-3 text-center">
                    Original Template
                  </p>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-lg ${template.previewColor} flex items-center justify-center text-white text-xs font-bold`}
                      >
                        {template.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-amber-50">
                          {template.name} Template
                        </p>
                        <p className="text-[10px] text-amber-100/30">
                          Default configuration
                        </p>
                      </div>
                    </div>
                    <div className="h-px bg-white/5" />
                    <div className="space-y-2">
                      {template.terminology.map((t) => (
                        <div
                          key={t.original}
                          className="flex items-center gap-2 text-[10px]"
                        >
                          <span className="text-amber-100/30 w-24 shrink-0">
                            {t.label}:
                          </span>
                          <span className="text-amber-100/50 font-mono">
                            {t.original}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {template.features.map((f) => (
                        <span
                          key={f}
                          className="rounded-full border border-white/5 bg-white/5 px-2 py-0.5 text-[9px] text-amber-100/40"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Customized */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-amber-300 mb-3 text-center font-bold">
                    Your Version
                  </p>
                  <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.02] p-5 space-y-4 shadow-[0_0_20px_rgba(251,191,36,0.05)]">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-lg ${
                          COLOR_OPTIONS.find((c) => c.name === selectedColor)
                            ?.tw || "bg-amber-400"
                        } flex items-center justify-center text-white text-xs font-bold`}
                      >
                        {companyName
                          ? companyName[0]?.toUpperCase()
                          : template.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-amber-50">
                          {companyName || template.name}
                        </p>
                        <p className="text-[10px] text-amber-300/60">
                          {industry?.label || "Custom"} configuration
                        </p>
                      </div>
                    </div>
                    <div className="h-px bg-amber-300/10" />
                    <div className="space-y-2">
                      {termMappings.map((m) => (
                        <div
                          key={m.original}
                          className="flex items-center gap-2 text-[10px]"
                        >
                          <span className="text-amber-100/30 w-24 shrink-0">
                            {
                              template.terminology.find(
                                (t) => t.original === m.original
                              )?.label
                            }
                            :
                          </span>
                          <span
                            className={`font-mono ${
                              m.custom !== m.original
                                ? "text-amber-300 font-bold"
                                : "text-amber-100/50"
                            }`}
                          >
                            {m.custom}
                          </span>
                          {m.custom !== m.original && (
                            <span className="text-[8px] text-amber-400/50">
                              (was: {m.original})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {featureToggles
                        .filter((f) => f.enabled)
                        .map((f) => (
                          <span
                            key={f.id}
                            className="rounded-full border border-emerald-400/20 bg-emerald-500/5 px-2 py-0.5 text-[9px] text-emerald-400/70"
                          >
                            {f.name}
                          </span>
                        ))}
                      {featureToggles
                        .filter((f) => !f.enabled)
                        .map((f) => (
                          <span
                            key={f.id}
                            className="rounded-full border border-red-400/10 bg-red-400/5 px-2 py-0.5 text-[9px] text-red-400/40 line-through"
                          >
                            {f.name}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Create My Version Button */}
          <button className="w-full flex items-center justify-center gap-3 rounded-2xl bg-amber-400 py-4 text-sm font-bold text-black shadow-[0_0_30px_rgba(251,191,36,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Sparkles size={16} />
            Create My Version
          </button>

          {/* Attribution */}
          <p className="text-center text-[10px] text-amber-100/20">
            Clone powered by Engineer_Ang and Picker_Ang. Quality_Ang verifies
            all outputs through ORACLE gates.
          </p>
        </div>
      )}
    </div>
  );
}
