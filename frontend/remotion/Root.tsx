import { Composition, registerRoot } from "remotion";
import React from "react";
import { AIMSIntro } from "./compositions/AIMSIntro";
import { FeatureShowcase } from "./compositions/FeatureShowcase";
import { DeploymentAnimation } from "./compositions/DeploymentAnimation";
import { PortTransition } from "./compositions/PortTransition";
import { AcheevyCharacter } from "./compositions/AcheevyCharacter";

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
    </>
  );
};


// Register the root component - THIS IS REQUIRED for Remotion Studio
registerRoot(RemotionRoot);
