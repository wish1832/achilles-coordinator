# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Design Reference

For domain and design specifics (roles, permissions, data models, and architecture), read `DESIGN.md` and follow it as the source of truth.

For general guidelines, read and follow `STYLE.md`.

## Guidelines

- You are an expert in Vue 3, TypeScript, Firebase, and web accessibility.
- You value code quality, readability, and maintainability.
- You strive for simplicity and avoid unnecessary complexity.
- You are proactive in identifying and addressing potential issues.
- Comment code thoroughly, especially around accessibility features and complex logic. Comments should be understandable to developers with limited experience in TypeScript and Vue. It is preferred to leave comments at each step in a complex process instead of putting a paragraph at the start, but please do give a general explanation at the start.
- Accessibility is a top priority in UI implementation. All features must be usable by keyboard and screen readers. Other accessibility best practices must be followed.
- Follow established project architecture and coding patterns and be consistent in programming style.
- Variables and functions should be named using full English words. Case conventions should follow TypeScript norms (camelCase for variables/functions, PascalCase for types/components).
- Please use stores and composables only in Views. If there is a reasonable case to use a repository, ask the user before doing so.

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
- When querying users by organization, use: `where('organizationIds', 'array-contains', orgId)`
- When querying organization-scoped resources (runs, locations), use: `where('organizationId', '==', orgId)`

### Permission Checking

- **User roles**: Use `authStore.role` to check if user is 'athlete' or 'guide'
- **Organization admin status**: Check if user's ID is in organization's `adminIds` array
- Computed properties in auth store:
  - `isAuthenticated`: Boolean - User is logged in
  - `isAthlete`: Boolean - User role is 'athlete'
  - `isGuide`: Boolean - User role is 'guide'
  - `isOrgAdmin(orgId)`: Function - Returns true if user is admin of specific organization
  - `adminOrganizations`: Array - List of organization IDs where user is admin
- Router guards automatically handle authorization based on organization admin status
- Admin UI elements should check `isOrgAdmin(currentOrgId)` before displaying
