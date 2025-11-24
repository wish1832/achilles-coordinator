Entities: user, run, organization, etc.

## Entities

### Organization

- The Achilles chapter or group hosting runs.
- Currently "Achilles Denver" and "Achilles Boulder".
- Each organization has at least one admin
- Admins can manage all of the runs in the organization
- One-to-many relationship between organizations and runs
- V2 implementation: a table of notes per user visible only to admins
  - For example:
    - Notes on an athlete (i.e. this athlete does not wish to go with this guide for this reason)
    - Notes on a guide that are only visible to admins (i.e. admins record that this person is best able to guide athletes)
  - Notes are linked to users using the user ID

### User

- Data per user
  - ID (user UID)
  - Role: Guide, or athlete
  - Admin: Whether or not user is an admin: "flag" on the user profile
    - Guides can also be admins
    - Athletes can also be admins
  - Activities (walk, run, roll)
  - For running
    - Preferred pace
    - Pace range
  - Notes
    - Athlete notes to be shared with admins only

### Run

- Single event hosted by one organization
- Has the following info:
  - ID
  - Date
  - Time
  - Location
  - Participants
    - Athletes
    - Guides
    - Pairings
      - JSON object with the UID of each athlete and the guides paired to that athlete
