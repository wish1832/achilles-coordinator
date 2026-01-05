import type { QueryConstraint, Unsubscribe } from 'firebase/firestore'
import type { Location, Organization, Run, SignUp, User } from '@/types/models'
import type { IDataRepository } from '@/repositories/interfaces/IDataRepository'
import { mockNow } from './mockData'
import {
  clone,
  getCollection,
  mockState,
  nextId,
  setCollection,
  type CollectionName,
} from './mockState'
import { MockUserRepository } from './MockUserRepository'

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
  private readonly userRepository = new MockUserRepository()
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
    return this.userRepository.createUserWithGeneratedId(userData)
  }

  async updateUser(id: string, userData: Partial<Omit<User, 'id'>>): Promise<void> {
    return this.userRepository.updateUser(id, userData)
  }

  async getUser(id: string): Promise<User | null> {
    return this.userRepository.getUser(id)
  }

  async getUsers(): Promise<User[]> {
    return this.userRepository.getUsers()
  }

  async createRun(runData: Omit<Run, 'id'>): Promise<string> {
    const id = nextId('run')
    mockState.runs.push({ ...clone(runData), id })
    return id
  }

  async updateRun(id: string, runData: Partial<Omit<Run, 'id'>>): Promise<void> {
    const index = mockState.runs.findIndex((entry) => entry.id === id)
    if (index === -1) {
      throw new Error(`Run ${id} not found`)
    }
    mockState.runs[index] = { ...mockState.runs[index], ...clone(runData) } as Run
  }

  async deleteRun(id: string): Promise<void> {
    mockState.runs = mockState.runs.filter((entry) => entry.id !== id)
  }

  async getRun(id: string): Promise<Run | null> {
    const run = mockState.runs.find((entry) => entry.id === id)
    return run ? clone(run) : null
  }

  async getRuns(): Promise<Run[]> {
    return sortByDateAscending(clone(mockState.runs))
  }

  async getUpcomingRuns(): Promise<Run[]> {
    const now = mockNow.getTime()
    const upcoming = mockState.runs.filter((entry) => new Date(entry.date).getTime() >= now)
    return sortByDateAscending(clone(upcoming))
  }

  async createSignUp(signUpData: Omit<SignUp, 'id'>): Promise<string> {
    const id = nextId('signup')
    mockState.signups.push({ ...clone(signUpData), id })
    return id
  }

  async updateSignUp(id: string, signUpData: Partial<Omit<SignUp, 'id'>>): Promise<void> {
    const index = mockState.signups.findIndex((entry) => entry.id === id)
    if (index === -1) {
      throw new Error(`SignUp ${id} not found`)
    }
    mockState.signups[index] = { ...mockState.signups[index], ...clone(signUpData) } as SignUp
  }

  async deleteSignUp(id: string): Promise<void> {
    mockState.signups = mockState.signups.filter((entry) => entry.id !== id)
  }

  async getSignUpsForRun(runId: string): Promise<SignUp[]> {
    const entries = mockState.signups.filter((entry) => entry.runId === runId)
    return sortByDateDescending(clone(entries))
  }

  async getUserSignUps(userId: string): Promise<SignUp[]> {
    const entries = mockState.signups.filter((entry) => entry.userId === userId)
    return sortByDateDescending(clone(entries))
  }

  async createOrganization(organizationData: Omit<Organization, 'id'>): Promise<string> {
    const id = nextId('org')
    mockState.organizations.push({ ...clone(organizationData), id })
    return id
  }

  async updateOrganization(
    id: string,
    organizationData: Partial<Omit<Organization, 'id'>>,
  ): Promise<void> {
    const index = mockState.organizations.findIndex((entry) => entry.id === id)
    if (index === -1) {
      throw new Error(`Organization ${id} not found`)
    }
    mockState.organizations[index] = {
      ...mockState.organizations[index],
      ...clone(organizationData),
    } as Organization
  }

  async deleteOrganization(id: string): Promise<void> {
    mockState.organizations = mockState.organizations.filter((entry) => entry.id !== id)
  }

  async getOrganization(id: string): Promise<Organization | null> {
    const organization = mockState.organizations.find((entry) => entry.id === id)
    return organization ? clone(organization) : null
  }

  async getOrganizations(): Promise<Organization[]> {
    return clone(mockState.organizations).sort((a, b) => a.name.localeCompare(b.name))
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    return clone(mockState.organizations.filter((org) => org.memberIds.includes(userId)))
  }

  async getUserAdminOrganizations(userId: string): Promise<Organization[]> {
    return clone(mockState.organizations.filter((org) => org.adminIds.includes(userId)))
  }

  async addOrganizationMember(organizationId: string, userId: string): Promise<void> {
    const organization = mockState.organizations.find((entry) => entry.id === organizationId)
    if (!organization) {
      throw new Error(`Organization ${organizationId} not found`)
    }
    if (!organization.memberIds.includes(userId)) {
      organization.memberIds.push(userId)
    }
  }

  async removeOrganizationMember(organizationId: string, userId: string): Promise<void> {
    const organization = mockState.organizations.find((entry) => entry.id === organizationId)
    if (!organization) {
      throw new Error(`Organization ${organizationId} not found`)
    }
    organization.memberIds = organization.memberIds.filter((id) => id !== userId)
    organization.adminIds = organization.adminIds.filter((id) => id !== userId)
  }

  async addOrganizationAdmin(organizationId: string, userId: string): Promise<void> {
    const organization = mockState.organizations.find((entry) => entry.id === organizationId)
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
    const organization = mockState.organizations.find((entry) => entry.id === organizationId)
    if (!organization) {
      throw new Error(`Organization ${organizationId} not found`)
    }
    organization.adminIds = organization.adminIds.filter((id) => id !== userId)
  }

  async createLocation(locationData: Omit<Location, 'id'>): Promise<string> {
    const id = nextId('location')
    mockState.locations.push({ ...clone(locationData), id })
    return id
  }

  async updateLocation(
    id: string,
    locationData: Partial<Omit<Location, 'id'>>,
  ): Promise<void> {
    const index = mockState.locations.findIndex((entry) => entry.id === id)
    if (index === -1) {
      throw new Error(`Location ${id} not found`)
    }
    mockState.locations[index] = { ...mockState.locations[index], ...clone(locationData) } as Location
  }

  async deleteLocation(id: string): Promise<void> {
    mockState.locations = mockState.locations.filter((entry) => entry.id !== id)
  }

  async getLocation(id: string): Promise<Location | null> {
    const location = mockState.locations.find((entry) => entry.id === id)
    return location ? clone(location) : null
  }

  async getLocationsForOrganization(organizationId: string): Promise<Location[]> {
    const entries = mockState.locations.filter((entry) => entry.organizationId === organizationId)
    return clone(entries).sort((a, b) => a.name.localeCompare(b.name))
  }
}

export const mockDataRepository = new MockDataRepository()
