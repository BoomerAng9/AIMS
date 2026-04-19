/**
 * Remotion root registration. Loaded by the Remotion bundler; exposes
 * the `NightPortComposite` composition so the renderer can select it
 * by id and pass inputProps from the /compose endpoint.
 */

import React from 'react';
import { Composition, registerRoot } from 'remotion';
import {
  NightPortComposite,
  type NightPortCompositeProps,
} from './scenes/NightPortComposite';

const DEFAULT_PROPS: NightPortCompositeProps = {
  environmentVideoUrl: '',
  characterVideoUrl: '',
  fps: 24,
  durationInFrames: 144, // 6s @ 24fps
  characterStartFrame: 0,
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="night-port-composite"
      component={NightPortComposite}
      durationInFrames={144}
      fps={24}
      width={1920}
      height={1080}
      defaultProps={DEFAULT_PROPS}
    />
  );
};

registerRoot(RemotionRoot);
