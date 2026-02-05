import type {ReactNode} from 'react';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  caption: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Workflow autonomy',
    caption: 'Plan • Act • Reflect',
    description: (
      <>
        II-Agent decomposes prompts into multi-step plans, maintains scratchpads, and pauses for
        review whenever human approvals are required.
      </>
    ),
  },
  {
    title: 'Secure toolchain',
    caption: 'Every tool is auditable',
    description: (
      <>
        MCP, sandboxed shells, HTTP actions, and structured tool server calls come pre-wired so you
        can ship new abilities with minimal boilerplate.
      </>
    ),
  },
  {
    title: 'Proof-of-Benefit ready',
    caption: 'Evidence on every run',
    description: (
      <>
        Telemetry hooks capture artifacts, metrics, and receipts so contributions are eligible for
        Foundation Coin minting.
      </>
    ),
  },
];

function Feature({title, caption, description}: FeatureItem) {
  return (
    <div className={styles.featureCard}>
      <p className={styles.caption}>{caption}</p>
      <Heading as="h3">{title}</Heading>
      <p>{description}</p>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.featureGrid}>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
