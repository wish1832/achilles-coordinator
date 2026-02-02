import { limit, orderBy, where, type Firestore } from 'firebase/firestore'
import { getFirebaseDb } from '@/firebase/client'
import type { User } from '@/types/models'
import type { IUserRepository } from '../interfaces/IUserRepository'
import { FirestoreCollectionHelper } from './internal/FirestoreCollectionHelper'

/**
 * Firebase implementation of the user repository.
 * Handles user profile data stored in Firestore.
 */
export class FirebaseUserRepository implements IUserRepository {
  private getDb(): Firestore {
    return getFirebaseDb()
  }

  private readonly collectionHelper = new FirestoreCollectionHelper(() => this.getDb())

  async createUser(id: string, userData: Omit<User, 'id'>): Promise<void> {
    await this.collectionHelper.setDocument('users', id, userData, {
      includeCreatedAt: true,
    })
  }

  async updateUser(id: string, userData: Partial<Omit<User, 'id'>>): Promise<void> {
    await this.collectionHelper.updateDocument('users', id, userData, {
      includeUpdatedAt: true,
    })
  }

  async getUser(id: string): Promise<User | null> {
    return this.collectionHelper.getDocument<User>('users', id)
  }

  async getUsers(): Promise<User[]> {
    return this.collectionHelper.getDocuments<User>('users', [orderBy('displayName')])
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const matches = await this.collectionHelper.getDocuments<User>('users', [
      where('email', '==', email),
      limit(1),
    ])

    return matches[0] ?? null
  }
}

export const firebaseUserRepository = new FirebaseUserRepository()
