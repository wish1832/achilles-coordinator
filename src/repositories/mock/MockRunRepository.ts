import type { Run, SignUp } from '@/types/models'
import type { IRunRepository } from '@/repositories/interfaces/IRunRepository'
import { clone, getCollection, nextId, setCollection } from './mockState'
import { MockCollectionHelper } from './internal/MockCollectionHelper'

function sortByRunDateAscending(items: Run[]): Run[] {
  return [...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

function sortBySignUpTimestampDescending(items: SignUp[]): SignUp[] {
  return [...items].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
}

/**
 * Mock implementation of the run repository.
 * Mirrors Firebase behavior while remaining fully in-memory for tests.
 */
export class MockRunRepository implements IRunRepository {
  private readonly collectionHelper = new MockCollectionHelper({
    getCollection,
    setCollection,
    clone,
    nextId,
  })

  async createRun(runData: Omit<Run, 'id'>): Promise<string> {
    const id = nextId('run')
    await this.collectionHelper.setDocument('runs', id, runData)
    console.log('[MockRunRepository] Created run, all runs now:', getCollection('runs'))
    return id
  }

  async updateRun(id: string, runData: Partial<Omit<Run, 'id'>>): Promise<void> {
    await this.collectionHelper.updateDocument('runs', id, runData)
  }

  async deleteRun(id: string): Promise<void> {
    await this.collectionHelper.deleteDocument('runs', id)
  }

  async getRun(id: string): Promise<Run | null> {
    return this.collectionHelper.getDocument('runs', id)
  }

  async getRuns(): Promise<Run[]> {
    const runs = await this.collectionHelper.getDocuments<Run>('runs')
    return sortByRunDateAscending(runs)
  }

  async getUpcomingRuns(): Promise<Run[]> {
    const now = new Date().getTime()
    const runs = await this.collectionHelper.getDocuments<Run>('runs')
    console.log('[MockRunRepository] getUpcomingRuns - all runs:', runs)
    console.log('[MockRunRepository] getUpcomingRuns - now:', new Date())
    const upcomingRuns = runs.filter((entry) => new Date(entry.date).getTime() >= now)
    console.log('[MockRunRepository] getUpcomingRuns - filtered upcoming:', upcomingRuns)
    return sortByRunDateAscending(upcomingRuns)
  }

  async getRunsForOrganization(organizationId: string): Promise<Run[]> {
    const runs = await this.collectionHelper.getDocuments<Run>('runs')
    return sortByRunDateAscending(runs.filter((entry) => entry.organizationId === organizationId))
  }

  async getRunsAtLocation(locationId: string): Promise<Run[]> {
    const runs = await this.collectionHelper.getDocuments<Run>('runs')
    return sortByRunDateAscending(runs.filter((entry) => entry.locationId === locationId))
  }

  async createSignUp(signUpData: Omit<SignUp, 'id'>): Promise<string> {
    const id = nextId('signup')
    await this.collectionHelper.setDocument('signups', id, signUpData)
    return id
  }

  async updateSignUp(id: string, signUpData: Partial<Omit<SignUp, 'id'>>): Promise<void> {
    await this.collectionHelper.updateDocument('signups', id, signUpData)
  }

  async deleteSignUp(id: string): Promise<void> {
    await this.collectionHelper.deleteDocument('signups', id)
  }

  async getSignUpsForRun(runId: string): Promise<SignUp[]> {
    const signUps = await this.collectionHelper.getDocuments<SignUp>('signups')
    return sortBySignUpTimestampDescending(signUps.filter((entry) => entry.runId === runId))
  }

  async getSignUpsForUser(userId: string): Promise<SignUp[]> {
    const signUps = await this.collectionHelper.getDocuments<SignUp>('signups')
    return sortBySignUpTimestampDescending(signUps.filter((entry) => entry.userId === userId))
  }
}

export const mockRunRepository = new MockRunRepository()

