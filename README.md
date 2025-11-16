# Achilles Run Coordinator

A web application for coordinating sign-ups for Achilles International running events, where athletes with disabilities are paired with able-bodied guides. Built with Vue 3, TypeScript, and Firebase, with comprehensive accessibility features.

## Features

- **User Management**: Invite-only registration system with role-based access (athlete, guide, admin)
- **Run Coordination**: Create and manage running events with sign-up capabilities
- **Pairing System**: Admin interface for pairing athletes with guides
- **Accessibility First**: Full screen reader support, keyboard navigation, high contrast mode, and text sizing
- **Real-time Updates**: Live data synchronization with Firebase Firestore
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

- **Frontend**: Vue 3 + TypeScript + Vite
- **State Management**: Pinia
- **Backend**: Firebase Authentication + Firestore
- **Styling**: CSS with CSS custom properties for theming
- **Accessibility**: WCAG 2.1 AA compliant

## Getting Started

### Prerequisites

- Node.js 20.19.0 or higher
- npm
- Firebase project with Authentication and Firestore enabled

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd achilles_coordinator
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Accessible UI component library
│   └── AccessibilityPanel.vue
├── firebase/           # Firebase configuration and services
├── stores/             # Pinia stores for state management
├── types/              # TypeScript type definitions
├── views/              # Page components
│   ├── admin/          # Admin-specific views
│   └── LoginView.vue
├── router/             # Vue Router configuration
└── App.vue
```

## Accessibility Features

This application is built with accessibility as a core principle:

- **Screen Reader Support**: All interactive elements have proper ARIA labels and roles
- **Keyboard Navigation**: Full keyboard accessibility with visible focus indicators
- **High Contrast Mode**: Toggle for users with low vision
- **Text Sizing**: Multiple text size options (small, medium, large, extra-large)
- **Reduced Motion**: Option to minimize animations for users with vestibular disorders
- **Semantic HTML**: Proper heading structure and landmark elements
- **Color Contrast**: WCAG AA compliant color combinations

### Keyboard Shortcuts

- `Alt + A`: Open accessibility settings panel
- `Tab`: Navigate between interactive elements
- `Enter/Space`: Activate buttons and links
- `Escape`: Close modals and panels

## User Roles

- **Athletes**: Can view and sign up for runs
- **Guides**: Can view and sign up for runs
- **Admins**: Full access to manage runs, users, and create pairings

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test:unit` - Run unit tests
- `npm run test:e2e:dev` - Run E2E tests in development
- `npm run lint` - Lint code with ESLint
- `npm run format` - Format code with Prettier

### Code Style

This project follows:

- Vue 3 Composition API with `<script setup>`
- TypeScript for type safety
- ESLint + Prettier for code formatting
- Accessibility-first component design
- Comprehensive commenting for maintainability

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper accessibility considerations
4. Test with screen readers and keyboard navigation
5. Submit a pull request

## License

This project is licensed under the MIT License.
