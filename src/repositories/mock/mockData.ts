import type { Location, Organization, Run, SignUp, User } from '@/types/models'

type SeedData = {
  organizations: Organization[]
  locations: Location[]
  users: User[]
  runs: Run[]
  signUps: SignUp[]
}

/**
 * Get a date offset from the current real date.
 * Used for creating mock data relative to "today".
 */
function daysFromNow(offsetDays: number): Date {
  const now = new Date()
  return new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000)
}

/**
 * Get the next Monday from the current date.
 * If today is Monday, returns today.
 */
function getNextMonday(): Date {
  const now = new Date()
  const dayOfWeek = now.getDay()
  // Sunday = 0, Monday = 1, ..., Saturday = 6
  // Calculate days until next Monday (or today if Monday)
  const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek
  const nextMonday = new Date(now)
  nextMonday.setDate(now.getDate() + daysUntilMonday)
  // Set time to 8:00 AM for run-1
  nextMonday.setHours(8, 0, 0, 0)
  return nextMonday
}

/**
 * Get the Saturday after a given date.
 */
function getSaturdayAfter(date: Date): Date {
  const saturday = new Date(date)
  const dayOfWeek = saturday.getDay()
  // Calculate days until Saturday (Saturday = 6)
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7
  saturday.setDate(saturday.getDate() + daysUntilSaturday)
  // Set time to 9:00 AM for run-2
  saturday.setHours(9, 0, 0, 0)
  return saturday
}

/**
 * Get the Monday after a given date (exactly 7 days later if date is a Monday).
 */
function getMondayAfter(date: Date): Date {
  const nextMonday = new Date(date)
  // Add 7 days to get to the next Monday
  nextMonday.setDate(date.getDate() + 7)
  // Preserve the same time as the input date
  return nextMonday
}

// Calculate run dates relative to the current system date
// First run: Monday after user logs in
const run1Date = getNextMonday()
// Second run: Saturday after first run
const run2Date = getSaturdayAfter(run1Date)
// Third run: Monday after first run (one week later)
const run3Date = getMondayAfter(run1Date)

