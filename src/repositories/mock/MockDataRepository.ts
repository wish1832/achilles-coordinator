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
import { MockCollectionHelper } from './internal/MockCollectionHelper'

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
  private readonly collectionHelper = new MockCollectionHelper({
    getCollection,
    setCollection,
    clone,
    nextId,
  })
  async addDocument<T extends { id?: string }>(
    collectionName: string,
    data: Omit<T, 'id'>,
  ): Promise<string> {
    return this.collectionHelper.addDocument(collectionName as CollectionName, data)
  }

  async updateDocument<T extends { id: string }>(
    collectionName: string,
    id: string,
    data: Partial<Omit<T, 'id'>>,
  ): Promise<void> {
    return this.collectionHelper.updateDocument(collectionName as CollectionName, id, data)
  }

  async deleteDocument(collectionName: string, id: string): Promise<void> {
    return this.collectionHelper.deleteDocument(collectionName as CollectionName, id)
  }

  async getDocument<T extends { id: string }>(
    collectionName: string,
    id: string,
  ): Promise<T | null> {
    return this.collectionHelper.getDocument(collectionName as CollectionName, id)
  }

  async getDocuments<T extends { id: string }>(
    collectionName: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _constraints?: QueryConstraint[],
  ): Promise<T[]> {
    return this.collectionHelper.getDocuments(collectionName as CollectionName)
  }

  onCollectionChange<T extends { id: string }>(
    collectionName: string,
    callback: (docs: T[]) => void,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _constraints?: QueryConstraint[],
  ): Unsubscribe {
    return this.collectionHelper.onCollectionChange(collectionName as CollectionName, callback)
  }

  async createUser(userData: Omit<User, 'id'>): Promise<string> {
    const id = nextId('user')
    await this.collectionHelper.setDocument('users', id, userData)
    return id
  }

  async updateUser(id: string, userData: Partial<Omit<User, 'id'>>): Promise<void> {
    return this.collectionHelper.updateDocument('users', id, userData)
  }

  async getUser(id: string): Promise<User | null> {
    return this.collectionHelper.getDocument('users', id)
  }

  async getUsers(): Promise<User[]> {
    const users = await this.collectionHelper.getDocuments<User>('users')
    return users.sort((a, b) => a.displayName.localeCompare(b.displayName))
  }

  async createRun(runData: Omit<Run, 'id'>): Promise<string> {
    const id = nextId('run')
    await this.collectionHelper.setDocument('runs', id, runData)
    return id
  }

  async updateRun(id: string, runData: Partial<Omit<Run, 'id'>>): Promise<void> {
    return this.collectionHelper.updateDocument('runs', id, runData)
  }

  async deleteRun(id: string): Promise<void> {
    await this.collectionHelper.deleteDocument('runs', id)
  }

  async getRun(id: string): Promise<Run | null> {
    return this.collectionHelper.getDocument('runs', id)
  }

  async getRuns(): Promise<Run[]> {
    const runs = await this.collectionHelper.getDocuments<Run>('runs')
    return sortByDateAscending(runs)
  }

  async getUpcomingRuns(): Promise<Run[]> {
    const now = mockNow.getTime()
    const runs = await this.collectionHelper.getDocuments<Run>('runs')
    const upcoming = runs.filter((entry) => new Date(entry.date).getTime() >= now)
    return sortByDateAscending(upcoming)
  }

  async createSignUp(signUpData: Omit<SignUp, 'id'>): Promise<string> {
    const id = nextId('signup')
    await this.collectionHelper.setDocument('signups', id, signUpData)
    return id
  }

  async updateSignUp(id: string, signUpData: Partial<Omit<SignUp, 'id'>>): Promise<void> {
    return this.collectionHelper.updateDocument('signups', id, signUpData)
  }

  async deleteSignUp(id: string): Promise<void> {
    await this.collectionHelper.deleteDocument('signups', id)
  }

  async getSignUpsForRun(runId: string): Promise<SignUp[]> {
    const signups = await this.collectionHelper.getDocuments<SignUp>('signups')
    const entries = signups.filter((entry) => entry.runId === runId)
    return sortByDateDescending(entries)
  }

  async getUserSignUps(userId: string): Promise<SignUp[]> {
    const signups = await this.collectionHelper.getDocuments<SignUp>('signups')
    const entries = signups.filter((entry) => entry.userId === userId)
    return sortByDateDescending(entries)
  }

  async createOrganization(organizationData: Omit<Organization, 'id'>): Promise<string> {
    const id = nextId('org')
    await this.collectionHelper.setDocument('organizations', id, organizationData)
    return id
  }

  async updateOrganization(
    id: string,
    organizationData: Partial<Omit<Organization, 'id'>>,
  ): Promise<void> {
    return this.collectionHelper.updateDocument('organizations', id, organizationData)
  }

  async deleteOrganization(id: string): Promise<void> {
    await this.collectionHelper.deleteDocument('organizations', id)
  }

  async getOrganization(id: string): Promise<Organization | null> {
    return this.collectionHelper.getDocument('organizations', id)
  }

  async getOrganizations(): Promise<Organization[]> {
    const organizations = await this.collectionHelper.getDocuments<Organization>('organizations')
    return organizations.sort((a, b) => a.name.localeCompare(b.name))
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    const organizations = await this.collectionHelper.getDocuments<Organization>('organizations')
    return organizations.filter((org) => org.memberIds.includes(userId))
  }

  async getUserAdminOrganizations(userId: string): Promise<Organization[]> {
    const organizations = await this.collectionHelper.getDocuments<Organization>('organizations')
    return organizations.filter((org) => org.adminIds.includes(userId))
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
    await this.collectionHelper.setDocument('locations', id, locationData)
    return id
  }

  async updateLocation(
    id: string,
    locationData: Partial<Omit<Location, 'id'>>,
  ): Promise<void> {
    return this.collectionHelper.updateDocument('locations', id, locationData)
  }

  async deleteLocation(id: string): Promise<void> {
    await this.collectionHelper.deleteDocument('locations', id)
  }

  async getLocation(id: string): Promise<Location | null> {
    return this.collectionHelper.getDocument('locations', id)
  }

  async getLocationsForOrganization(organizationId: string): Promise<Location[]> {
    const locations = await this.collectionHelper.getDocuments<Location>('locations')
    const entries = locations.filter((entry) => entry.organizationId === organizationId)
    return entries.sort((a, b) => a.name.localeCompare(b.name))
  }
}

export const mockDataRepository = new MockDataRepository()
