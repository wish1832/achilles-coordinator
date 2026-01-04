# Achilles Run Coordinator - Design Document

This is the source of truth for domain and design specifics (roles, permissions, data models, and architecture). Other docs should defer to this file.

## Overview

Achilles Run Coordinator is a web application for coordinating sign-ups for Achilles International running events. The application pairs athletes with disabilities with able-bodied guides for each run. Built with Vue 3, TypeScript, and Firebase, with comprehensive WCAG 2.1 AA compliant accessibility features.

## Core Requirements

### User Roles and Admin Access

1. **Athletes** - Athletes with disabilities who participate in runs
   - View upcoming runs
   - Sign up for runs
   - View their sign-up history

2. **Guides** - Able-bodied volunteers who guide athletes
   - View upcoming runs
   - Sign up for runs
   - View their sign-up history

3. **Organization Admins** - Athletes or guides with admin access for specific organizations
   - Create and manage runs for their organizations
   - View all sign-ups for their organizations
   - Create pairings (athlete + guide) for their organizations
   - Manage users (invite-only user creation)

### Key Features

1. **Run Management**
   - Admins create runs with date, time, location, and description
   - Athletes and guides can view upcoming runs
   - Sign-up system for both athletes and guides

2. **Pairing System**
   - Admins manually pair athletes with guides for each run
   - Keyboard-accessible pairing interface
   - View and manage existing pairings
   - Admin-only pairing notes to explain pairing decisions (not visible to users)

3. **User Management**
   - Invite-only registration (admins create accounts)
   - Role assignment (athlete, guide)
   - Admin access is organization-specific and can be granted to athletes or guides
   - User profile management

4. **Accessibility**
   - Full screen reader support
   - Keyboard navigation throughout
   - High contrast mode
   - Text sizing controls
   - Reduced motion support
   - WCAG 2.1 AA compliant

## Architecture

### Technology Stack

