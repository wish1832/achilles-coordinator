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

### Data Model Details

#### User Profile Structure

```typescript
interface User {
  id: string
  email: string
  displayName: string
  role: 'athlete' | 'guide' // NOT 'admin' - admin is org-specific
  organizationIds: string[] // Organizations user belongs to
  profileDetails: {
    phone?: string
    emergencyContact?: string
    emergencyPhone?: string
    // Activity preferences (for both athletes and guides)
    activities?: ('walk' | 'run' | 'roll')[]
    preferredPace?: number // Minutes per mile
    paceRange?: { min: number; max: number } // Min/max pace in minutes per mile
    // Athlete-specific fields
    disabilityType?: string
    assistanceNeeded?: string
    // Guide-specific fields
    certifications?: string[]
    maxAthletesPerRun?: number
  }
  userNotes?: string // Notes BY user about themselves, visible to user + org admins
  createdAt: Date
  updatedAt?: Date
}
```

#### Run Pairings Structure

- Pairings are **embedded in the run document** as an object mapping athlete IDs to guide IDs
- Format: `{ [athleteId: string]: guideId: string }`
- Example: `{ "user123": "user456", "user789": "user012" }`
- This means athlete user123 is paired with guide user456, etc.
- Pairing is done per-run on the run detail admin page
- No separate pairings collection (pairings are part of the run document)

#### Organization-Scoped Resources

- **Runs** belong to one organization (`organizationId` field)
- **Locations** belong to one organization (`organizationId` field)
- **Users** can belong to multiple organizations (`organizationIds` array)
- Admin privileges are per-organization (stored in organization's `adminIds` array)

### Accessibility Requirements

- All new components must include proper ARIA attributes
- Test with keyboard navigation (Tab, Enter, Space, Escape)
- Ensure focus indicators are visible
- Support screen readers with descriptive labels
- Respect user preferences from accessibility store
