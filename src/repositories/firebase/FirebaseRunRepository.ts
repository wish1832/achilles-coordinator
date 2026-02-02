import { Timestamp, orderBy, where, type Firestore } from 'firebase/firestore'
import { getFirebaseDb } from '@/firebase/client'
import type { Run, SignUp } from '@/types/models'
import type { IRunRepository } from '../interfaces/IRunRepository'
import { FirestoreCollectionHelper } from './internal/FirestoreCollectionHelper'

/**
 * Firebase implementation of the run repository.
 * Owns run and signup domain queries while delegating shared CRUD to the helper.
 */
export class FirebaseRunRepository implements IRunRepository {
  private getDb(): Firestore {
    return getFirebaseDb()
  }

  private readonly collectionHelper = new FirestoreCollectionHelper(() => this.getDb())

  async createRun(runData: Omit<Run, 'id'>): Promise<string> {
    return this.collectionHelper.addDocument('runs', runData, {
      includeCreatedAt: true,
    })
  }

  async updateRun(id: string, runData: Partial<Omit<Run, 'id'>>): Promise<void> {
    return this.collectionHelper.updateDocument('runs', id, runData, {
      includeUpdatedAt: true,
    })
  }

  async deleteRun(id: string): Promise<void> {
    return this.collectionHelper.deleteDocument('runs', id)
  }

  async getRun(id: string): Promise<Run | null> {
    return this.collectionHelper.getDocument('runs', id)
  }

  async getRuns(): Promise<Run[]> {
    return this.collectionHelper.getDocuments('runs', [orderBy('date', 'asc')])
  }

  async getUpcomingRuns(): Promise<Run[]> {
    const now = Timestamp.now()
    return this.collectionHelper.getDocuments('runs', [
      where('date', '>=', now),
      orderBy('date', 'asc'),
    ])
  }

  async getRunsForOrganization(organizationId: string): Promise<Run[]> {
    return this.collectionHelper.getDocuments('runs', [
      where('organizationId', '==', organizationId),
      orderBy('date', 'asc'),
    ])
  }

  async getRunsAtLocation(locationId: string): Promise<Run[]> {
    return this.collectionHelper.getDocuments('runs', [
      where('locationId', '==', locationId),
      orderBy('date', 'asc'),
    ])
  }

  async createSignUp(signUpData: Omit<SignUp, 'id'>): Promise<string> {
    return this.collectionHelper.addDocument('signups', signUpData, {
      includeCreatedAt: true,
    })
  }

  async updateSignUp(id: string, signUpData: Partial<Omit<SignUp, 'id'>>): Promise<void> {
    return this.collectionHelper.updateDocument('signups', id, signUpData, {
      includeUpdatedAt: true,
    })
  }

  async deleteSignUp(id: string): Promise<void> {
    return this.collectionHelper.deleteDocument('signups', id)
  }

  async getSignUpsForRun(runId: string): Promise<SignUp[]> {
    return this.collectionHelper.getDocuments('signups', [
      where('runId', '==', runId),
      orderBy('timestamp', 'desc'),
    ])
  }

  async getSignUpsForUser(userId: string): Promise<SignUp[]> {
    return this.collectionHelper.getDocuments('signups', [
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
    ])
  }
}

export const firebaseRunRepository = new FirebaseRunRepository()

