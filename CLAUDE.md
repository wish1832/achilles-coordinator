# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Achilles Run Coordinator is a web application for coordinating sign-ups for Achilles International running events, where athletes with disabilities are paired with able-bodied guides. Built with Vue 3, TypeScript, and Firebase, with comprehensive WCAG 2.1 AA compliant accessibility features.

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

## Architecture

### Authentication & Authorization Flow

- Firebase Authentication handles sign-in/sign-out
- User data stored in Firestore `users` collection, with document ID matching Firebase Auth UID
- `authService` (src/firebase/auth.ts) wraps Firebase Auth operations
- `useAuthStore` (src/stores/auth.ts) manages auth state with Pinia
- Router navigation guards (src/router/index.ts) enforce organization-based access control
- Two user roles: `athlete`, `guide` (defined in src/types/models.ts)
- **Admin status is organization-specific**, not a user role:
  - Stored in `adminIds` array within each organization document
  - A user can be an admin of one or more organizations
  - A user can be a regular member of some organizations and an admin of others
  - Both athletes and guides can be organization admins
- Actions permitted:
  - **All authenticated users**:
    - View runs for their organizations
    - Sign up for runs
    - View their sign-up history
    - Manage their own profile
  - **Organization admins** (in addition to above):
    - Create and manage runs for their organizations
    - Create and manage locations for their organizations
    - Manage sign-ups for runs in their organizations
    - Create pairings for runs in their organizations
    - Invite users to their organizations
    - Assign/revoke admin status for their organizations

### State Management

- Pinia stores centralize application state:
  - `auth.ts`: User authentication and permissions
  - `accessibility.ts`: User accessibility preferences (text size, high contrast, reduced motion)
  - `counter.ts`: Example store (can be removed)
- Stores initialized in src/main.ts before Vue app mounts
- Auth state syncs with Firebase onAuthStateChanged listener

### Data Layer

#### Firestore Collections

1. **organizations/** - Achilles chapters (e.g., Denver, Boulder)
   - Fields: `name`, `adminIds`, `memberIds`, `createdAt`, `updatedAt`, `settings`
   - Admins stored in `adminIds` array for organization-specific permissions
   - Members tracked in `memberIds` for efficient querying

2. **locations/** - Run locations per organization
   - Fields: `organizationId`, `name`, `address`, `city`, `state`, `coordinates`, `notes`, `createdAt`, `updatedAt`
   - Structured location data for reuse across multiple runs
   - Scoped to specific organizations

3. **users/** - User profiles
   - Document ID matches Firebase Auth UID
   - Fields: `email`, `displayName`, `role` (athlete/guide), `organizationIds`, `profileDetails`, `userNotes`, `createdAt`, `updatedAt`
   - `organizationIds`: Array of organizations user belongs to
   - `profileDetails`: Contains `activities` (walk/run/roll), `preferredPace`, `paceRange`, disability info, certifications, etc.
   - `userNotes`: Notes written BY the user about themselves, visible to user + org admins
   - Role is either 'athlete' or 'guide' (admin is NOT a role, it's org-specific)

4. **runs/** - Individual running events
   - Fields: `organizationId`, `date`, `time`, `locationId`, `description`, `createdBy`, `status`, `maxAthletes`, `maxGuides`, `notes`, `pairings`, `createdAt`, `updatedAt`
   - `pairings`: Object mapping athleteId to guideId (embedded in run document)
   - `locationId`: Reference to location document
   - Scoped to specific organization

5. **signups/** - User sign-ups for runs
   - Fields: `runId`, `userId`, `role` (athlete/guide for this signup), `timestamp`, `status`, `notes`
   - Tracks who signed up for which run and in what capacity

#### Firestore Service Patterns

- `FirestoreService` class (src/firebase/firestore.ts) provides type-safe CRUD operations
- Generic methods: `addDocument`, `updateDocument`, `deleteDocument`, `getDocument`, `getDocuments`
- Real-time updates supported via `onCollectionChange` method
- All timestamps use Firestore Timestamp type
- TypeScript interfaces in src/types/models.ts define data structure
- Always use FirestoreService methods, not direct Firebase SDK calls
- Document IDs generated by Firestore on creation
- Use query constraints (where, orderBy) for filtered queries
- Common queries:
  - Users by organization: `where('organizationIds', 'array-contains', orgId)`
  - Runs by organization: `where('organizationId', '==', orgId)`
  - Locations by organization: `where('organizationId', '==', orgId)`
  - Signups by run: `where('runId', '==', runId)`
  - Signups by user: `where('userId', '==', userId)`

### Routing

- Vue Router with organization-based navigation guards
- Routes redirect based on authentication status and organization admin permissions
- Authenticated users redirected from `/login` to their dashboard
- Unauthenticated users redirected to `/login` with return path in query
- Meta fields:
  - `requiresAuth`: Boolean - Route requires authentication
  - `requiresOrgAdmin`: Boolean - Route requires admin status in at least one organization
  - `organizationId`: String - Route requires admin status in a specific organization (for org-scoped admin routes)
  - `title`: String - Document title for the route
- Admin routes are scoped to organizations (e.g., `/admin/organizations/:orgId/runs`)
- Users who are admins of multiple organizations can access admin routes for each of their organizations

### Accessibility Implementation

- Custom accessible UI components in src/components/ui/
- Global accessibility panel (AccessibilityPanel.vue) toggleable with Alt+A
- Preferences stored in Pinia accessibility store and persisted to localStorage
- CSS custom properties control theming (text size, high contrast, reduced motion)
- All interactive components have proper ARIA labels, roles, and keyboard support

### Component Organization

- `src/components/`: Reusable components including AccessibilityPanel
- `src/components/ui/`: Accessible UI component library (buttons, cards, modals, inputs, loading states)
- `src/views/`: Page-level components
  - User-facing views: DashboardView, RunsListView, RunDetailView
- `src/views/admin/`: Admin-specific views (requires organization admin status)
  - Organization-scoped admin views for managing runs, locations, users, and pairings

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

## Code Patterns

### Vue Components

- Use Composition API with `<script setup>` syntax
- TypeScript for all component logic
- Props and emits defined with TypeScript types
- Comprehensive inline comments for accessibility and complex logic

### Firestore Operations

- Always use FirestoreService methods, not direct Firebase SDK calls
- Document IDs generated by Firestore on creation
- Timestamps automatically added as `createdAt` and `updatedAt`
- Use query constraints (where, orderBy) for filtered queries
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
