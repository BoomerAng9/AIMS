"use client";

import React from "react";
import { useParams } from "next/navigation";
import { LogoWallBackground } from "@/components/LogoWallBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Trophy, Users, FileText, BarChart3, Kanban,
  ArrowLeft, Sparkles, ChevronRight, Video,
  Target, TrendingUp, Star, Eye, Brain, Heart,
  Send, Loader2,
} from "lucide-react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────

interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  sport: string;
  position: string;
  age: number;
  height: string;
  weight: number;
  school: string;
  graduationYear: number;
  gpa: number;
  location: { city: string; state: string };
  scoutingGrade: number;
  recruitmentStatus: string;
  tags: string[];
}

interface PipelineStats {
  identified: number;
  scouted: number;
  shortlisted: number;
  offerPending: number;
  committed: number;
}

interface RecentReport {
  id: string;
  athleteId: string;
  athleteName: string;
  date: string;
  event: string;
  overallGrade: number;
}

interface ScoutingReport {
  id: string;
  athleteId: string;
  grades: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  projection: string;
  comparison: string;
  narrative: string;
}

// ─── Constants ───────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  prospect: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  contacted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  evaluating: "bg-gold/20 text-gold border-gold/30",
  shortlisted: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  "offer-pending": "bg-pink-500/20 text-pink-400 border-pink-500/30",
  offered: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  committed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  signed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const GRADE_ICONS: Record<string, React.ElementType> = {
  overall: Star,
  athleticism: TrendingUp,
  technique: Target,
  gameIQ: Brain,
  coachability: Heart,
  intangibles: Eye,
};

const PIPELINE_STAGES = [
  { key: "identified", label: "Identified", color: "bg-zinc-500" },
  { key: "scouted", label: "Scouted", color: "bg-cyan-500" },
  { key: "shortlisted", label: "Shortlisted", color: "bg-violet-500" },
  { key: "offerPending", label: "Offer Pending", color: "bg-gold" },
  { key: "committed", label: "Committed", color: "bg-emerald-500" },
];

type Tab = "dashboard" | "athletes" | "reports" | "pipeline" | "analytics";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "athletes", label: "Athletes", icon: Users },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "pipeline", label: "Pipeline", icon: Kanban },
  { key: "analytics", label: "Analytics", icon: TrendingUp },
];

// ─── Helpers ─────────────────────────────────────────────────

function gradeColor(grade: number): string {
  if (grade >= 85) return "text-emerald-400";
  if (grade >= 70) return "text-gold";
  if (grade >= 55) return "text-orange-400";
  return "text-red-400";
}

function gradeBg(grade: number): string {
  if (grade >= 85) return "bg-emerald-500";
  if (grade >= 70) return "bg-gold";
  if (grade >= 55) return "bg-orange-500";
  return "bg-red-500";
}

// ─── Main Page Component ─────────────────────────────────────

