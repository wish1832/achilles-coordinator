# Achilles Run Coordinator

Achilles Run Coordinator is a web application for coordinating sign-ups for Achilles International running events.

## Quick Start

```bash
pnpm install
pnpm dev
```

## Local Firebase Emulator

Run the Firebase emulators in one terminal:

```bash
npx -y firebase-tools@latest emulators:start --project achilles-coordinator
```

Run the app against the emulators in another terminal:

```bash
pnpm dev:firebase
```

### Emulator Users

This app requires two records for a successful login:

- A Firebase Auth user in the Auth emulator
- A matching Firestore profile document at `users/{authUid}`

If the Auth user exists but the Firestore profile does not, login will fail with:

```text
User data not found. Please contact an administrator.
```

To create both records together, use:

```bash
pnpm emulator:user create \
  --email "alex@example.com" \
  --password "secret123" \
  --display-name "Alex Example" \
  --role guide
```

If the Auth emulator user already exists and only the Firestore profile is missing, use one of these:

```bash
pnpm emulator:user ensure-profile \
  --email "alex@example.com" \
  --password "secret123" \
  --display-name "Alex Example" \
  --role guide
```

The `ensure-profile` command signs into the Auth emulator first, then writes the
matching Firestore profile as that user. That is required because the current
Firestore rules only allow authenticated writes to `users/{uid}`.

Optional flags:

- `--organizations "orgA,orgB"` to pre-populate `organizationIds`
- `--phone "555-555-5555"` to seed `profileDetails.phone`

### Emulator Organizations

To bootstrap an organization for an existing emulator user, use:

```bash
pnpm emulator:organization create \
  --email "alex@example.com" \
  --password "secret123" \
  --name "Achilles Denver"
```

That script:

- signs in as the existing emulator user
- creates an `organizations/{id}` document with that user as the first admin and member
- updates the same user's `organizationIds` array to include the new organization

Optional flags:

- `--description "Tuesday and Saturday runs"`
- `--timezone "America/Denver"`
- `--default-max-athletes 20`
- `--default-max-guides 25`

### Emulator Locations

To create a location for an existing organization, use:

```bash
pnpm emulator:location create \
  --email "alex@example.com" \
  --password "secret123" \
  --organization-id "<org-id>" \
  --name "Washington Park"
```

That script signs in as the existing emulator user and creates a
`locations/{id}` document for the target organization. The signed-in user must
already be an admin of that organization.

Optional flags:

- `--address "701 S Franklin St"`
- `--city "Denver"`
- `--state "CO"`
- `--notes "Meet near the south lot"`
- `--latitude 39.7006 --longitude -104.9708`

### Why Emulator Users Disappear After Restart

By default, emulator data is in-memory. If you stop `firebase emulators:start` and restart it without import/export flags, Auth and Firestore data can be lost.

To persist emulator state between restarts, start the suite with an export directory:

```bash
npx -y firebase-tools@latest emulators:start \
  --project achilles-coordinator \
  --import ./.firebase-emulator-data \
  --export-on-exit ./.firebase-emulator-data
```

That keeps Auth emulator users and Firestore emulator documents across restarts by reloading the last exported snapshot on startup.

## Docs

- Design and domain specifics: `DESIGN.md`
- Style guidance: `style.md`
- Agent guidance: `CLAUDE.md`, `AGENTS.md`, etc depending on agent.
