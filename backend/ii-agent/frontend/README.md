# II Agent Frontend

A modern desktop application built with [Tauri](https://tauri.app), [React](https://reactjs.org), [TypeScript](https://typescriptlang.org) and [Tailwind CSS](https://tailwindcss.com) (with [shadcn/ui](https://ui.shadcn.com/)).

## Overview

II Agent is an AI-powered assistant that helps with various tasks through an intuitive desktop interface. The frontend provides a seamless user experience for interacting with the agent, managing sessions, and viewing results.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) package manager
- [Rust](https://www.rust-lang.org/) (for Tauri)
- Platform-specific dependencies as outlined in the [Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)

## Getting Started

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Start the development server
pnpm tauri dev

# Run development server only (without Tauri)
pnpm dev
```

### Building

```bash
# Build for production
pnpm tauri build

# Build web assets only
pnpm build
```

## Project Structure

```
src/
├── app/              # Application layer
│   ├── routes/       # Route components
│   └── components/   # App-specific components
├── assets/           # Static assets (images, fonts, etc.)
├── components/       # Shared UI components
│   ├── ui/          # Base UI components (shadcn/ui)
│   ├── agent/       # Agent-related components
│   ├── layouts/     # Layout components
│   ├── settings/    # Settings components
│   └── agent-setting/ # Agent settings components
├── constants/        # Application constants
├── contexts/         # React contexts
├── features/         # Feature-based modules
├── hooks/            # Custom React hooks
├── lib/              # Third-party library configurations
├── services/         # API services and external integrations
├── state/            # State management
│   └── slice/       # State slices
├── typings/          # TypeScript type definitions
├── utils/            # Utility functions
├── main.tsx         # Application entry point
└── vite-env.d.ts    # Vite environment types
```

### Feature Structure

Each feature module follows this structure:

```
src/features/[feature-name]/
├── api/         # API calls and hooks
├── components/  # Feature-specific components
├── hooks/       # Feature-specific hooks
├── stores/      # Feature-specific state
├── types/       # Feature-specific types
└── utils/       # Feature-specific utilities
```

## Key Features

- **Session Management**: Create and manage agent sessions
- **Real-time Updates**: Live streaming of agent responses
- **File Browser**: Navigate and interact with project files
- **Action History**: Track and review agent actions
- **Dark Mode**: Built-in theme support
- **Keyboard Shortcuts**: Efficient navigation and control

## Development Guidelines

### Code Style

- ESLint 9 with flat config for code quality
- Prettier for consistent formatting
- Husky + lint-staged for pre-commit hooks

### State Management

The application uses state management with global state located in `src/state/`, including state slices in `src/state/slice/`. Feature-specific state is managed in their respective feature directories.

### UI Components

- Base components from [shadcn/ui](https://ui.shadcn.com/)
- Custom components in `src/components/`
- Feature-specific components in `src/features/*/components/`

### API Integration

- Tauri commands for backend communication
- WebSocket connections for real-time updates
- Type-safe API calls using TypeScript

## Scripts

```bash
# Development
pnpm dev          # Start Vite dev server
pnpm tauri dev    # Start Tauri development mode

# Building
pnpm build        # Build web assets
pnpm tauri build  # Build Tauri application

# Code Quality
pnpm lint         # Run ESLint
pnpm format       # Format code with Prettier
pnpm typecheck    # Run TypeScript type checking

# Testing
pnpm test         # Run tests
pnpm test:watch   # Run tests in watch mode
```

## Environment Variables

Create a `.env` file in the frontend directory and configure the required keys:

```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=<google-oauth-client-id>
VITE_STRIPE_PUBLISHABLE_KEY=<stripe-publishable-key>
```

`VITE_STRIPE_PUBLISHABLE_KEY` is used on the client to initialize Stripe.js for checkout. Use your test key during development (prefixed with `pk_test_`).

## Troubleshooting

### Common Issues

1. **Build fails on macOS**: Ensure Xcode Command Line Tools are installed
2. **Windows build errors**: Install Visual Studio Build Tools
3. **Linux dependencies**: Install required system libraries as per Tauri docs

### Debug Mode

Enable debug logging by setting:

```bash
RUST_LOG=debug pnpm tauri dev
```

## Contributing

1. Follow the existing code structure and conventions
2. Write meaningful commit messages
3. Ensure all tests pass before submitting PRs
4. Update documentation for new features
