import type { QueryConstraint, Unsubscribe } from 'firebase/firestore'
import type {
  Organization,
  Pairing,
  Run,
  SignUp,
  User,
} from '@/types/models'
import type { IDataRepository } from '@/repositories/interfaces/IDataRepository'
import { mockNow, seedData } from './mockData'

type CollectionName =
  | 'organizations'
  | 'users'
  | 'runs'
  | 'signups'
  | 'pairings'

const state = {
  organizations: [...seedData.organizations],
  users: [...seedData.users],
  runs: [...seedData.runs],
  signups: [...seedData.signUps],
  pairings: [...seedData.pairings],
}

let idCounter = 1000

function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

function clone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }
  return JSON.parse(JSON.stringify(value)) as T
}

function getCollection<T>(collectionName: CollectionName): T[] {
  switch (collectionName) {
    case 'organizations':
      return state.organizations as T[]
    case 'users':
      return state.users as T[]
    case 'runs':
      return state.runs as T[]
    case 'signups':
      return state.signups as T[]
    case 'pairings':
      return state.pairings as T[]
    default:
      return []
  }
}

function setCollection<T>(collectionName: CollectionName, items: T[]): void {
  switch (collectionName) {
    case 'organizations':
      state.organizations = items as Organization[]
      break
    case 'users':
      state.users = items as User[]
      break
    case 'runs':
      state.runs = items as Run[]
      break
    case 'signups':
      state.signups = items as SignUp[]
      break
    case 'pairings':
      state.pairings = items as Pairing[]
      break
  }
}

function sortByDateAscending<T extends { date?: Date }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0
    const bTime = b.date ? new Date(b.date).getTime() : 0
    return aTime - bTime
  })
}

function sortByDateDescending<T extends { timestamp?: Date; createdAt?: Date }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aTime = a.timestamp
      ? new Date(a.timestamp).getTime()
      : a.createdAt
        ? new Date(a.createdAt).getTime()
        : 0
    const bTime = b.timestamp
      ? new Date(b.timestamp).getTime()
      : b.createdAt
        ? new Date(b.createdAt).getTime()
        : 0
    return bTime - aTime
  })
}

export class MockDataRepository implements IDataRepository {
  async addDocument<T extends { id?: string }>(
    collectionName: string,
    data: Omit<T, 'id'>,
  ): Promise<string> {
    const id = nextId(collectionName)
    const items = getCollection<T>(collectionName as CollectionName)
    items.push({ ...clone(data), id } as T)
    return id
  }

  async updateDocument<T extends { id: string }>(
    collectionName: string,
    id: string,
    data: Partial<Omit<T, 'id'>>,
  ): Promise<void> {
    const items = getCollection<T>(collectionName as CollectionName)
    const index = items.findIndex((entry) => entry.id === id)
    if (index === -1) {
      throw new Error(`Document ${id} not found in ${collectionName}`)
    }
    // Merge the partial update with the existing item
    // Type assertion is needed because Partial makes fields optional
    items[index] = { ...items[index], ...clone(data) } as T
  }

  async deleteDocument(collectionName: string, id: string): Promise<void> {
    const items = getCollection<{ id: string }>(collectionName as CollectionName)
    setCollection(
      collectionName as CollectionName,
      items.filter((entry) => entry.id !== id),
    )
  }

  async getDocument<T extends { id: string }>(
    collectionName: string,
    id: string,
  ): Promise<T | null> {
    const items = getCollection<T>(collectionName as CollectionName)
    const item = items.find((entry) => entry.id === id)
    return item ? clone(item) : null
  }

  async getDocuments<T extends { id: string }>(
    collectionName: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _constraints?: QueryConstraint[],
  ): Promise<T[]> {
    const items = getCollection<T>(collectionName as CollectionName)
    return clone(items)
  }

  onCollectionChange<T extends { id: string }>(
    collectionName: string,
    callback: (docs: T[]) => void,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _constraints?: QueryConstraint[],
  ): Unsubscribe {
    void this.getDocuments<T>(collectionName).then(callback)
    return () => {}
  }

  async createUser(userData: Omit<User, 'id'>): Promise<string> {
    const id = nextId('user')
    state.users.push({ ...clone(userData), id })
    return id
  }

  async updateUser(id: string, userData: Partial<Omit<User, 'id'>>): Promise<void> {
    const index = state.users.findIndex((entry) => entry.id === id)
    if (index === -1) {
      throw new Error(`User ${id} not found`)
    }
    state.users[index] = { ...state.users[index], ...clone(userData) } as User
  }

  async getUser(id: string): Promise<User | null> {
    const user = state.users.find((entry) => entry.id === id)
    return user ? clone(user) : null
  }

  async getUsers(): Promise<User[]> {
    return clone(state.users).sort((a, b) => a.displayName.localeCompare(b.displayName))
  }

  async createRun(runData: Omit<Run, 'id'>): Promise<string> {
    const id = nextId('run')
    state.runs.push({ ...clone(runData), id })
    return id
  }

  async updateRun(id: string, runData: Partial<Omit<Run, 'id'>>): Promise<void> {
    const index = state.runs.findIndex((entry) => entry.id === id)
    if (index === -1) {
      throw new Error(`Run ${id} not found`)
    }
    state.runs[index] = { ...state.runs[index], ...clone(runData) } as Run
  }

  async deleteRun(id: string): Promise<void> {
    state.runs = state.runs.filter((entry) => entry.id !== id)
  }

