import { Composition, Folder, registerRoot } from "remotion";
import React from "react";

// Legacy compositions (kept as-is)
import { AIMSIntro } from "./compositions/AIMSIntro";
import { FeatureShowcase } from "./compositions/FeatureShowcase";
import { DeploymentAnimation } from "./compositions/DeploymentAnimation";
import { PortTransition } from "./compositions/PortTransition";
import { AcheevyCharacter } from "./compositions/AcheevyCharacter";
import { PlugMeIn } from "./compositions/PlugMeIn";
import { WelcomeVideo } from "./compositions/WelcomeVideo";

// Book of V.I.B.E. compositions (v4 pattern: Zod schema + Folder)
import { BookOfVibeIntro } from "./compositions/BookOfVibeIntro";
import { bookOfVibeIntroSchema } from "./compositions/BookOfVibeIntro/schema";
import { TOTAL_DURATION_SECONDS } from "./compositions/BookOfVibeIntro/constants";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ── Book of V.I.B.E. ──────────────────────────────── */}
      <Folder name="BookOfVIBE">
        <Composition
          id="BookOfVibeIntro-Landscape"
          component={BookOfVibeIntro}
          schema={bookOfVibeIntroSchema}
          defaultProps={{
            subtitle: "Visionary Intelligence Building Everything",
            showDoctrine: true,
          }}
          fps={30}
          width={1920}
          height={1080}
          durationInFrames={Math.round(TOTAL_DURATION_SECONDS * 30)}
        />
        <Composition
          id="BookOfVibeIntro-Portrait"
          component={BookOfVibeIntro}
          schema={bookOfVibeIntroSchema}
          defaultProps={{
            subtitle: "Visionary Intelligence Building Everything",
            showDoctrine: true,
          }}
          fps={30}
          width={1080}
          height={1920}
          durationInFrames={Math.round(TOTAL_DURATION_SECONDS * 30)}
        />
      </Folder>

      {/* ── Legacy compositions ───────────────────────────── */}
      <Folder name="AIMSPlatform">
        <Composition
          id="AIMSIntro"
          component={AIMSIntro as any}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            title: "A.I.M.S.",
            subtitle: "AI Managed Systems"
          }}
        />
        <Composition
          id="FeatureShowcase"
          component={FeatureShowcase as any}
          durationInFrames={300}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            features: [
              {
                icon: "zap",
                title: "Automation & Workflows",
                description: "Complex business logic automated behind the scenes"
              },
              {
                icon: "box",
                title: "Containerized Tools",
                description: "Industry-standard open source in managed Docker containers"
              },
              {
                icon: "network",
                title: "AI Orchestrator",
                description: "ACHEEVY routes your requests to the best agents"
              }
            ]
          }}
        />
        <Composition
          id="Deployment"
          component={DeploymentAnimation as any}
          durationInFrames={240}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            appName: "n8n-automation",
            steps: [
              "Building Docker image...",
              "Pushing to container registry...",
              "Configuring environment variables...",
              "Starting container on VPS...",
              "Running health checks...",
              "Updating DNS records..."
            ]
          }}
        />
        <Composition
          id="PortTransition"
          component={PortTransition}
          durationInFrames={300}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="AcheevyCharacter"
          component={AcheevyCharacter as any}
          durationInFrames={180}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            variant: "talking",
            message: "Let's build something great together."
          }}
        />
        <Composition
          id="PlugMeIn"
          component={PlugMeIn}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="WelcomeVideo"
          component={WelcomeVideo}
          durationInFrames={180}
          fps={30}
          width={800}
          height={1080}
        />
      </Folder>
    </>
  );
};


// Register the root component - THIS IS REQUIRED for Remotion Studio
registerRoot(RemotionRoot);
