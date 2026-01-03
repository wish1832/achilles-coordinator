import type { Organization, Pairing, Run, SignUp, User } from '@/types/models'

type SeedData = {
  organizations: Organization[]
  users: User[]
  runs: Run[]
  signUps: SignUp[]
  pairings: Pairing[]
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
      memberIds: ['user-admin-1', 'user-guide-1', 'user-athlete-1'],
      createdAt: daysFromNow(-5),
      settings: {
        defaultMaxAthletes: 8,
        defaultMaxGuides: 8,
        timezone: 'America/Denver',
      },
    },
  ],
  users: [
    {
      id: 'user-admin-1',
      email: 'admin@achilles.local',
      displayName: 'Admin Casey',
      role: 'guide',
      createdAt: daysFromNow(-4),
      profileDetails: {
        guideExperience: 'experienced',
      },
    },
    {
      id: 'user-guide-1',
      email: 'guide@achilles.local',
      displayName: 'Guide Riley',
      role: 'guide',
      createdAt: daysFromNow(-3),
      profileDetails: {
        guideExperience: 'new',
      },
    },
    {
      id: 'user-athlete-1',
      email: 'athlete@achilles.local',
      displayName: 'Athlete Morgan',
      role: 'athlete',
      createdAt: daysFromNow(-2),
      profileDetails: {
        experienceLevel: 'beginner',
      },
    },
  ],
  runs: [
    {
      id: 'run-1',
      date: daysFromNow(1),
      time: '08:00',
      location: 'City Park Loop',
      description: 'Easy pace run with coffee after.',
      createdBy: 'user-admin-1',
      createdAt: daysFromNow(-1),
      status: 'upcoming',
    },
    {
      id: 'run-2',
      date: daysFromNow(2),
      time: '09:00',
      location: 'River Trail',
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
  ],
  pairings: [
    {
      id: 'pairing-1',
      runId: 'run-1',
      athleteId: 'user-athlete-1',
      guideId: 'user-guide-1',
      createdBy: 'user-admin-1',
      createdAt: daysFromNow(-1),
      status: 'active',
    },
  ],
}

export { mockNow }
