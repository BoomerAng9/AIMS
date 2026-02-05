---
id: installation
title: Installation
sidebar_label: Installation
sidebar_position: 3
description: Install dependencies, run the docs locally, and prepare contributions for Proof-of-Benefit review.
---

# Installation

Run the docs locally to preview the Intelligent Internet theme or to iterate on content before proposing a Proof-of-Benefit contribution. The repository already contains the Docusaurus project under `/docs`.

## Requirements

- **Node.js 20+** – matches the version used in CI and avoids ESM incompatibilities.
- **npm 9+** – ships with Node 20. Feel free to use `pnpm` or `yarn` if your workflow requires it, but keep lockfiles in sync.
- **Git + access to `intelligent-internet/ii-agent-prod`.**

Confirm versions:

```bash
node --version
npm --version
```

## 1. Install dependencies

```bash
cd docs
npm install
```

This installs Docusaurus, the classic preset, and all plugins used by the docs and setup sections.

## 2. Run the development server

```bash
npm run start
```

- Opens `http://localhost:3000/web`.
- Reflects file changes instantly via hot reloading.
- Mirrors the public [ii.inc/web](https://ii.inc/web) theme so you can validate the experience without leaving your terminal.

> [!TIP]
> If your browser opens `http://localhost:3000/` by default, append `/web` to reach the docs.

## 3. Build for production

```bash
npm run build
```

This generates static assets in `docs/build`. Run `npm run serve` to preview the production bundle locally.

## 4. Prepare your contribution

1. Update or add docs/content.
2. Run `npm run build` to ensure no type or markdown errors slip into CI.
3. Commit changes and open a PR. Reference Proof-of-Benefit evidence (issue, dataset, release) so reviewers can trace the value you delivered.

Need full-stack installation instructions (Postgres, storage, backend services)? Jump to the [Setup](/setup/stack-env) section which contains step-by-step guides for every environment.
