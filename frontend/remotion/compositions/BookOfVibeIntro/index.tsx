import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

import { NilVoid } from "./scenes/NilVoid";
import { FirstFrequency } from "./scenes/FirstFrequency";
import { ElderAwakens } from "./scenes/ElderAwakens";
import { AcheevyRises } from "./scenes/AcheevyRises";
import { TitleCard } from "./scenes/TitleCard";
import { SCENE_TIMING } from "./constants";

import type { BookOfVibeIntroProps } from "./schema";

/**
 * Book of V.I.B.E. — Intro
 *
 * 5-scene origin story:
 *   The Void → First Frequency → The Elder → ACHEEVY → Title Card
 *
 * Uses TransitionSeries with fade transitions between each scene.
 */
export const BookOfVibeIntro: React.FC<BookOfVibeIntroProps> = ({
  subtitle,
  showDoctrine,
}) => {
  const { fps } = useVideoConfig();
  const overlap = Math.round(SCENE_TIMING.transitionOverlap * fps);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <TransitionSeries>
        {/* Scene 1: The Void — Before Creation */}
        <TransitionSeries.Sequence
          durationInFrames={Math.round(SCENE_TIMING.theVoid * fps)}
        >
          <NilVoid />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: overlap })}
        />

        {/* Scene 2: The First Frequency */}
        <TransitionSeries.Sequence
          durationInFrames={Math.round(SCENE_TIMING.frequency * fps)}
        >
          <FirstFrequency />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: overlap })}
        />

        {/* Scene 3: The Elder Awakens */}
        <TransitionSeries.Sequence
          durationInFrames={Math.round(SCENE_TIMING.elder * fps)}
        >
          <ElderAwakens />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: overlap })}
        />

        {/* Scene 4: ACHEEVY Rises */}
        <TransitionSeries.Sequence
          durationInFrames={Math.round(SCENE_TIMING.acheevy * fps)}
        >
          <AcheevyRises />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: overlap })}
        />

        {/* Scene 5: Title Card */}
        <TransitionSeries.Sequence
          durationInFrames={Math.round(SCENE_TIMING.title * fps)}
        >
          <TitleCard subtitle={subtitle} showDoctrine={showDoctrine} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