export default function PlugPage() {
  const params = useParams();
  const plugId = params.plugId as string;

  const [activeTab, setActiveTab] = React.useState<Tab>("dashboard");
  const [athletes, setAthletes] = React.useState<Athlete[]>([]);
  const [pipelineStats, setPipelineStats] = React.useState<PipelineStats | null>(null);
  const [recentReports, setRecentReports] = React.useState<RecentReport[]>([]);
  const [selectedAthlete, setSelectedAthlete] = React.useState<Athlete | null>(null);
  const [generatedReport, setGeneratedReport] = React.useState<ScoutingReport | null>(null);
  const [generating, setGenerating] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadPlugData() {
      try {
        const res = await fetch(`/api/plugs/${plugId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setAthletes(json.data.athletes || []);
            setPipelineStats(json.data.pipelineStats || null);
            setRecentReports(json.data.recentReports || []);
          }
        }
      } catch {
        // Plug data will remain empty
      } finally {
        setLoading(false);
      }
    }
    loadPlugData();
  }, [plugId]);

  async function generateReport(athlete: Athlete) {
    setSelectedAthlete(athlete);
    setGenerating(true);
    setGeneratedReport(null);
    try {
      const res = await fetch(`/api/plugs/${plugId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-report", athleteId: athlete.id }),
      });
      if (res.ok) {
        const json = await res.json();
        setGeneratedReport(json.report);
      }
    } catch {
      // Report generation failed silently
    } finally {
      setGenerating(false);
    }
  }

  // Non-perform plugs: show a placeholder
  if (plugId !== "perform") {
    return (
      <LogoWallBackground mode="dashboard">
        <SiteHeader />
        <main className="flex-1 container max-w-4xl py-16 px-4 text-center">
          <Card className="p-12">
            <Trophy className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
            <h1 className="text-2xl font-display text-white mb-2">Plug Not Available</h1>
            <p className="text-zinc-400 mb-6">
              This plug is currently in development. Check back soon.
            </p>
            <Link href="/plugs">
              <Button variant="glass">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Catalog
              </Button>
            </Link>
          </Card>
        </main>
      </LogoWallBackground>
    );
  }

  return (
    <LogoWallBackground mode="dashboard">
      <SiteHeader />

      <main className="flex-1 container max-w-7xl py-6 px-4 md:px-6">
        {/* Plug Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/plugs">
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="p-2.5 rounded-xl bg-gold/10 border border-gold/20">
              <Trophy className="h-7 w-7 text-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-display text-white tracking-wide">Perform</h1>
              <p className="text-zinc-500 text-sm">Sports Analytics &middot; Scouting Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] bg-emerald-950/30 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Plug Active
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 overflow-x-auto border-b border-white/5 pb-px">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm transition-all rounded-t-lg",
                activeTab === tab.key
                  ? "bg-white/5 text-gold border-b-2 border-gold"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-gold animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Dashboard Tab ── */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                {/* Pipeline Funnel */}
                {pipelineStats && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Kanban className="h-4 w-4 text-gold" /> Recruitment Pipeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        {PIPELINE_STAGES.map((stage) => {
                          const count = pipelineStats[stage.key as keyof PipelineStats];
                          const total = Object.values(pipelineStats).reduce((a, b) => a + b, 0);
                          const pct = total > 0 ? (count / total) * 100 : 0;
                          return (
                            <div key={stage.key} className="flex-1 text-center">
                              <div className="text-2xl font-display text-white mb-1">{count}</div>
                              <div className="text-[9px] uppercase tracking-wider text-zinc-500 mb-2">{stage.label}</div>
                              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <div className={`h-full ${stage.color} rounded-full`} style={{ width: `${Math.max(pct, 8)}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Top Prospects + Recent Reports */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Top Prospects */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Star className="h-4 w-4 text-gold" /> Top Prospects
                      </CardTitle>
                      <CardDescription>Highest scouting grades</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[...athletes]
                        .sort((a, b) => b.scoutingGrade - a.scoutingGrade)
                        .slice(0, 4)
                        .map((ath, i) => (
                          <div
                            key={ath.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedAthlete(ath);
                              setActiveTab("athletes");
                            }}
                          >
                            <span className="text-xs text-zinc-600 w-4 font-display">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">
                                {ath.firstName} {ath.lastName}
                              </p>
                              <p className="text-[10px] text-zinc-500">
                                {ath.position} &middot; {ath.school}
                              </p>
                            </div>
                            <span className={cn("text-lg font-display font-bold", gradeColor(ath.scoutingGrade))}>
                              {ath.scoutingGrade}
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
                          </div>
                        ))}
                    </CardContent>
                  </Card>

                  {/* Recent Reports */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gold" /> Recent Reports
                      </CardTitle>
                      <CardDescription>Latest scouting evaluations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {recentReports.map((rpt) => (
                        <div
                          key={rpt.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center font-display text-sm font-bold", gradeBg(rpt.overallGrade), "text-black")}>
                            {rpt.overallGrade}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{rpt.athleteName}</p>
                            <p className="text-[10px] text-zinc-500 capitalize">
                              {rpt.event} &middot; {rpt.date}
                            </p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                  {[
                    { label: "Total Athletes", value: athletes.length, color: "text-white" },
                    { label: "Avg Grade", value: athletes.length > 0 ? Math.round(athletes.reduce((s, a) => s + a.scoutingGrade, 0) / athletes.length) : 0, color: "text-gold" },
                    { label: "Reports Filed", value: recentReports.length, color: "text-cyan-400" },
                    { label: "Active Scouts", value: 3, color: "text-emerald-400" },
                  ].map((stat) => (
                    <Card key={stat.label} className="text-center p-4">
                      <div className={cn("text-3xl font-display font-bold mb-1", stat.color)}>{stat.value}</div>
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{stat.label}</div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ── Athletes Tab ── */}
            {activeTab === "athletes" && (
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Athlete List */}
                <div className="lg:col-span-2 space-y-3">
                  {athletes.map((ath) => (
                    <Card
                      key={ath.id}
                      className={cn(
                        "cursor-pointer transition-all hover:bg-white/5",
                        selectedAthlete?.id === ath.id && "border-gold/30 bg-gold/5"
                      )}
                      onClick={() => {
                        setSelectedAthlete(ath);
                        setGeneratedReport(null);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Grade Circle */}
                          <div className={cn(
                            "h-14 w-14 rounded-xl flex items-center justify-center font-display text-xl font-bold border",
                            ath.scoutingGrade >= 85
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : ath.scoutingGrade >= 70
                                ? "bg-gold/10 border-gold/30 text-gold"
                                : "bg-orange-500/10 border-orange-500/30 text-orange-400"
                          )}>
                            {ath.scoutingGrade}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-base text-white font-medium">
                                {ath.firstName} {ath.lastName}
                              </p>
                              <span className={cn("text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border", STATUS_COLORS[ath.recruitmentStatus] || "bg-zinc-500/20 text-zinc-400 border-zinc-500/30")}>
                                {ath.recruitmentStatus}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-400">
                              {ath.position} &middot; {ath.sport} &middot; {ath.school}
                            </p>
                            <div className="flex gap-1.5 mt-2">
                              {ath.tags.map((tag) => (
                                <span key={tag} className="text-[9px] bg-white/5 text-zinc-500 rounded px-1.5 py-0.5">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Measurables */}
                          <div className="hidden md:flex gap-4 text-center">
                            <div>
                              <div className="text-sm font-display text-white">{ath.height}</div>
                              <div className="text-[9px] text-zinc-600 uppercase">Height</div>
                            </div>
                            <div>
                              <div className="text-sm font-display text-white">{ath.weight}</div>
                              <div className="text-[9px] text-zinc-600 uppercase">Weight</div>
                            </div>
                            <div>
                              <div className="text-sm font-display text-white">{ath.gpa}</div>
                              <div className="text-[9px] text-zinc-600 uppercase">GPA</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Athlete Detail / Report Panel */}
                <div className="space-y-4">
                  {selectedAthlete ? (
                    <>
                      <Card className="border-gold/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">
                            {selectedAthlete.firstName} {selectedAthlete.lastName}
                          </CardTitle>
                          <CardDescription>
                            {selectedAthlete.location.city}, {selectedAthlete.location.state} &middot; Class of {selectedAthlete.graduationYear}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-white/5 rounded-lg p-2">
                              <div className="text-lg font-display text-white">{selectedAthlete.age}</div>
                              <div className="text-[9px] text-zinc-500 uppercase">Age</div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-2">
                              <div className="text-lg font-display text-white">{selectedAthlete.height}</div>
                              <div className="text-[9px] text-zinc-500 uppercase">Height</div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-2">
                              <div className="text-lg font-display text-white">{selectedAthlete.weight}</div>
                              <div className="text-[9px] text-zinc-500 uppercase">lbs</div>
                            </div>
                          </div>

                          <Button
                            variant="acheevy"
                            size="sm"
                            className="w-full"
                            onClick={() => generateReport(selectedAthlete)}
                            disabled={generating}
                          >
                            {generating ? (
                              <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Generating...</>
                            ) : (
                              <><Sparkles className="h-3.5 w-3.5 mr-2" /> Generate Scouting Report</>
                            )}
                          </Button>

                          <div className="flex gap-2">
                            <Button variant="glass" size="sm" className="flex-1 text-xs">
                              <Video className="h-3 w-3 mr-1" /> Film
                            </Button>
                            <Button variant="glass" size="sm" className="flex-1 text-xs">
                              <Send className="h-3 w-3 mr-1" /> Contact
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Generated Report */}
                      {generatedReport && (
                        <Card className="border-emerald-500/20 bg-emerald-500/5">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-emerald-400" /> AI Scouting Report
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Grade Breakdown */}
                            <div className="space-y-2">
                              {Object.entries(generatedReport.grades).map(([key, val]) => {
                                const Icon = GRADE_ICONS[key] || Star;
                                return (
                                  <div key={key} className="flex items-center gap-2">
                                    <Icon className="h-3.5 w-3.5 text-zinc-500" />
                                    <span className="text-xs text-zinc-400 capitalize w-20">{key}</span>
                                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                      <div className={cn("h-full rounded-full", gradeBg(val))} style={{ width: `${val}%` }} />
                                    </div>
                                    <span className={cn("text-sm font-display font-bold w-8 text-right", gradeColor(val))}>
                                      {val}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Projection */}
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="text-[9px] uppercase tracking-wider text-zinc-500 mb-1">Projection</div>
                              <div className="text-sm text-white capitalize font-display">{generatedReport.projection}</div>
                            </div>

                            {/* Strengths / Weaknesses */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <div className="text-[9px] uppercase tracking-wider text-emerald-400 mb-1.5">Strengths</div>
                                {generatedReport.strengths.map((s) => (
                                  <p key={s} className="text-xs text-zinc-300 mb-1">+ {s}</p>
                                ))}
                              </div>
                              <div>
                                <div className="text-[9px] uppercase tracking-wider text-red-400 mb-1.5">Areas to Develop</div>
                                {generatedReport.weaknesses.map((w) => (
                                  <p key={w} className="text-xs text-zinc-300 mb-1">- {w}</p>
                                ))}
                              </div>
                            </div>

                            {/* Narrative */}
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="text-[9px] uppercase tracking-wider text-zinc-500 mb-1.5">Narrative</div>
                              <p className="text-xs text-zinc-300 leading-relaxed">{generatedReport.narrative}</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  ) : (
                    <Card className="p-8 text-center">
                      <Users className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                      <p className="text-sm text-zinc-500">Select an athlete to view details</p>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* ── Reports Tab ── */}
            {activeTab === "reports" && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Scouting Reports</CardTitle>
                    <CardDescription>AI-generated evaluations from film review and live events</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentReports.map((rpt) => (
                        <div key={rpt.id} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                          <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center font-display text-sm font-bold", gradeBg(rpt.overallGrade), "text-black")}>
                            {rpt.overallGrade}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-white">{rpt.athleteName}</p>
                            <p className="text-xs text-zinc-500 capitalize">{rpt.event} evaluation &middot; {rpt.date}</p>
                          </div>
                          <Button variant="glass" size="sm" className="text-xs">
                            View Full Report
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── Pipeline Tab ── */}
            {activeTab === "pipeline" && pipelineStats && (
              <div className="space-y-6">
                {/* Kanban Board */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
                  {PIPELINE_STAGES.map((stage) => {
                    const count = pipelineStats[stage.key as keyof PipelineStats];
                    const stageAthletes = athletes.filter((a) => {
                      const statusMap: Record<string, string[]> = {
                        identified: ["prospect"],
                        scouted: ["contacted"],
                        shortlisted: ["shortlisted", "evaluating"],
                        offerPending: ["offer-pending", "offered"],
                        committed: ["committed", "signed"],
                      };
                      return statusMap[stage.key]?.includes(a.recruitmentStatus);
                    });

                    return (
                      <div key={stage.key}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className={cn("h-2 w-2 rounded-full", stage.color)} />
                          <span className="text-xs uppercase tracking-wider text-zinc-400">{stage.label}</span>
                          <span className="text-xs font-display text-zinc-600">{count}</span>
                        </div>
                        <div className="space-y-2">
                          {stageAthletes.map((ath) => (
                            <Card key={ath.id} className="p-3 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => { setSelectedAthlete(ath); setActiveTab("athletes"); }}>
                              <p className="text-sm text-white truncate">{ath.firstName} {ath.lastName}</p>
                              <p className="text-[10px] text-zinc-500">{ath.position}</p>
                              <div className={cn("text-sm font-display font-bold mt-1", gradeColor(ath.scoutingGrade))}>
                                {ath.scoutingGrade}
                              </div>
                            </Card>
                          ))}
                          {stageAthletes.length === 0 && (
                            <div className="border border-dashed border-white/10 rounded-xl p-4 text-center">
                              <p className="text-[10px] text-zinc-600">No athletes</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Analytics Tab ── */}
            {activeTab === "analytics" && (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Grade Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Grade Distribution</CardTitle>
                    <CardDescription>Scouting grade breakdown across all athletes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { range: "85-100 (Elite)", count: athletes.filter((a) => a.scoutingGrade >= 85).length, color: "bg-emerald-500" },
                        { range: "70-84 (Starter)", count: athletes.filter((a) => a.scoutingGrade >= 70 && a.scoutingGrade < 85).length, color: "bg-gold" },
                        { range: "55-69 (Rotational)", count: athletes.filter((a) => a.scoutingGrade >= 55 && a.scoutingGrade < 70).length, color: "bg-orange-500" },
                        { range: "0-54 (Developmental)", count: athletes.filter((a) => a.scoutingGrade < 55).length, color: "bg-red-500" },
                      ].map((bucket) => (
                        <div key={bucket.range} className="flex items-center gap-3">
                          <span className="text-xs text-zinc-400 w-36">{bucket.range}</span>
                          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full", bucket.color)}
                              style={{ width: `${athletes.length > 0 ? (bucket.count / athletes.length) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-display text-white w-6 text-right">{bucket.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Sport Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">By Sport</CardTitle>
                    <CardDescription>Athletes across tracked sports</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(
                        athletes.reduce<Record<string, number>>((acc, a) => {
                          acc[a.sport] = (acc[a.sport] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([sport, count]) => (
                        <div key={sport} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                          <span className="text-sm text-white capitalize">{sport}</span>
                          <span className="text-sm font-display text-gold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Positional Needs */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Recruitment Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-2xl font-display text-emerald-400 font-bold">
                          {athletes.length > 0 ? Math.round(athletes.reduce((s, a) => s + a.scoutingGrade, 0) / athletes.length) : 0}
                        </div>
                        <div className="text-[10px] text-zinc-500 uppercase mt-1">Avg Scout Grade</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-2xl font-display text-gold font-bold">
                          {athletes.length > 0 ? Math.max(...athletes.map((a) => a.scoutingGrade)) : 0}
                        </div>
                        <div className="text-[10px] text-zinc-500 uppercase mt-1">Highest Grade</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-2xl font-display text-cyan-400 font-bold">
                          {athletes.filter((a) => a.gpa >= 3.5).length}
                        </div>
                        <div className="text-[10px] text-zinc-500 uppercase mt-1">Academic Qualifiers</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-2xl font-display text-violet-400 font-bold">
                          {new Set(athletes.map((a) => a.location.state)).size}
                        </div>
                        <div className="text-[10px] text-zinc-500 uppercase mt-1">States Covered</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </main>
    </LogoWallBackground>
  );
}
