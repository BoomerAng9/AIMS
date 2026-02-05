import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

const capabilityRows = [
  {
    domain: 'Research & Fact-Checking',
    description: 'Multistep web search, source triangulation, structured note-taking, rapid summarization',
  },
  {
    domain: 'Content Generation',
    description: 'Blog & article drafts, lesson plans, creative prose, technical manuals, Website creations',
  },
  {
    domain: 'Data Analysis & Visualization',
    description: 'Cleaning, statistics, trend detection, charting, and automated report generation',
  },
  {
    domain: 'Software Development',
    description: 'Code synthesis, refactoring, debugging, test-writing, and step-by-step tutorials across multiple languages',
  },
  {
    domain: 'Workflow Automation',
    description: 'Script generation, browser automation, file management, process optimization',
  },
  {
    domain: 'Problem Solving',
    description: 'Decomposition, alternative-path exploration, stepwise guidance, troubleshooting',
  },
];

const methodSections = [
  {
    title: 'Core Agent Architecture and LLM Interaction',
    items: [
      'System prompting with dynamically tailored context',
      'Comprehensive interaction history management',
      'Intelligent context management to handle token limitations',
      'Systematic LLM invocation and capability selection',
      'Iterative refinement through execution cycles',
    ],
  },
  {
    title: 'Planning and Reflection',
    items: [
      'Structured reasoning for complex problem-solving',
      'Problem decomposition and sequential thinking',
      'Transparent decision-making process',
      'Hypothesis formation and testing',
    ],
  },
  {
    title: 'Execution Capabilities',
    items: [
      'File system operations with intelligent code editing',
      'Command line execution in a secure environment',
      'Advanced web interaction and browser automation',
      'Task finalization and reporting',
      'Specialized capabilities for various modalities (Experimental) (PDF, audio, image, video, slides)',
      'Deep research integration',
    ],
  },
  {
    title: 'Context Management',
    items: [
      'Token usage estimation and optimization',
      'Strategic truncation for lengthy interactions',
      'File-based archival for large outputs',
    ],
  },
  {
    title: 'Real-time Communication',
    items: [
      'WebSocket-based interface for interactive use',
      'Isolated agent instances per client',
      'Streaming operational events for responsive UX',
    ],
  },
];

function HomepageHeader() {
  return (
    <header className={styles.heroBanner}>
      <div className={clsx('container', styles.heroGrid)}>
        <div className={styles.heroContent}>
          <p className={styles.kicker}>II-Agent • Core Capabilities</p>
          <Heading as="h1" className={styles.heroTitle}>
            Introduce your stack to a sovereign assistant you control.
          </Heading>
          <p className={styles.heroSubtitle}>
            II-Agent is a versatile open-source assistant built to elevate your productivity across
            domains. Pair it with your infrastructure and it becomes the autonomous co-pilot for
            research, writing, automation, and software delivery.
          </p>
          <div className={styles.ctaRow}>
            <Link className="button button--primary button--lg" to="/docs/getting-started">
              Explore Getting Started
            </Link>
            <Link className="button button--secondary button--lg" to="/docs/required-environment-variables">
              Review requirements
            </Link>
          </div>
        </div>
        <div className={styles.heroCard}>
          <p className={styles.cardTitle}>Domain Coverage</p>
          <p className={styles.cardBody}>What II-Agent can do across the most common workloads.</p>
          <div className={styles.capabilityTable} role="table">
            {capabilityRows.map(({domain, description}) => (
              <div className={styles.capabilityRow} role="row" key={domain}>
                <span role="cell">{domain}</span>
                <p role="cell">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

function MethodsSection() {
  return (
    <section className={styles.methodsSection}>
      <div className="container">
        <div className={styles.methodsIntro}>
          <Heading as="h2">Methods</Heading>
          <p>
            The II-Agent system represents a sophisticated approach to building versatile AI agents.
            Our methodology centers on the following pillars:
          </p>
        </div>
        <div className={styles.methodGrid}>
          {methodSections.map(({title, items}) => (
            <article key={title} className={styles.methodCard}>
              <h3>{title}</h3>
              <ul>
                {items.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Intelligent Internet documentation for agents, datasets, models, and systems.">
      <HomepageHeader />
      <main>
        <MethodsSection />
      </main>
    </Layout>
  );
}
