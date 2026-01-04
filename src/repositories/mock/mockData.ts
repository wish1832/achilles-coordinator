import type { Location, Organization, Run, SignUp, User } from '@/types/models'

type SeedData = {
  organizations: Organization[]
  locations: Location[]
  users: User[]
  runs: Run[]
  signUps: SignUp[]
}

const mockNow = new Date('2030-01-01T09:00:00Z')

function daysFromNow(offsetDays: number): Date {
  return new Date(mockNow.getTime() + offsetDays * 24 * 60 * 60 * 1000)
}

export const seedData: SeedData = {
  organizations: [
    {
      id: 'org-denver',
      name: 'Achilles Denver',
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
      id: 'location-city-park',
      organizationId: 'org-denver',
      name: 'City Park Loop',
      address: '2001 Colorado Blvd',
      city: 'Denver',
      state: 'CO',
      notes: 'Popular urban park with a 2.3 mile loop around the lake',
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
        preferredPace: 9,
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
        preferredPace: 12,
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
        preferredPace: 10,
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
        preferredPace: 8,
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
        preferredPace: 15,
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
        preferredPace: 15,
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
        preferredPace: 9,
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
        preferredPace: 18,
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
        preferredPace: 7,
        paceRange: { min: 6, max: 9 },
        disabilityType: 'Hearing impairment',
      },
    },
  ],
  runs: [
    {
      id: 'run-1',
      organizationId: 'org-denver',
      date: daysFromNow(1),
      time: '08:00',
      locationId: 'location-city-park',
      description: 'Easy pace run with coffee after.',
      createdBy: 'user-admin-1',
      createdAt: daysFromNow(-1),
      status: 'upcoming',
      pairings: {
        'user-athlete-1': 'user-guide-1',
      },
    },
    {
      id: 'run-2',
      organizationId: 'org-denver',
      date: daysFromNow(2),
      time: '09:00',
      locationId: 'location-river-trail',
      description: 'Scenic out-and-back along the river.',
      createdBy: 'user-admin-1',
      createdAt: daysFromNow(-2),
      status: 'upcoming',
    },
  ],
  signUps: [
    {
      id: 'signup-1',
      runId: 'run-1',
      userId: 'user-athlete-1',
      role: 'athlete',
      timestamp: daysFromNow(-1),
      status: 'active',
    },
    {
      id: 'signup-2',
      runId: 'run-1',
      userId: 'user-guide-1',
      role: 'guide',
      timestamp: daysFromNow(-1),
      status: 'active',
    },
  ],
}

export { mockNow }
