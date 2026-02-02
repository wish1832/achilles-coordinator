import type { Location, Organization, OrganizationInvite, Run, SignUp, User } from '@/types/models'
import { seedData } from './mockData'

export type CollectionName =
  | 'organizations'
  | 'locations'
  | 'users'
  | 'runs'
  | 'signups'
  | 'organizationInvites'

export const mockState = {
  organizations: [...seedData.organizations],
  locations: [...seedData.locations],
  users: [...seedData.users],
  runs: [...seedData.runs],
  signups: [...seedData.signUps],
  organizationInvites: [] as OrganizationInvite[],
}

let idCounter = 1000

export function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

export function clone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }
  return JSON.parse(JSON.stringify(value)) as T
}

export function getCollection<T>(collectionName: CollectionName): T[] {
  switch (collectionName) {
    case 'organizations':
      return mockState.organizations as T[]
    case 'locations':
      return mockState.locations as T[]
    case 'users':
      return mockState.users as T[]
    case 'runs':
      return mockState.runs as T[]
    case 'signups':
      return mockState.signups as T[]
    case 'organizationInvites':
      return mockState.organizationInvites as T[]
    default:
      return []
  }
}

export function setCollection<T>(collectionName: CollectionName, items: T[]): void {
  switch (collectionName) {
    case 'organizations':
      mockState.organizations = items as Organization[]
      break
    case 'locations':
      mockState.locations = items as Location[]
      break
    case 'users':
      mockState.users = items as User[]
      break
    case 'runs':
      mockState.runs = items as Run[]
      break
    case 'signups':
      mockState.signups = items as SignUp[]
      break
    case 'organizationInvites':
      mockState.organizationInvites = items as OrganizationInvite[]
      break
  }
}
