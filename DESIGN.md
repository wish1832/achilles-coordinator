# Achilles Run Coordinator - Design Document

## Overview

Achilles Run Coordinator is a web application for coordinating sign-ups for Achilles International running events. The application pairs athletes with disabilities with able-bodied guides for each run. Built with Vue 3, TypeScript, and Firebase, with comprehensive WCAG 2.1 AA compliant accessibility features.

## Core Requirements

### User Roles

1. **Athletes** - Athletes with disabilities who participate in runs
   - View upcoming runs
   - Sign up for runs
   - View their sign-up history

2. **Guides** - Able-bodied volunteers who guide athletes
   - View upcoming runs
   - Sign up for runs
   - View their sign-up history

3. **Admins** - Administrators who manage the system
   - Create and manage runs
   - View all sign-ups
   - Create pairings (athlete + guide)
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

3. **User Management**
   - Invite-only registration (admins create accounts)
   - Role assignment (athlete, guide, admin)
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
├── firebase/           # Firebase configuration and services
│   ├── config.ts       # Firebase initialization
│   ├── auth.ts         # Authentication service wrapper
│   └── firestore.ts    # Firestore service wrapper
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

### User

```typescript
interface User {
  id: string
  email: string
  displayName: string
  role: 'athlete' | 'guide' | 'admin'
  createdAt: Date
  updatedAt?: Date
  profileDetails: {
    phone?: string
    emergencyContact?: string
    emergencyPhone?: string
    // Athlete-specific
    disabilityType?: string
    assistanceNeeded?: string
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced'
    // Guide-specific
    guideExperience?: 'new' | 'experienced' | 'expert'
    certifications?: string[]
    maxAthletesPerRun?: number
  }
}
```

### Run

```typescript
interface Run {
  id: string
  date: Date
  time: string // Format: "HH:MM" (24-hour)
  location: string
  description: string
  createdBy: string // User ID of admin
  createdAt: Date
  updatedAt?: Date
  status: 'upcoming' | 'completed' | 'cancelled'
  maxAthletes?: number
  maxGuides?: number
  notes?: string
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

### Pairing

```typescript
interface Pairing {
  id: string
  runId: string
  athleteId: string
  guideId: string
  createdBy: string // User ID of admin
  createdAt: Date
  notes?: string
  status: 'active' | 'cancelled'
}
```

## Firestore Collections

### users/

- Document ID: Firebase Auth UID
- Fields: email, displayName, role, createdAt, updatedAt, profileDetails
- Security: Users can read/write their own data; admins can read all

### runs/

- Document ID: Auto-generated
- Fields: date, time, location, description, createdBy, createdAt, updatedAt, status, maxAthletes, maxGuides, notes
- Security: All authenticated users can read; only admins can write

### signups/

- Document ID: Auto-generated
- Fields: runId, userId, role, timestamp, status, notes
- Security: Users can read/write their own sign-ups; admins can read/write all

### pairings/

- Document ID: Auto-generated
- Fields: runId, athleteId, guideId, createdBy, createdAt, notes, status
- Security: All authenticated users can read; only admins can write

## Authentication & Authorization

### Authentication Flow

1. User signs in with email/password via Firebase Authentication
2. On successful authentication, user data is fetched from Firestore `users` collection
3. User data stored in Pinia `auth` store
4. Router guards check authentication status and role for route access

### Authorization Rules

- **Athletes & Guides**: Can access `/runs` route
- **Admins**: Can access `/admin/*` routes
- **Unauthenticated**: Redirected to `/login`
- **Authenticated on login page**: Redirected to appropriate dashboard

### Route Guards

- `requiresAuth`: Boolean - Route requires authentication
- `roles`: Array - Allowed roles for route access
- Automatic redirects based on authentication status and role

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

1. **RunsListView** (`/runs`)
   - List of upcoming runs
   - Sign-up functionality
   - Filtering and sorting (future)
   - Accessible to athletes and guides

### Admin Pages

1. **AdminDashboard** (`/admin`)
   - Quick stats overview
   - Quick action cards
   - Recent activity feed

2. **RunsView** (`/admin/runs`)
   - List all runs
   - Create new run
   - Edit existing runs
   - Delete runs
   - View sign-ups per run

3. **UsersView** (`/admin/users`)
   - List all users
   - Create new user (invite-only)
   - Edit user profiles
   - Assign roles

4. **PairingView** (`/admin/pairings`)
   - Select run to pair for
   - View athletes and guides signed up
   - Manual pairing interface (keyboard accessible)
   - View existing pairings
   - Unpair functionality

## Implementation Plan

### Phase 1: Foundation ✅

- [x] Firebase setup and configuration
- [x] Data models and TypeScript interfaces
- [x] Authentication system with Pinia store
- [x] Accessible UI component library
- [x] Accessibility features (theme, text sizing)
- [x] Router setup with guards
- [x] Login view

### Phase 2: Core Features

- [ ] Runs list view (athletes/guides)
- [ ] Sign-up functionality
- [ ] Admin dashboard
- [ ] Run management (create, edit, delete)
- [ ] User management (create, edit)

### Phase 3: Pairing System

- [ ] Pairing interface
- [ ] Keyboard-accessible pairing workflow
- [ ] Pairing management (view, edit, delete)

### Phase 4: Polish & Testing

- [ ] Error handling and validation
- [ ] Loading states
- [ ] Form validation
- [ ] Accessibility testing
- [ ] Screen reader testing
- [ ] Keyboard navigation testing

## Security Considerations

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Admins can read all users
    match /users/{userId} {
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Runs are readable by all authenticated users
    match /runs/{runId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Signups are readable by the user who created them and admins
    match /signups/{signupId} {
      allow read, write: if request.auth != null &&
        (resource.data.userId == request.auth.uid ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }

    // Pairings are readable by all authenticated users, writable by admins
    match /pairings/{pairingId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Authentication Security

- Invite-only registration (admins create accounts)
- Email/password authentication via Firebase
- Role-based access control
- Secure token management by Firebase

## Testing Strategy

### Unit Tests

- Store logic (auth, accessibility)
- Utility functions
- Component logic

### Integration Tests

- Authentication flow
- Firestore operations
- Router navigation

### E2E Tests

- User sign-in flow
- Run sign-up flow
- Admin pairing flow
- Accessibility features

### Accessibility Testing

- Screen reader testing (NVDA, JAWS, VoiceOver)
- Keyboard navigation testing
- Color contrast validation
- WCAG compliance audit

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
