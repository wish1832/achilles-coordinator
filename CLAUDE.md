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
- Router navigation guards (src/router/index.ts) enforce role-based access control
- Three roles: `athlete`, `guide`, `admin` (defined in src/types/models.ts)
- Actions permitted per role:
  - Admins
    - Create runs
    - View runs
    - Manage sign-ups
    - Pair athletes with guides
  - Athletes
    - View runs
    - Sign up for a run
  - Guides
    - View runs
    - Sign up for a run
- Admin-only operations: creating users, managing runs, creating pairings

### State Management

- Pinia stores centralize application state:
  - `auth.ts`: User authentication and permissions
  - `accessibility.ts`: User accessibility preferences (text size, high contrast, reduced motion)
  - `counter.ts`: Example store (can be removed)
- Stores initialized in src/main.ts before Vue app mounts
- Auth state syncs with Firebase onAuthStateChanged listener

### Data Layer

- Firestore collections: `users`, `runs`, `signups`, `pairings`
- `FirestoreService` class (src/firebase/firestore.ts) provides type-safe CRUD operations
- Generic methods: `addDocument`, `updateDocument`, `deleteDocument`, `getDocument`, `getDocuments`
- Real-time updates supported via `onCollectionChange` method
- All timestamps use Firestore Timestamp type
- TypeScript interfaces in src/types/models.ts define data structure

### Routing

- Vue Router with role-based navigation guards
- Routes redirect based on authentication status and user role
- Authenticated users redirected from `/login` to their appropriate dashboard
- Unauthenticated users redirected to `/login` with return path in query
- Meta fields: `requiresAuth`, `roles`, `title` (for document title)

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
- `src/views/admin/`: Admin-specific views (requires admin role)

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

### Role Checking

- Use `authStore.hasPermission(['admin'])` for role checks
- Computed properties: `isAuthenticated`, `isAdmin`, `isAthlete`, `isGuide`
- Router guards automatically handle authorization

### Accessibility Requirements

- All new components must include proper ARIA attributes
- Test with keyboard navigation (Tab, Enter, Space, Escape)
- Ensure focus indicators are visible
- Support screen readers with descriptive labels
- Respect user preferences from accessibility store