- **Frontend Framework**: Vue 3 with Composition API
- **Language**: TypeScript
- **Build Tool**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router
- **Backend**: Firebase (Authentication + Firestore)
- **Styling**: CSS with CSS Custom Properties

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Accessible UI component library
│   │   ├── Button.vue
│   │   ├── Card.vue
│   │   ├── Modal.vue
│   │   ├── Select.vue
│   │   └── Loading.vue
│   └── AccessibilityPanel.vue
├── repositories/       # Data access layer (Repository Pattern)
│   ├── interfaces/     # Repository interface definitions
│   │   ├── IAuthRepository.ts
│   │   ├── IDataRepository.ts
│   │   └── IStorageRepository.ts
│   ├── firebase/       # Firebase implementations (production)
│   │   ├── FirebaseAuthRepository.ts
│   │   └── FirebaseDataRepository.ts
│   ├── mocks/          # Mock implementations (unit tests)
│   │   ├── MockAuthRepository.ts
│   │   └── MockDataRepository.ts
│   └── emulators/      # Emulator implementations (integration tests)
│       ├── EmulatorAuthRepository.ts
│       └── EmulatorDataRepository.ts
├── composables/        # Vue composables
│   └── useRepositories.ts  # Repository dependency injection
├── firebase/           # Firebase configuration
│   └── config.ts       # Firebase initialization
├── stores/             # Pinia stores for state management
│   ├── auth.ts         # Authentication store
│   └── accessibility.ts # Accessibility preferences store
├── types/              # TypeScript type definitions
│   ├── models.ts       # Data model interfaces
│   └── index.ts        # Type exports
├── views/              # Page-level components
│   ├── LoginView.vue
│   ├── RunsListView.vue
│   ├── NotFoundView.vue
│   └── admin/          # Admin-specific views
│       ├── AdminDashboard.vue
│       ├── RunsView.vue
│       ├── UsersView.vue
│       └── PairingView.vue
├── router/             # Vue Router configuration
│   └── index.ts
├── App.vue             # Root component
└── main.ts             # Application entry point
```

## Data Models

### Organization

```typescript
interface Organization {
  id: string
  name: string // e.g., "Achilles Denver", "Achilles Boulder"
  adminIds: string[] // User IDs of organization admins
  memberIds: string[] // User IDs of all members (for easier querying)
  createdAt: Date
  updatedAt?: Date
  settings?: {
    defaultMaxAthletes?: number
    defaultMaxGuides?: number
    timezone?: string
  }
}
```

### Location

```typescript
interface Location {
  id: string
  organizationId: string // Organization this location belongs to
  name: string // e.g., "Washington Park", "Boulder Creek Path"
  address?: string
  city?: string
  state?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  notes?: string
  createdAt: Date
  updatedAt?: Date
}
```

### User

```typescript
interface User {
  id: string
  email: string
  displayName: string
  role: 'athlete' | 'guide' // Primary role - NOT admin (admin is org-specific)
  organizationIds: string[] // Organizations this user belongs to
  createdAt: Date
  updatedAt?: Date
  profileDetails: {
    phone?: string
    emergencyContact?: string
    emergencyPhone?: string
    // Activity preferences (for both athletes and guides)
    activities?: ('walk' | 'run' | 'roll')[] // Activities user participates in
    preferredPace?: number // Minutes per mile
    paceRange?: {
      min: number // Minimum pace in minutes per mile
      max: number // Maximum pace in minutes per mile
    }
    // Athlete-specific
    disabilityType?: string
    assistanceNeeded?: string
    // Guide-specific
    certifications?: ('visually impaired guiding')[] // Array of certification types
  }
  userNotes?: string // Notes written BY user about themselves, visible to user + admins
}
```

### Run

```typescript
interface Run {
  id: string
  organizationId: string // Organization hosting this run
  date: Date
  time: string // Format: "HH:MM" (24-hour)
  locationId: string // Reference to Location document
  description: string
  createdBy: string // User ID of admin who created this run
  runAdminIds?: string[] // User IDs of admins for this run (org admins are implicit admins)
  createdAt: Date
  updatedAt?: Date
  status: 'upcoming' | 'completed' | 'cancelled'
  maxAthletes?: number
  maxGuides?: number
  notes?: string
  pairings?: {
    [athleteId: string]: string // Maps athlete user ID to guide user ID
  }
}
```

### SignUp

```typescript
interface SignUp {
  id: string
  runId: string
  userId: string
  role: 'athlete' | 'guide' // Role for this specific sign-up
  timestamp: Date
  status: 'active' | 'withdrawn'
  notes?: string
}
```

## Firestore Collections

### organizations/

- Document ID: Auto-generated
- Fields: name, adminIds, memberIds, createdAt, updatedAt, settings
- Security: All authenticated users can read; only organization admins can write
- Indexes: None required for initial implementation

### locations/

- Document ID: Auto-generated
- Fields: organizationId, name, address, city, state, coordinates, notes, createdAt, updatedAt
- Security: All authenticated users can read; only organization admins can write
- Indexes: organizationId (for querying locations by organization)

### users/

- Document ID: Firebase Auth UID
- Fields: email, displayName, role, organizationIds, createdAt, updatedAt, profileDetails, userNotes
- Security: Users can read/write their own data; organization admins can read all users in their organizations
- Indexes: organizationIds (array-contains for querying users by organization)

### runs/

- Document ID: Auto-generated
- Fields: organizationId, date, time, locationId, description, createdBy, runAdminIds, createdAt, updatedAt, status, maxAthletes, maxGuides, notes, pairings
- Security: All authenticated users can read; only organization admins can write
- Indexes:
  - organizationId (for querying runs by organization)
  - date (for sorting by date)
  - Composite: organizationId + date (for filtered and sorted queries)

### signups/

- Document ID: Auto-generated
- Fields: runId, userId, role, timestamp, status, notes
- Security: Users can read/write their own sign-ups; organization admins can read/write all sign-ups for their organization's runs
- Indexes:
  - runId (for querying sign-ups by run)
  - userId (for querying a user's sign-ups)
  - Composite: runId + role (for querying athletes or guides for a specific run)

## Authentication & Authorization

### Authentication Flow

1. User signs in with email/password via Firebase Authentication
2. On successful authentication, user data is fetched from Firestore `users` collection
3. User's organizations are fetched to determine admin status for each organization
4. User data and organization permissions stored in Pinia `auth` store
5. Router guards check authentication status, organization membership, and admin status for route access

### Invitation Flow (Admin-Only)

1. Admin creates an organization invite record (`organizationInvites`).
2. Backend callable `sendOrganizationInvite`:
   - Looks up or creates the Firebase Auth user by email.
   - Generates a password setup link (Admin SDK `generatePasswordResetLink`).
   - Sends the invite email with organization context and link.
3. Invitee signs in, and the app accepts the invite to create/update the user profile and add org membership.

### Authorization Rules

- **All Authenticated Users**: Can access `/runs` route (view runs for their organizations)
- **Organization Admins**: Can access `/admin/*` routes for their organizations
  - Create and manage runs for their organizations
  - Create and manage locations for their organizations
  - Manage sign-ups for runs in their organizations
  - Create pairings for runs in their organizations
  - Invite users to their organizations
- **Unauthenticated**: Redirected to `/login`
- **Authenticated on login page**: Redirected to appropriate dashboard

### Admin Permissions Model

Admin status is **organization-specific**, not a global user role:

- A user's `role` field is either `'athlete'` or `'guide'`
- Admin permissions are determined by the `adminIds` array in each organization
- A user can be an admin of one or more organizations
- A user can be a regular member of some organizations and an admin of others
- Athletes can be admins (e.g., an athlete who helps organize their chapter)
- Guides can be admins (e.g., a guide who coordinates runs)

### Route Guards

- `requiresAuth`: Boolean - Route requires authentication
- `requiresOrgAdmin`: Boolean - Route requires admin status in at least one organization
- `organizationId`: String - Route requires admin status in a specific organization
- Automatic redirects based on authentication status and organization permissions

## Accessibility Implementation

### Core Accessibility Features

1. **Screen Reader Support**
   - All interactive elements have ARIA labels
   - Proper ARIA roles and states
   - ARIA live regions for dynamic updates
   - Semantic HTML structure

2. **Keyboard Navigation**
   - Full keyboard accessibility
   - Visible focus indicators
   - Tab order follows logical flow
   - Keyboard shortcuts (Alt+A for accessibility panel)

3. **Visual Accessibility**
   - High contrast mode toggle
   - Text sizing (small, medium, large, extra-large)
   - Reduced motion support
   - Color contrast meets WCAG AA standards

4. **Component Accessibility**
   - All UI components built with accessibility in mind
   - Focus trap in modals
   - Skip links for main content
   - Proper heading hierarchy

### Accessibility Store

- Stores user preferences in Pinia store
- Persists to localStorage
- Applies CSS classes based on preferences
- Accessible via keyboard shortcut (Alt+A)

## UI Components

### Accessible Component Library

All UI components in `src/components/ui/` are built with accessibility as a core requirement:

1. **Button**
   - Keyboard support (Enter, Space)
   - Loading states with ARIA announcements
   - Variants: primary, secondary, danger, ghost, link
   - Sizes: small, medium, large

2. **Card**
   - Semantic HTML (article element)
   - Clickable variant with keyboard support
   - Proper heading structure
   - Variants: default, elevated, outlined, filled

3. **Modal**
   - Focus trap
   - ESC key to close
   - ARIA dialog role
   - Backdrop click to close (optional)
   - Restores focus on close

4. **Select**
   - Native select element for accessibility
   - Custom styling with ARIA labels
   - Error states with ARIA invalid
   - Helper text support

5. **Loading**
   - ARIA live regions
   - Multiple types: spinner, dots, pulse
   - Accessible loading announcements

## Views & Pages

### Public Pages

1. **LoginView** (`/login`)
   - Email/password authentication
   - Password visibility toggle
   - Form validation
   - Error handling
   - Redirects authenticated users

2. **NotFoundView** (`/*`)
   - 404 error page
   - Navigation options (home, back)

### User Pages

1. **DashboardView** (`/dashboard`)
   - Organization selector (if user belongs to multiple organizations)
   - Upcoming runs for selected organization(s)
   - User's sign-up history
   - Quick sign-up actions

2. **RunsListView** (`/runs`)
   - List of upcoming runs across all user's organizations
   - Filter by organization
   - Sign-up functionality
   - View run details (date, time, location, description)
   - Accessible to all authenticated users

3. **RunDetailView** (`/runs/:id`)
   - Detailed view of a specific run
   - Location information
   - Sign-up button (if not already signed up)
   - Withdraw button (if already signed up)
   - View pairings (if pairings have been created)

### Admin Pages

**Note**: Admin pages are organization-scoped. Admins see only data for organizations they administer.

1. **AdminDashboard** (`/admin`)
   - Organization selector (if admin of multiple organizations)
   - Quick stats for selected organization:
     - Upcoming runs count
     - Total athletes and guides
     - Pending pairings count
   - Quick action cards (Create Run, Manage Locations, View Users)
   - Recent activity feed

2. **OrganizationView** (`/admin/organizations/:id`)
   - Organization details page
   - List of runs for this organization
   - Manage organization settings
   - View organization members
   - Manage organization admins

3. **RunsManagementView** (`/admin/organizations/:orgId/runs`)
   - List all runs for the organization
   - Create new run
   - Edit existing runs
   - Delete runs
   - View sign-ups per run
   - Quick link to pairing page for each run

4. **RunDetailAdminView** (`/admin/organizations/:orgId/runs/:runId`)
   - Detailed admin view of a specific run
   - Edit run details
   - View all sign-ups (athletes and guides)
   - Create/manage pairings for this run
   - Manual pairing interface (keyboard accessible)
   - View existing pairings
   - Unpair functionality
   - Export participant list

5. **LocationsView** (`/admin/organizations/:orgId/locations`)
   - List all locations for the organization
   - Create new location
   - Edit existing locations
   - Delete locations
   - View which runs use each location

6. **UsersView** (`/admin/organizations/:orgId/users`)
   - List all users in the organization
   - Filter by role (athlete/guide)
   - Invite new user to organization
   - View user profiles
   - Remove users from organization
   - Assign/revoke admin status for the organization

## Implementation Plan

### Phase 1: Foundation ✅

- [x] Firebase setup and configuration
- [x] Data models and TypeScript interfaces (initial version)
- [x] Authentication system with Pinia store
- [x] Accessible UI component library (Button, Card, Modal, Select, Loading)
- [x] Accessibility features (AccessibilityPanel, theme, text sizing, high contrast, reduced motion)
- [x] Router setup with authentication guards
- [x] Login view
- [x] Runs list view (basic)
- [x] Admin dashboard view (basic)
- [x] Not found (404) view
- [x] Firestore service wrapper with CRUD operations

### Phase 2: Repository Pattern Refactoring & Testing Infrastructure

- [x] **Refactor to Repository Pattern**:
  - [x] Create repository interfaces (`IAuthRepository`, `IDataRepository`)
  - [x] Refactor existing Firebase code to implement repository interfaces
  - [x] Update stores and components to use repository abstractions
- [ ] **Update Data Models**:
  - [ ] Add Organization model and Firestore integration
  - [ ] Add Location model and Firestore integration
  - [ ] Update User model with organizationIds array
  - [ ] Update Run model with organizationId and locationId
  - [x] Remove 'admin' from UserRole (make it org-specific)
- [ ] **Testing Setup**:
  - [ ] Create mock repository implementations for unit testing
  - [ ] Create emulator repository implementations for integration tests
  - [ ] Implement dependency injection using Vue composables (`useAuthRepository`, `useDataRepository`)
  - [ ] Configure Vitest for unit tests with mock repositories
  - [ ] Configure Firebase emulator suite for integration tests
  - [ ] Add test environment configuration files (.env.test, .env.integration)
  - [ ] Write initial unit tests for stores using mock repositories
  - [ ] Write initial integration tests for auth flow using emulator

### Phase 3: Organization & Multi-Tenant Architecture

- [ ] Update auth store to handle organization-specific admin permissions
- [ ] Organization selector component (for users in multiple orgs)
- [ ] Organization view (admin) - view/edit org details
- [ ] Locations management view (admin) - create/edit/delete locations
- [ ] Update router guards to check organization-specific admin status
- [ ] Update all queries to be organization-scoped

### Phase 4: Core User Features

- [ ] User dashboard view with organization selector
- [ ] Enhanced runs list view with organization filtering
- [ ] Run detail view (user-facing)
- [ ] Sign-up functionality (create/withdraw signups)
- [ ] User profile view and editing
- [ ] Sign-up history view
- [ ] Run filtering and search

### Phase 5: Admin Features

- [ ] Admin dashboard with organization selector and stats
- [ ] Run management view (admin: create, edit, delete runs)
- [ ] Run detail admin view with sign-up management
- [ ] User management view (admin: invite users, manage org membership)
- [ ] Admin assignment (assign/revoke org admin status)
- [ ] Location management integration with run creation

### Phase 6: Pairing System

- [ ] Update Run model to use embedded pairings object
- [ ] Pairing interface in run detail admin view
- [ ] Keyboard-accessible pairing workflow
- [ ] Drag-and-drop pairing (with keyboard alternative)
- [ ] Unpair functionality
- [ ] Pairing display in user-facing run detail view
- [ ] Pairing conflict detection (athlete/guide already paired)

### Phase 7: Polish & Enhanced Features

- [ ] Comprehensive error handling and user feedback
- [ ] Loading states throughout the app
- [ ] Form validation for all forms
- [ ] Toast notifications for actions
- [ ] Confirmation dialogs for destructive actions
- [ ] Export functionality (participant lists, run reports)
- [ ] Email notifications (optional)
- [ ] Run templates for common events

### Phase 8: Testing & Accessibility Audit

- [ ] Complete unit test coverage (>80%)
- [ ] Integration tests for all critical flows
- [ ] E2E tests for complete user journeys
- [ ] Screen reader testing (NVDA, JAWS, VoiceOver)
- [ ] Keyboard navigation testing (all features)
- [ ] Color contrast validation
- [ ] WCAG 2.1 AA compliance audit
- [ ] Cross-browser testing
- [ ] Mobile responsiveness testing
- [ ] Performance optimization

## Security Considerations

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is admin of an organization
    function isOrgAdmin(orgId) {
      return request.auth != null &&
        request.auth.uid in get(/databases/$(database)/documents/organizations/$(orgId)).data.adminIds;
    }

    // Helper function to check if user is admin of a run
    function isRunAdmin(runId) {
      return request.auth != null &&
        request.auth.uid in get(/databases/$(database)/documents/runs/$(runId)).data.runAdminIds;
    }

    // Organizations are readable by all authenticated users
    // Writable only by organization admins
    match /organizations/{orgId} {
      allow read: if request.auth != null;
      allow write: if isOrgAdmin(orgId);
    }

    // Locations are readable by all authenticated users
    // Writable only by admins of the organization that owns the location
    match /locations/{locationId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null &&
        isOrgAdmin(request.resource.data.organizationId);
      allow update, delete: if request.auth != null &&
        isOrgAdmin(resource.data.organizationId);
    }

    // Users can read and write their own data
    // Organization admins can read users in their organizations
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null &&
        exists(/databases/$(database)/documents/users/$(userId)) &&
        get(/databases/$(database)/documents/users/$(userId)).data.organizationIds.hasAny(
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organizationIds
        );
      // Note: Additional rules needed to verify admin status for user management
    }

    // Runs are readable by all authenticated users
    // Writable by org admins or run admins
    match /runs/{runId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null &&
        isOrgAdmin(request.resource.data.organizationId);
      allow update, delete: if request.auth != null &&
        (isOrgAdmin(resource.data.organizationId) || isRunAdmin(runId));
    }

    // Signups are readable and writable by the user who created them
    // Org admins or run admins can read/write all signups for runs they manage
    match /signups/{signupId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
      allow read, write: if request.auth != null &&
        exists(/databases/$(database)/documents/runs/$(resource.data.runId)) &&
        (isOrgAdmin(get(/databases/$(database)/documents/runs/$(resource.data.runId)).data.organizationId) ||
        isRunAdmin(resource.data.runId));
    }
  }
}
```

**Note**: These security rules provide organization-scoped permissions. Key principles:

- Users can manage their own data
- Organization admins can manage resources (runs, locations, signups) for their organizations
- Run admins can manage resources (runs, signups) for their specific runs
- All authenticated users can read organizations and runs (for signup purposes)
- Admin status is determined by the `adminIds` array in the organization document
- Run admin status is determined by the `runAdminIds` array in the run document

### Authentication Security

- Invite-only registration (admins create accounts)
- Email/password authentication via Firebase
- Role-based access control
- Secure token management by Firebase

## Testing Strategy & Data Abstraction

### Architecture Pattern: Repository Pattern + Dependency Injection

To support both production Firebase usage and local testing with mock data, all Firebase services must be implemented using the **Repository Pattern** with **dependency injection**.

#### Repository Pattern

Create repository interfaces (contracts) for all data access and authentication operations, with multiple implementations:

1. **Production Implementation**: Uses real Firebase SDK
2. **Mock Implementation**: Uses in-memory data structures for fast unit tests
3. **Emulator Implementation**: Uses Firebase emulator suite for integration tests

**Example Structure**:

```typescript
// 1. Define the repository interface (contract)
interface IAuthRepository {
  signIn(email: string, password: string): Promise<User>
  signOut(): Promise<void>
  getCurrentUser(): Promise<User | null>
  onAuthStateChanged(callback: (user: User | null) => void): () => void
}

// 2. Firebase implementation (production)
class FirebaseAuthRepository implements IAuthRepository {
  async signIn(email: string, password: string): Promise<User> {
    // Real Firebase Auth logic
  }
  // ... other methods
}

// 3. Mock implementation (unit tests)
class MockAuthRepository implements IAuthRepository {
  private currentUser: User | null = null

  async signIn(email: string, password: string): Promise<User> {
    // Return mock user from in-memory store
  }
  // ... other methods
}

// 4. Emulator implementation (integration tests)
class EmulatorAuthRepository implements IAuthRepository {
  // Uses Firebase Auth with emulator endpoint
}
```

#### Dependency Injection Approach

Use Vue composables and/or provide/inject to deliver the correct repository implementation based on environment:

**Option 1: Composables (Recommended for Vue 3)**

```typescript
// src/composables/useRepositories.ts
export function useAuthRepository(): IAuthRepository {
  if (import.meta.env.MODE === 'test') {
    return mockAuthRepository
  } else if (import.meta.env.VITE_USE_EMULATOR === 'true') {
    return emulatorAuthRepository
  }
  return firebaseAuthRepository
}

export function useDataRepository(): IDataRepository {
  if (import.meta.env.MODE === 'test') {
    return mockDataRepository
  } else if (import.meta.env.VITE_USE_EMULATOR === 'true') {
    return emulatorDataRepository
  }
  return firebaseDataRepository
}

// Usage in components and stores
const authRepo = useAuthRepository()
const user = await authRepo.signIn(email, password)
```

**Option 2: Provide/Inject (Vue's DI system)**

```typescript
// src/main.ts
const authRepository = createAuthRepository() // Factory selects implementation
app.provide('authRepository', authRepository)

// In components
const authRepository = inject<IAuthRepository>('authRepository')
```

#### Repositories to Implement

All Firebase services must be abstracted into repositories following this pattern:

1. **Authentication Repository** (`IAuthRepository`)
   - Sign in/out operations
   - User state management
   - Auth state change listeners
   - User creation (admin only)

2. **Data Repository** (`IDataRepository`)
   - CRUD operations for all Firestore collections
   - Real-time listeners for data changes
   - Query operations with filtering and sorting
   - Batch operations

3. **Storage Repository** (`IStorageRepository`) - if file uploads are added
   - File uploads to Firebase Storage
   - File downloads and URL generation
   - File deletion

#### Testing Strategy

Use a **hybrid approach** with both mock and emulator testing:

### Unit Tests

- **Use**: In-memory mock implementations
- **Speed**: Very fast (no Firebase dependency)
- **Scope**:
  - Store logic (auth, accessibility)
  - Utility functions
  - Component logic
  - Service layer logic
  - Form validation

**Example**:

```typescript
// tests/unit/auth.spec.ts
import { mockAuthRepository } from '@/repositories/mocks'

describe('Auth Store', () => {
  it('should sign in user', async () => {
    const authStore = useAuthStore(mockAuthRepository)
    await authStore.signIn('test@example.com', 'password')
    expect(authStore.isAuthenticated).toBe(true)
  })
})
```

### Integration Tests

- **Use**: Firebase emulator suite
- **Speed**: Slower but more realistic
- **Scope**:
  - Authentication flow with Firestore
  - Firestore operations with security rules
  - Router navigation with auth guards
  - Complex multi-service workflows

**Example**:

```typescript
// tests/integration/signup-flow.spec.ts
import { emulatorDataRepository, emulatorAuthRepository } from '@/repositories/emulators'

describe('Sign-up Flow', () => {
  beforeAll(async () => {
    // Connect to emulator
    await setupEmulator()
  })

  it('should allow user to sign up for run', async () => {
    // Uses real Firestore emulator
    const run = await emulatorDataRepository.addDocument('runs', runData)
    const signup = await emulatorDataRepository.addDocument('signups', signupData)
    // Verify security rules, triggers, etc.
  })
})
```

### E2E Tests

- **Use**: Firebase emulator suite OR staging environment
- **Speed**: Slowest, most comprehensive
- **Scope**:
  - Complete user sign-in flow
  - Complete run sign-up flow
  - Admin pairing workflow
  - Accessibility features
  - Cross-browser testing

### Accessibility Testing

- Screen reader testing (NVDA, JAWS, VoiceOver)
- Keyboard navigation testing
- Color contrast validation
- WCAG compliance audit

### Environment Configuration

Add environment variables for test mode selection:

```bash
# .env.test
VITE_USE_MOCK_SERVICES=true
VITE_USE_EMULATOR=false

# .env.integration
VITE_USE_MOCK_SERVICES=false
VITE_USE_EMULATOR=true
VITE_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
VITE_FIRESTORE_EMULATOR_HOST=localhost:8080
```

### Benefits of the Repository Pattern

1. **Fast Unit Tests**: No Firebase dependency, instant feedback with in-memory mocks
2. **Realistic Integration Tests**: Test with actual Firebase behavior and security rules using emulators
3. **Flexible Development**: Develop offline with mocks or use emulator for local testing
4. **Easy Mocking**: Test error scenarios and edge cases without complicated setup
5. **Future-Proof**: Easy to swap data sources (e.g., move from Firebase to another backend)
6. **Type Safety**: TypeScript interfaces ensure all repository implementations match the contract
7. **Separation of Concerns**: Business logic stays in stores/components, data access logic in repositories
8. **Testable Code**: Components and stores can be tested independently of Firebase

### Repository Pattern Best Practices

- **Single Responsibility**: Each repository handles one domain (auth, data, storage)
- **Interface-First**: Always define the interface before implementing
- **Consistent API**: All implementations of the same interface must behave identically
- **Error Handling**: Repositories should throw consistent error types across implementations
- **No Business Logic**: Repositories only handle data access, not business rules
- **Composable Integration**: Use Vue composables to inject repositories into stores and components

## Deployment

### Environment Setup

1. Create Firebase project
2. Enable Authentication (Email/Password)
3. Enable Firestore
4. Configure security rules
5. Set environment variables in `.env`
6. Build: `pnpm build`
7. Deploy: `firebase deploy`

### Environment Variables

Required variables (in `.env`):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Future Enhancements

1. **Notifications**
   - Email notifications for sign-ups
   - Reminder emails before runs
   - Pairing confirmation emails

2. **Analytics**
   - Run attendance tracking
   - User engagement metrics
   - Pairing success rates

3. **Advanced Features**
   - Run templates
   - Recurring runs
   - Waitlist functionality
   - Run cancellation handling

4. **Mobile App**
   - Native mobile app
   - Push notifications
   - Offline support

## Accessibility Checklist

- [x] All interactive elements keyboard accessible
- [x] Screen reader support with ARIA labels
- [x] High contrast mode
- [x] Text sizing controls
- [x] Reduced motion support
- [x] Focus indicators visible
- [x] Semantic HTML structure
- [x] Color contrast WCAG AA compliant
- [x] Skip links for main content
- [x] Form labels and error messages
- [ ] Screen reader testing completed
- [ ] Keyboard navigation testing completed
- [ ] Accessibility audit completed

## Notes

- All dates/times stored as Firestore Timestamps
- User creation is invite-only (admin-only)
- Pairing is manual (no automatic matching)
- Accessibility is a core requirement, not an afterthought
- All components must be tested with screen readers before completion