  async getRun(id: string): Promise<Run | null> {
    const run = state.runs.find((entry) => entry.id === id)
    return run ? clone(run) : null
  }

  async getRuns(): Promise<Run[]> {
    return sortByDateAscending(clone(state.runs))
  }

  async getUpcomingRuns(): Promise<Run[]> {
    const now = mockNow.getTime()
    const upcoming = state.runs.filter((entry) => new Date(entry.date).getTime() >= now)
    return sortByDateAscending(clone(upcoming))
  }

  async createSignUp(signUpData: Omit<SignUp, 'id'>): Promise<string> {
    const id = nextId('signup')
    state.signups.push({ ...clone(signUpData), id })
    return id
  }

  async updateSignUp(id: string, signUpData: Partial<Omit<SignUp, 'id'>>): Promise<void> {
    const index = state.signups.findIndex((entry) => entry.id === id)
    if (index === -1) {
      throw new Error(`SignUp ${id} not found`)
    }
    state.signups[index] = { ...state.signups[index], ...clone(signUpData) } as SignUp
  }

  async deleteSignUp(id: string): Promise<void> {
    state.signups = state.signups.filter((entry) => entry.id !== id)
  }

  async getSignUpsForRun(runId: string): Promise<SignUp[]> {
    const entries = state.signups.filter((entry) => entry.runId === runId)
    return sortByDateDescending(clone(entries))
  }

  async getUserSignUps(userId: string): Promise<SignUp[]> {
    const entries = state.signups.filter((entry) => entry.userId === userId)
    return sortByDateDescending(clone(entries))
  }

  async createPairing(pairingData: Omit<Pairing, 'id'>): Promise<string> {
    const id = nextId('pairing')
    state.pairings.push({ ...clone(pairingData), id })
    return id
  }

  async updatePairing(
    id: string,
    pairingData: Partial<Omit<Pairing, 'id'>>,
  ): Promise<void> {
    const index = state.pairings.findIndex((entry) => entry.id === id)
    if (index === -1) {
      throw new Error(`Pairing ${id} not found`)
    }
    state.pairings[index] = { ...state.pairings[index], ...clone(pairingData) } as Pairing
  }

  async deletePairing(id: string): Promise<void> {
    state.pairings = state.pairings.filter((entry) => entry.id !== id)
  }

  async getPairingsForRun(runId: string): Promise<Pairing[]> {
    const entries = state.pairings.filter((entry) => entry.runId === runId)
    return sortByDateDescending(clone(entries))
  }

  async createOrganization(organizationData: Omit<Organization, 'id'>): Promise<string> {
    const id = nextId('org')
    state.organizations.push({ ...clone(organizationData), id })
    return id
  }

  async updateOrganization(
    id: string,
    organizationData: Partial<Omit<Organization, 'id'>>,
  ): Promise<void> {
    const index = state.organizations.findIndex((entry) => entry.id === id)
    if (index === -1) {
      throw new Error(`Organization ${id} not found`)
    }
    state.organizations[index] = {
      ...state.organizations[index],
      ...clone(organizationData),
    } as Organization
  }

  async deleteOrganization(id: string): Promise<void> {
    state.organizations = state.organizations.filter((entry) => entry.id !== id)
  }

  async getOrganization(id: string): Promise<Organization | null> {
    const organization = state.organizations.find((entry) => entry.id === id)
    return organization ? clone(organization) : null
  }

  async getOrganizations(): Promise<Organization[]> {
    return clone(state.organizations).sort((a, b) => a.name.localeCompare(b.name))
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    return clone(state.organizations.filter((org) => org.memberIds.includes(userId)))
  }

  async getUserAdminOrganizations(userId: string): Promise<Organization[]> {
    return clone(state.organizations.filter((org) => org.adminIds.includes(userId)))
  }

  async addOrganizationMember(organizationId: string, userId: string): Promise<void> {
    const organization = state.organizations.find((entry) => entry.id === organizationId)
    if (!organization) {
      throw new Error(`Organization ${organizationId} not found`)
    }
    if (!organization.memberIds.includes(userId)) {
      organization.memberIds.push(userId)
    }
  }

  async removeOrganizationMember(organizationId: string, userId: string): Promise<void> {
    const organization = state.organizations.find((entry) => entry.id === organizationId)
    if (!organization) {
      throw new Error(`Organization ${organizationId} not found`)
    }
    organization.memberIds = organization.memberIds.filter((id) => id !== userId)
    organization.adminIds = organization.adminIds.filter((id) => id !== userId)
  }

  async addOrganizationAdmin(organizationId: string, userId: string): Promise<void> {
    const organization = state.organizations.find((entry) => entry.id === organizationId)
    if (!organization) {
      throw new Error(`Organization ${organizationId} not found`)
    }
    if (!organization.memberIds.includes(userId)) {
      organization.memberIds.push(userId)
    }
    if (!organization.adminIds.includes(userId)) {
      organization.adminIds.push(userId)
    }
  }

  async removeOrganizationAdmin(organizationId: string, userId: string): Promise<void> {
    const organization = state.organizations.find((entry) => entry.id === organizationId)
    if (!organization) {
      throw new Error(`Organization ${organizationId} not found`)
    }
    organization.adminIds = organization.adminIds.filter((id) => id !== userId)
  }
}

export const mockDataRepository = new MockDataRepository()
