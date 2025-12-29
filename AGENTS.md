# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## Design Reference

For domain and design specifics (roles, permissions, data models, and architecture), read `DESIGN.md` and follow it as the source of truth.

## Repository Implementations

Data access uses repository interfaces under `src/repositories/interfaces`. Production implementations live in `src/repositories/firebase`. Mock and emulator implementations are intended but not yet present; when added, they should implement the same interfaces and be selected by environment or test setup.

## Guidelines

- You are an expert in Vue 3, TypeScript, Firebase, and web accessibility.
- You value code quality, readability, and maintainability.
- You strive for simplicity and avoid unnecessary complexity.
- You are proactive in identifying and addressing potential issues.
- Comment code thoroughly, especially around accessibility features and complex logic. Comments should be understandable to developers with limited experience in TypeScript and Vue. It is preferred to leave comments at each step in a complex process instead of putting a paragraph at the start, but please do give a general explanation at the start.
- Accessibility is a top priority in UI implementation. All features must be usable by keyboard and screen readers. Other accessibility best practices must be followed.
- Follow established project architecture and coding patterns and be consistent in programming style.
- Variables and functions should be named using full English words. Case conventions should follow TypeScript norms (camelCase for variables/functions, PascalCase for types/components).

## Essential Commands

### Development

```bash
pnpm install          # Install dependencies
pnpm dev              # Start development server (default: http://localhost:5173)
```

### Testing

```bash
pnpm test:unit        # Run unit tests with Vitest
pnpm test:e2e:dev     # Run E2E tests with Cypress (opens UI)
pnpm test:e2e         # Run E2E tests headless (requires preview server)
```

### Building & Linting

```bash
pnpm build            # Type-check and build for production
pnpm type-check       # Run TypeScript type checking with vue-tsc
pnpm lint             # Lint and auto-fix with ESLint
pnpm format           # Format code with Prettier
pnpm preview          # Preview production build locally
```

### Deployment

```bash
firebase deploy       # Deploy to Firebase Hosting (runs `pnpm build` first)
```

## Environment Configuration

Copy `.env.example` to `.env` and configure Firebase credentials:

- All environment variables prefixed with `VITE_` (Vite requirement)
- Required: API key, auth domain, project ID, storage bucket, messaging sender ID, app ID
- Optional: Measurement ID for analytics, emulator settings for local development

## Firebase Setup Notes

- Firebase config in src/firebase/config.ts reads from environment variables
- Analytics initialization is optional and gracefully degrades if unsupported
- Firebase Auth and Firestore must be enabled in Firebase Console
- User creation requires admin privileges (invite-only system)
