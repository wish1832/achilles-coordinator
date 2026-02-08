# Style Guidance

This document captures the UI and content style guidance derived from the project README and CLAUDE guidance. Use it when shaping UI, copy, and interaction behavior.

Agents: read this file for style guidance before making UI changes.

## Accessibility First

- Treat WCAG 2.1 AA compliance as a baseline, not a stretch goal.
- All interactions must be fully keyboard accessible with visible focus states.
- Use semantic HTML first, then ARIA where needed.
- Maintain sufficient color contrast, including in high contrast mode.
- Respect reduced motion preferences by limiting or disabling animations.
- Support multiple text sizes without breaking layouts.
- Test with keyboard navigation (Tab, Enter, Space, Escape)
- Ensure focus indicators are visible
- Support screen readers with descriptive labels
- Respect user preferences from accessibility store

## Interaction Patterns

- Make focus order predictable and logical.
- Provide clear success and error feedback for form actions.
- Prefer simple, step-by-step flows over complex, multi-panel layouts.
- Use plain language labels for form fields and actions.

## Visual Language

- Favor clarity and legibility over decorative styling.
- Use CSS custom properties for theming and accessibility settings.
- Ensure components scale well across desktop and mobile.
- Keep component structure consistent with existing UI library patterns.

## Content Tone

- Write in a calm, supportive tone that is clear and action-oriented.
- Use descriptive button labels (e.g., "Create Run" instead of "Submit").
- Avoid jargon where possible; prefer everyday language.

## Error Reporting

- When informing the users, use the following pattern: "Unable to {replace with attempted action}. Please try again and contact us if the problem persists". Don't show end users the error, but do log it to the console.

## Naming of functions and variables

- When making changes, look for asymmetric naming patterns in functions. Report these to the user and ask for re-naming to address this.

## Other

- Please avoid the term "buddy" when describing athletes that have been paired with other athletes.
