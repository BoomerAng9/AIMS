import { NextResponse } from "next/server";
import { findSkillById, SKILL_REGISTRY, getSkillsByType } from "@/lib/skills/registry";

// ─── GET /api/skills/:skillId ────────────────────────────────
// Returns the skill definition. Use "catalog" for all skills.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ skillId: string }> }
) {
  const { skillId } = await params;

  if (skillId === "catalog") {
    return NextResponse.json({
      hooks: getSkillsByType("hook"),
      tasks: getSkillsByType("task"),
      skills: getSkillsByType("skill"),
      total: SKILL_REGISTRY.length,
    });
  }

  const skill = findSkillById(skillId);
  if (!skill) {
    return NextResponse.json(
      { error: `Skill "${skillId}" not found in registry.` },
      { status: 404 }
    );
  }

  return NextResponse.json({ skill });
}

// ─── POST /api/skills/:skillId ───────────────────────────────
// Executes skill-specific actions.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ skillId: string }> }
) {
  const { skillId } = await params;
  const skill = findSkillById(skillId);

  if (!skill) {
    return NextResponse.json(
      { error: `Skill "${skillId}" not found in registry.` },
      { status: 404 }
    );
  }

  if (skill.status !== "active") {
    return NextResponse.json(
      { error: `Skill "${skill.name}" is not active (status: ${skill.status}).` },
      { status: 403 }
    );
  }

  const body = await request.json();

  // ── Remotion Task ──
  if (skillId === "remotion") {
    const { composition, action } = body;
    const availableCompositions = ["AIMSIntro", "FeatureShowcase", "DeploymentAnimation"];

    if (action === "list") {
      return NextResponse.json({
        compositions: availableCompositions,
        studioUrl: "http://localhost:3001",
        renderCommand: "npm run remotion:render",
      });
    }

    if (action === "render" && composition) {
      if (!availableCompositions.includes(composition)) {
        return NextResponse.json(
          { error: `Composition "${composition}" not found. Available: ${availableCompositions.join(", ")}` },
          { status: 404 }
        );
      }
      return NextResponse.json({
        message: `Render queued for composition "${composition}".`,
        command: `npx remotion render src/remotion/Root.tsx ${composition} out/${composition}.mp4`,
        status: "queued",
      });
    }

    return NextResponse.json({
      message: "Remotion skill activated.",
      availableCompositions,
      actions: ["list", "render"],
    });
  }

  // ── Gemini Research Task ──
  if (skillId === "gemini-research") {
    // Proxy to the existing /api/research endpoint
    return NextResponse.json({
      message: "Gemini Deep Research activated. Use POST /api/research with { prompt } for execution.",
      proxyTo: "/api/research",
      skill,
    });
  }

  // ── n8n Workflow Task ──
  if (skillId === "n8n-workflow") {
    const { action, template } = body;
    const availableTemplates = ["recruiter", "marketer"];

    if (action === "list") {
      return NextResponse.json({ templates: availableTemplates });
    }

    if (action === "deploy" && template) {
      if (!availableTemplates.includes(template)) {
        return NextResponse.json(
          { error: `Template "${template}" not found. Available: ${availableTemplates.join(", ")}` },
          { status: 404 }
        );
      }
      return NextResponse.json({
        message: `Boomer_Ang "${template}" deployment queued.`,
        command: `node scripts/boomer.mjs create-action ${template}`,
        status: "queued",
      });
    }

    return NextResponse.json({
      message: "n8n Workflow skill activated.",
      templates: availableTemplates,
      actions: ["list", "deploy", "check"],
      cliUsage: "node scripts/boomer.mjs <command> [template]",
    });
  }

  // ── Best Practices Skill ──
  if (skillId === "best-practices") {
    const { templateType } = body;
    const templates: Record<string, object> = {
      prd: {
        type: "PRD",
        template: {
          title: "PRD: [Feature Name]",
          sections: [
            "Problem Statement",
            "Target User (1000 people framework)",
            "Requirements (P0/P1/P2)",
            "Success Metrics (KPIs)",
            "Technical Approach",
            "ORACLE Gate Alignment",
          ],
        },
      },
      sop: {
        type: "SOP",
        template: {
          title: "SOP: [Process Name]",
          sections: [
            "Purpose",
            "Scope",
            "Steps (Input → Action → Output)",
            "Quality Gates (ORACLE aligned)",
            "Escalation",
          ],
        },
      },
      kpi: {
        type: "KPI Dashboard",
        template: {
          metrics: [
            { name: "Deploy Time (p50)", target: "< 5 min", source: "UEF Gateway" },
            { name: "Activation Rate", target: "> 80%", source: "First plug run in 10 min" },
            { name: "7-Day Retention", target: "> 60%", source: "Firestore activity" },
            { name: "Revenue Per Workspace", target: "$29/mo", source: "Stripe" },
            { name: "Cost Per Run", target: "< $0.05", source: "LUC Engine" },
          ],
        },
      },
      okr: {
        type: "OKR Framework",
        template: {
          format: "Objective → Key Result 1 (baseline → target) → Key Result 2 → Key Result 3",
          example: {
            objective: "Launch Perform Plug to 100 active scouts",
            keyResults: [
              "KR1: 50 athlete profiles created (0 → 50)",
              "KR2: 20 AI scouting reports generated (0 → 20)",
              "KR3: 5 recruitment pipelines active (0 → 5)",
            ],
          },
        },
      },
    };

    if (templateType && templates[templateType]) {
      return NextResponse.json({
        message: `${templateType.toUpperCase()} template generated.`,
        ...templates[templateType],
      });
    }

    return NextResponse.json({
      message: "Best Practices skill activated.",
      availableTemplates: Object.keys(templates),
      templates,
    });
  }

  // ── Docker Compose Hook ──
  if (skillId === "docker-compose") {
    return NextResponse.json({
      message: "Docker Compose hook activated.",
      services: ["frontend", "uef-gateway", "postgres", "agent-zero (stubbed)", "chicken-hawk (stubbed)"],
      commands: {
        up: "docker compose -f infra/docker-compose.yml up -d",
        down: "docker compose -f infra/docker-compose.yml down",
        logs: "docker compose -f infra/docker-compose.yml logs -f",
        rebuild: "docker compose -f infra/docker-compose.yml up -d --build",
      },
    });
  }

  // ── GitHub Ops Hook ──
  if (skillId === "github-ops") {
    return NextResponse.json({
      message: "GitHub Operations hook activated.",
      branchConvention: "feat/ | fix/ | chore/ | docs/ | refactor/",
      prTemplate: "See aims-skills/hooks/github-ops.md for full PR template",
      oracleChecklist: [
        "Gate 1: Technical (build passes)",
        "Gate 2: Security (no secrets)",
        "Gate 3: Strategy (aligned with intent)",
        "Gate 4: Judge (cost acceptable)",
        "Gate 5: Perception (no hallucinations)",
        "Gate 6: Effort (minimal diff)",
        "Gate 7: Documentation (updated if needed)",
      ],
    });
  }

  // ── Persona Skills (stitch, nano-banana-pro) ──
  if (skillId === "stitch" || skillId === "nano-banana-pro") {
    return NextResponse.json({
      message: `Skill "${skill.name}" activated. This is a persona-injection skill.`,
      description: skill.description,
      definitionFile: skill.definitionFile,
      instruction: `Load the definition file at ${skill.definitionFile} for the full persona context.`,
    });
  }

  // ── Generic fallback ──
  return NextResponse.json({
    message: `Skill "${skill.name}" acknowledged.`,
    skill,
    body,
  });
}
