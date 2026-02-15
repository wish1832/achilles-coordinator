import { orderBy, where, type Firestore } from 'firebase/firestore'
import { getFirebaseDb } from '@/firebase/client'
import type { SignUp } from '@/types/models'
import type { ISignUpRepository } from '../interfaces/ISignUpRepository'
import { FirestoreCollectionHelper } from './internal/FirestoreCollectionHelper'

/**
 * Firebase implementation of the sign-up repository.
 * Handles CRUD operations for sign-ups stored in a top-level 'signups' collection.
 * This separation from runs allows users to manage their signups without
 * requiring write access to run documents (which are admin-only).
 */
export class FirebaseSignUpRepository implements ISignUpRepository {
  // Lazy getter for Firestore instance to support deferred initialization.
  private getDb(): Firestore {
    return getFirebaseDb()
  }

  // Helper class for common Firestore CRUD operations.
  private readonly collectionHelper = new FirestoreCollectionHelper(() => this.getDb())

  /**
   * Create a new sign-up document in Firestore.
   * Automatically adds a createdAt timestamp.
   * @param signUpData - SignUp data (without id)
   * @returns Promise resolving to the new sign-up document ID
   */
  async createSignUp(signUpData: Omit<SignUp, 'id'>): Promise<string> {
    return this.collectionHelper.addDocument('signups', signUpData, {
      includeCreatedAt: true,
    })
  }

  /**
   * Update an existing sign-up document.
   * Automatically adds an updatedAt timestamp.
   * @param id - SignUp document ID
   * @param signUpData - Partial sign-up data to update
   */
  async updateSignUp(id: string, signUpData: Partial<Omit<SignUp, 'id'>>): Promise<void> {
    return this.collectionHelper.updateDocument('signups', id, signUpData, {
      includeUpdatedAt: true,
    })
  }

  /**
   * Delete a sign-up document from Firestore.
   * @param id - SignUp document ID
   */
  async deleteSignUp(id: string): Promise<void> {
    return this.collectionHelper.deleteDocument('signups', id)
  }

  /**
   * Get a sign-up document by ID.
   * @param id - SignUp document ID
   * @returns Promise resolving to the sign-up data or null if not found
   */
  async getSignUp(id: string): Promise<SignUp | null> {
    return this.collectionHelper.getDocument('signups', id)
  }

  /**
   * Get all sign-ups for a specific run, ordered by timestamp descending.
   * @param runId - Run document ID
   * @returns Promise resolving to array of sign-ups for the run
   */
  async getSignUpsForRun(runId: string): Promise<SignUp[]> {
    return this.collectionHelper.getDocuments('signups', [
      where('runId', '==', runId),
      orderBy('timestamp', 'desc'),
    ])
  }

  /**
   * Get all sign-ups for a specific user, ordered by timestamp descending.
   * @param userId - User document ID
   * @returns Promise resolving to array of sign-ups for the user
   */
  async getSignUpsForUser(userId: string): Promise<SignUp[]> {
    return this.collectionHelper.getDocuments('signups', [
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
    ])
  }

  /**
   * Get a user's sign-up for a specific run, if it exists.
   * Useful for checking if a user has already signed up for a run.
   * @param runId - Run document ID
   * @param userId - User document ID
   * @returns Promise resolving to the sign-up data or null if not found
   */
  async getSignUpForRunAndUser(runId: string, userId: string): Promise<SignUp | null> {
    // Query for sign-ups matching both runId and userId.
    const signUps = await this.collectionHelper.getDocuments<SignUp>('signups', [
      where('runId', '==', runId),
      where('userId', '==', userId),
    ])

    // Return the first match (there should be at most one) or null.
    return signUps[0] ?? null
  }
}

// Singleton instance for use throughout the application.
export const firebaseSignUpRepository = new FirebaseSignUpRepository()