export const seedData: SeedData = {
  organizations: [
    {
      id: 'org-denver',
      name: 'Achilles Denver',
      description: 'Denver chapter of Achilles International.',
      adminIds: ['user-admin-1'],
      memberIds: [
        'user-admin-1',
        'user-guide-1',
        'user-athlete-1',
        'user-guide-2',
        'user-guide-3',
        'user-guide-4',
        'user-athlete-2',
        'user-athlete-3',
        'user-athlete-4',
      ],
      createdAt: daysFromNow(-15),
      settings: {
        defaultMaxAthletes: 10,
        defaultMaxGuides: 10,
        timezone: 'America/Denver',
      },
    },
  ],
  locations: [
    {
      id: 'location-wash-park',
      organizationId: 'org-denver',
      name: 'Wash Park',
      address: '701 S Franklin St',
      city: 'Denver',
      state: 'CO',
      notes:
        'Meet at the Washington Park Rec Center. Athletes may run on two courses: the inner loop which is on road and is 2.3 miles, and the outer loop which is on trails and is 2.5 miles. Athletes commonly do one lap or two.',
      createdAt: daysFromNow(-15),
    },
    {
      id: 'location-river-trail',
      organizationId: 'org-denver',
      name: 'River Trail',
      address: 'Cherry Creek Trail',
      city: 'Denver',
      state: 'CO',
      notes: 'Paved trail along Cherry Creek',
      createdAt: daysFromNow(-15),
    },
  ],
  users: [
    {
      id: 'user-admin-1',
      email: 'admin@achilles.local',
      displayName: 'Admin Casey',
      role: 'guide',
      organizationIds: ['org-denver'],
      createdAt: daysFromNow(-4),
      profileDetails: {
        activities: ['run', 'walk'],
        pace: { minutes: 9, seconds: 0 },
        certifications: ['visually impaired guiding'],
      },
    },
    {
      id: 'user-guide-1',
      email: 'guide@achilles.local',
      displayName: 'Guide Riley',
      role: 'guide',
      organizationIds: ['org-denver'],
      createdAt: daysFromNow(-3),
      profileDetails: {
        activities: ['walk'],
        pace: { minutes: 12, seconds: 0 },
      },
    },
    {
      id: 'user-guide-2',
      email: 'guide2@achilles.local',
      displayName: 'Guide Alex',
      role: 'guide',
      organizationIds: ['org-denver'],
      createdAt: daysFromNow(-10),
      profileDetails: {
        activities: ['run', 'walk'],
        pace: { minutes: 10, seconds: 0 },
        certifications: ['visually impaired guiding'],
      },
    },
    {
      id: 'user-guide-3',
      email: 'guide3@achilles.local',
      displayName: 'Guide Jordan',
      role: 'guide',
      organizationIds: ['org-denver'],
      createdAt: daysFromNow(-8),
      profileDetails: {
        activities: ['run'],
        pace: { minutes: 8, seconds: 0 },
        certifications: ['visually impaired guiding'],
      },
    },
    {
      id: 'user-guide-4',
      email: 'guide4@achilles.local',
      displayName: 'Guide Sam',
      role: 'guide',
      organizationIds: ['org-denver'],
      createdAt: daysFromNow(-6),
      profileDetails: {
        activities: ['walk', 'roll'],
        pace: { minutes: 15, seconds: 0 },
      },
    },
    {
      id: 'user-athlete-1',
      email: 'athlete@achilles.local',
      displayName: 'Athlete Morgan',
      role: 'athlete',
      organizationIds: ['org-denver'],
      createdAt: daysFromNow(-2),
      profileDetails: {
        activities: ['walk'],
        pace: { minutes: 15, seconds: 0 },
      },
    },
    {
      id: 'user-athlete-2',
      email: 'athlete2@achilles.local',
      displayName: 'Athlete Taylor',
      role: 'athlete',
      organizationIds: ['org-denver'],
      createdAt: daysFromNow(-7),
      profileDetails: {
        activities: ['run'],
        pace: { minutes: 9, seconds: 0 },
        disabilityType: 'Visual impairment',
        assistanceNeeded: 'Guide needed for outdoor runs',
      },
    },
    {
      id: 'user-athlete-3',
      email: 'athlete3@achilles.local',
      displayName: 'Athlete Jamie',
      role: 'athlete',
      organizationIds: ['org-denver'],
      createdAt: daysFromNow(-9),
      profileDetails: {
        activities: ['walk'],
        pace: { minutes: 18, seconds: 0 },
        disabilityType: 'Mobility impairment',
        assistanceNeeded: 'Slower pace preferred',
      },
    },
    {
      id: 'user-athlete-4',
      email: 'athlete4@achilles.local',
      displayName: 'Athlete Pat',
      role: 'athlete',
      organizationIds: ['org-denver'],
      createdAt: daysFromNow(-5),
      profileDetails: {
        activities: ['run', 'walk'],
        pace: { minutes: 7, seconds: 0 },
        paceRange: { min: 6, max: 9 },
        disabilityType: 'Hearing impairment',
      },
    },
  ],
  runs: [
    {
      id: 'run-1',
      organizationId: 'org-denver',
      date: run1Date,
      time: '18:00',
      locationId: 'location-wash-park',
      description: 'Monday night run at Wash Park.',
      createdBy: 'user-admin-1',
      createdAt: daysFromNow(-1),
      status: 'upcoming',
      pairings: {
        // Athlete 1 paired with one guide
        'user-athlete-1': {
          guides: ['user-guide-1'],
          athletes: [],
        },
        // Athlete 2 paired with two guides (multiple guides scenario)
        'user-athlete-2': {
          guides: ['user-guide-2', 'user-admin-1'],
          athletes: [],
        },
        // Athlete 3 paired with athlete 4 (athlete-athlete pairing scenario)
        // This demonstrates the case where multiple athletes share one guide
        'user-athlete-3': {
          guides: ['user-guide-3'],
          athletes: ['user-athlete-4'],
        },
        // Note: user-athlete-4 does not have their own entry since they're paired with athlete-3
      },
    },
    {
      id: 'run-2',
      organizationId: 'org-denver',
      date: run2Date,
      time: '09:00',
      locationId: 'location-river-trail',
      description: 'Saturday morning run along the river.',
      createdBy: 'user-admin-1',
      createdAt: daysFromNow(-2),
      status: 'upcoming',
      pairings: {
        // Example of athlete-athlete pairing without a guide
        'user-athlete-1': {
          guides: [],
          athletes: ['user-athlete-2'],
        },
        // Note: user-athlete-2 does not have their own entry since they're paired with athlete-1
      },
    },
    {
      id: 'run-3',
      organizationId: 'org-denver',
      date: run3Date,
      time: '18:00',
      locationId: 'location-wash-park',
      description: 'Monday night run at Wash Park.',
      createdBy: 'user-admin-1',
      createdAt: daysFromNow(-1),
      status: 'upcoming',
      pairings: {},
    },
  ],
  signUps: [
    // Run 1 sign-ups - Wash Park
    // Regular athletes (signing up for both runs)
    {
      id: 'signup-1',
      runId: 'run-1',
      userId: 'user-athlete-1',
      role: 'athlete',
      timestamp: daysFromNow(-1),
      status: 'yes',
      activity: 'walk', // user-athlete-1 only has 'walk' in their activities
    },
    {
      id: 'signup-2',
      runId: 'run-1',
      userId: 'user-athlete-2',
      role: 'athlete',
      timestamp: daysFromNow(-1),
      status: 'yes',
      activity: 'run', // user-athlete-2 only has 'run' in their activities
      pace: { minutes: 9, seconds: 0 }, // matches their profile pace
    },
    // One-time athletes for run 1
    {
      id: 'signup-3',
      runId: 'run-1',
      userId: 'user-athlete-3',
      role: 'athlete',
      timestamp: daysFromNow(-1),
      status: 'yes',
      activity: 'walk', // user-athlete-3 only has 'walk' in their activities
    },
    {
      id: 'signup-4',
      runId: 'run-1',
      userId: 'user-athlete-4',
      role: 'athlete',
      timestamp: daysFromNow(-1),
      status: 'maybe',
      activity: 'run/walk', // user-athlete-4 has ['run', 'walk'], using run/walk as middle ground
    },

    // Regular guides (signing up for both runs)
    {
      id: 'signup-5',
      runId: 'run-1',
      userId: 'user-guide-1',
      role: 'guide',
      timestamp: daysFromNow(-1),
      status: 'yes',
      activity: 'walk', // user-guide-1 only has 'walk' in their activities
    },
    {
      id: 'signup-6',
      runId: 'run-1',
      userId: 'user-guide-2',
      role: 'guide',
      timestamp: daysFromNow(-1),
      status: 'yes',
      activity: 'run', // user-guide-2 has ['run', 'walk'], choosing run
      pace: { minutes: 10, seconds: 0 }, // matches their profile pace
    },
    {
      id: 'signup-7',
      runId: 'run-1',
      userId: 'user-admin-1',
      role: 'guide',
      timestamp: daysFromNow(-1),
      status: 'yes',
      activity: 'run', // user-admin-1 has ['run', 'walk'], choosing run
      pace: { minutes: 9, seconds: 0 }, // matches their profile pace
    },
    // One-time guides for run 1
    {
      id: 'signup-8',
      runId: 'run-1',
      userId: 'user-guide-3',
      role: 'guide',
      timestamp: daysFromNow(-1),
      status: 'yes',
      activity: 'run', // user-guide-3 only has 'run' in their activities
      pace: { minutes: 8, seconds: 0 }, // matches their profile pace
    },

    // Run 2 sign-ups - River Trail
    // Regular athletes (both runs)
    {
      id: 'signup-9',
      runId: 'run-2',
      userId: 'user-athlete-1',
      role: 'athlete',
      timestamp: daysFromNow(-2),
      status: 'yes',
      activity: 'walk', // user-athlete-1 only has 'walk' in their activities
    },
    {
      id: 'signup-10',
      runId: 'run-2',
      userId: 'user-athlete-2',
      role: 'athlete',
      timestamp: daysFromNow(-2),
      status: 'maybe',
      activity: 'run', // user-athlete-2 only has 'run' in their activities
      pace: { minutes: 9, seconds: 30 }, // slightly slower pace than usual
    },
    // One-time athlete for run 2 only
    {
      id: 'signup-11',
      runId: 'run-2',
      userId: 'user-athlete-4',
      role: 'athlete',
      timestamp: daysFromNow(-2),
      status: 'yes',
      activity: 'run', // user-athlete-4 has ['run', 'walk'], choosing run for this trail run
      pace: { minutes: 7, seconds: 0 }, // matches their profile pace
    },

    // Regular guides (both runs)
    {
      id: 'signup-12',
      runId: 'run-2',
      userId: 'user-guide-1',
      role: 'guide',
      timestamp: daysFromNow(-2),
      status: 'yes',
      activity: 'walk', // user-guide-1 only has 'walk' in their activities
    },
    {
      id: 'signup-13',
      runId: 'run-2',
      userId: 'user-guide-2',
      role: 'guide',
      timestamp: daysFromNow(-2),
      status: 'yes',
      activity: 'run/walk', // user-guide-2 has ['run', 'walk'], using run/walk for variety
    },
    {
      id: 'signup-14',
      runId: 'run-2',
      userId: 'user-admin-1',
      role: 'guide',
      timestamp: daysFromNow(-2),
      status: 'yes',
      activity: 'walk', // user-admin-1 has ['run', 'walk'], choosing walk for this run
    },
  ],
}
