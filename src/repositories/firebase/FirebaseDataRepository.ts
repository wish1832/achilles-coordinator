import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  Timestamp,
  type Unsubscribe,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { User, Run, SignUp, Pairing, Organization } from '@/types/models'
import type { IDataRepository } from '../interfaces/IDataRepository'

/**
 * Firebase implementation of the data repository
 * This is the production implementation that uses the real Firestore SDK
 * For testing, use MockDataRepository (unit tests) or EmulatorDataRepository (integration tests)
 */
export class FirebaseDataRepository implements IDataRepository {
  // ==========================================
  // Generic CRUD operations
  // ==========================================

  /**
   * Add a document to a collection
   * Automatically adds createdAt timestamp
   * @param collectionName - Name of the Firestore collection
   * @param data - Data to add (without id)
   * @returns Promise resolving to the new document ID
   * @throws Error if document creation fails
   */
  async addDocument<T extends { id?: string }>(
    collectionName: string,
    data: Omit<T, 'id'>,
  ): Promise<string> {
    try {
      // Add the document to Firestore with a createdAt timestamp
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: Timestamp.now(),
      })
      // Return the auto-generated document ID
      return docRef.id
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error)
      throw error
    }
  }

  /**
   * Update an existing document
   * Automatically adds updatedAt timestamp
   * @param collectionName - Name of the Firestore collection
   * @param id - Document ID
   * @param data - Partial data to update
   * @returns Promise that resolves when update is complete
   * @throws Error if document update fails
   */
  async updateDocument<T extends { id: string }>(
    collectionName: string,
    id: string,
    data: Partial<Omit<T, 'id'>>,
  ): Promise<void> {
    try {
      // Get a reference to the document
      const docRef = doc(db, collectionName, id)
      // Update the document with the new data and an updatedAt timestamp
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error(`Error updating document ${id} in ${collectionName}:`, error)
      throw error
    }
  }

  /**
   * Delete a document from a collection
   * @param collectionName - Name of the Firestore collection
   * @param id - Document ID
   * @returns Promise that resolves when deletion is complete
   * @throws Error if document deletion fails
   */
  async deleteDocument(collectionName: string, id: string): Promise<void> {
    try {
      // Get a reference to the document and delete it
      const docRef = doc(db, collectionName, id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error(`Error deleting document ${id} from ${collectionName}:`, error)
      throw error
    }
  }

  /**
   * Get a single document by ID
   * @param collectionName - Name of the Firestore collection
   * @param id - Document ID
   * @returns Promise resolving to the document data or null if not found
   * @throws Error if retrieval fails
   */
  async getDocument<T extends { id: string }>(
    collectionName: string,
    id: string,
  ): Promise<T | null> {
    try {
      // Get a reference to the document
      const docRef = doc(db, collectionName, id)
      // Fetch the document snapshot
      const docSnap = await getDoc(docRef)

      // Check if the document exists
      if (docSnap.exists()) {
        // Return the document data with the id field
        return { id: docSnap.id, ...docSnap.data() } as T
      }
      // Return null if the document doesn't exist
      return null
    } catch (error) {
      console.error(`Error getting document ${id} from ${collectionName}:`, error)
      throw error
    }
  }

  /**
   * Get multiple documents from a collection
   * @param collectionName - Name of the Firestore collection
   * @param constraints - Array of query constraints (where, orderBy, limit)
   * @returns Promise resolving to array of documents
   * @throws Error if retrieval fails
   */
  async getDocuments<T extends { id: string }>(
    collectionName: string,
    constraints: QueryConstraint[] = [],
  ): Promise<T[]> {
    try {
      // Build the query with the provided constraints
      const q = query(collection(db, collectionName), ...constraints)
      // Execute the query
      const querySnapshot = await getDocs(q)

      // Map the results to include the document ID
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[]
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error)
      throw error
    }
  }

  /**
   * Listen to real-time updates for a collection
   * The callback is invoked immediately with the current data,
   * and then again whenever the data changes
   * @param collectionName - Name of the Firestore collection
   * @param callback - Function to call when data changes
   * @param constraints - Array of query constraints
   * @returns Unsubscribe function to stop listening
   */
  onCollectionChange<T extends { id: string }>(
    collectionName: string,
    callback: (docs: T[]) => void,
    constraints: QueryConstraint[] = [],
  ): Unsubscribe {
    // Build the query with the provided constraints
    const q = query(collection(db, collectionName), ...constraints)

    // Set up the real-time listener
    return onSnapshot(q, (querySnapshot) => {
      // Map the results to include the document ID
      const docs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[]
      // Invoke the callback with the updated data
      callback(docs)
    })
  }

  // ==========================================
  // User-specific methods
  // ==========================================

  /**
   * Create a new user document in Firestore
   * @param userData - User data (without id)
   * @returns Promise resolving to the new user document ID
   * @throws Error if user creation fails
   */
  async createUser(userData: Omit<User, 'id'>): Promise<string> {
    return this.addDocument<User>('users', userData)
  }

  /**
   * Update an existing user document
   * @param id - User document ID
   * @param userData - Partial user data to update
   * @returns Promise that resolves when update is complete
   * @throws Error if user update fails
   */
  async updateUser(id: string, userData: Partial<Omit<User, 'id'>>): Promise<void> {
    return this.updateDocument<User>('users', id, userData)
  }

  /**
   * Get a user document by ID
   * @param id - User document ID
   * @returns Promise resolving to the user data or null if not found
   * @throws Error if retrieval fails
   */
  async getUser(id: string): Promise<User | null> {
    return this.getDocument<User>('users', id)
  }

  /**
   * Get all users, ordered by display name
   * @returns Promise resolving to array of users
   * @throws Error if retrieval fails
   */
  async getUsers(): Promise<User[]> {
    return this.getDocuments<User>('users', [orderBy('displayName')])
  }

  // ==========================================
  // Run-specific methods
  // ==========================================

  /**
   * Create a new run document
   * @param runData - Run data (without id)
   * @returns Promise resolving to the new run document ID
   * @throws Error if run creation fails
   */
  async createRun(runData: Omit<Run, 'id'>): Promise<string> {
    return this.addDocument<Run>('runs', runData)
  }

  /**
   * Update an existing run document
   * @param id - Run document ID
   * @param runData - Partial run data to update
   * @returns Promise that resolves when update is complete
   * @throws Error if run update fails
   */
  async updateRun(id: string, runData: Partial<Omit<Run, 'id'>>): Promise<void> {
    return this.updateDocument<Run>('runs', id, runData)
  }

  /**
   * Delete a run document
   * @param id - Run document ID
   * @returns Promise that resolves when deletion is complete
   * @throws Error if run deletion fails
   */
  async deleteRun(id: string): Promise<void> {
    return this.deleteDocument('runs', id)
  }

  /**
   * Get a run document by ID
   * @param id - Run document ID
   * @returns Promise resolving to the run data or null if not found
   * @throws Error if retrieval fails
   */
  async getRun(id: string): Promise<Run | null> {
    return this.getDocument<Run>('runs', id)
  }

  /**
   * Get all runs, ordered by date (ascending)
   * @returns Promise resolving to array of runs
   * @throws Error if retrieval fails
   */
  async getRuns(): Promise<Run[]> {
    return this.getDocuments<Run>('runs', [orderBy('date', 'asc')])
  }

  /**
   * Get upcoming runs (date >= now), ordered by date (ascending)
   * @returns Promise resolving to array of upcoming runs
   * @throws Error if retrieval fails
   */
  async getUpcomingRuns(): Promise<Run[]> {
    const now = Timestamp.now()
    return this.getDocuments<Run>('runs', [where('date', '>=', now), orderBy('date', 'asc')])
  }

  // ==========================================
  // SignUp-specific methods
  // ==========================================

  /**
   * Create a new sign-up document
   * @param signUpData - SignUp data (without id)
   * @returns Promise resolving to the new sign-up document ID
   * @throws Error if sign-up creation fails
   */
  async createSignUp(signUpData: Omit<SignUp, 'id'>): Promise<string> {
    return this.addDocument<SignUp>('signups', signUpData)
  }

  /**
   * Update an existing sign-up document
   * @param id - SignUp document ID
   * @param signUpData - Partial sign-up data to update
   * @returns Promise that resolves when update is complete
   * @throws Error if sign-up update fails
   */
  async updateSignUp(id: string, signUpData: Partial<Omit<SignUp, 'id'>>): Promise<void> {
    return this.updateDocument<SignUp>('signups', id, signUpData)
  }

  /**
   * Delete a sign-up document
   * @param id - SignUp document ID
   * @returns Promise that resolves when deletion is complete
   * @throws Error if sign-up deletion fails
   */
  async deleteSignUp(id: string): Promise<void> {
    return this.deleteDocument('signups', id)
  }

  /**
   * Get all sign-ups for a specific run, ordered by timestamp (descending)
   * @param runId - Run document ID
   * @returns Promise resolving to array of sign-ups
   * @throws Error if retrieval fails
   */
  async getSignUpsForRun(runId: string): Promise<SignUp[]> {
    return this.getDocuments<SignUp>('signups', [
      where('runId', '==', runId),
      orderBy('timestamp', 'desc'),
    ])
  }

  /**
   * Get all sign-ups for a specific user, ordered by timestamp (descending)
   * @param userId - User document ID
   * @returns Promise resolving to array of sign-ups
   * @throws Error if retrieval fails
   */
  async getUserSignUps(userId: string): Promise<SignUp[]> {
    return this.getDocuments<SignUp>('signups', [
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
    ])
  }

  // ==========================================
  // Pairing-specific methods
  // ==========================================

  /**
   * Create a new pairing document
   * @param pairingData - Pairing data (without id)
   * @returns Promise resolving to the new pairing document ID
   * @throws Error if pairing creation fails
   */
  async createPairing(pairingData: Omit<Pairing, 'id'>): Promise<string> {
    return this.addDocument<Pairing>('pairings', pairingData)
  }

  /**
   * Update an existing pairing document
   * @param id - Pairing document ID
   * @param pairingData - Partial pairing data to update
   * @returns Promise that resolves when update is complete
   * @throws Error if pairing update fails
   */
  async updatePairing(id: string, pairingData: Partial<Omit<Pairing, 'id'>>): Promise<void> {
    return this.updateDocument<Pairing>('pairings', id, pairingData)
  }

  /**
   * Delete a pairing document
   * @param id - Pairing document ID
   * @returns Promise that resolves when deletion is complete
   * @throws Error if pairing deletion fails
   */
  async deletePairing(id: string): Promise<void> {
    return this.deleteDocument('pairings', id)
  }

  /**
   * Get all pairings for a specific run, ordered by createdAt (descending)
   * @param runId - Run document ID
   * @returns Promise resolving to array of pairings
   * @throws Error if retrieval fails
   */
  async getPairingsForRun(runId: string): Promise<Pairing[]> {
    return this.getDocuments<Pairing>('pairings', [
      where('runId', '==', runId),
      orderBy('createdAt', 'desc'),
    ])
  }

  // ==========================================
  // Organization-specific methods
  // ==========================================

  /**
   * Create a new organization document
   * @param organizationData - Organization data (without id)
   * @returns Promise resolving to the new organization document ID
   * @throws Error if organization creation fails
   */
  async createOrganization(organizationData: Omit<Organization, 'id'>): Promise<string> {
    return this.addDocument<Organization>('organizations', organizationData)
  }

  /**
   * Update an existing organization document
   * @param id - Organization document ID
   * @param organizationData - Partial organization data to update
   * @returns Promise that resolves when update is complete
   * @throws Error if organization update fails
   */
  async updateOrganization(
    id: string,
    organizationData: Partial<Omit<Organization, 'id'>>,
  ): Promise<void> {
    return this.updateDocument<Organization>('organizations', id, organizationData)
  }

  /**
   * Delete an organization document
   * @param id - Organization document ID
   * @returns Promise that resolves when deletion is complete
   * @throws Error if organization deletion fails
   */
  async deleteOrganization(id: string): Promise<void> {
    return this.deleteDocument('organizations', id)
  }

  /**
   * Get an organization document by ID
   * @param id - Organization document ID
   * @returns Promise resolving to the organization data or null if not found
   * @throws Error if retrieval fails
   */
  async getOrganization(id: string): Promise<Organization | null> {
    return this.getDocument<Organization>('organizations', id)
  }

  /**
   * Get all organizations, ordered by name
   * @returns Promise resolving to array of organizations
   * @throws Error if retrieval fails
   */
  async getOrganizations(): Promise<Organization[]> {
    return this.getDocuments<Organization>('organizations', [orderBy('name')])
  }

  /**
   * Get organizations where the user is a member
   * Uses array-contains query to find organizations where user ID is in memberIds array
   * @param userId - User document ID
   * @returns Promise resolving to array of organizations
   * @throws Error if retrieval fails
   */
  async getUserOrganizations(userId: string): Promise<Organization[]> {
    return this.getDocuments<Organization>('organizations', [
      where('memberIds', 'array-contains', userId),
      orderBy('name'),
    ])
  }

  /**
   * Get organizations where the user is an admin
   * Uses array-contains query to find organizations where user ID is in adminIds array
   * @param userId - User document ID
   * @returns Promise resolving to array of organizations
   * @throws Error if retrieval fails
   */
  async getUserAdminOrganizations(userId: string): Promise<Organization[]> {
    return this.getDocuments<Organization>('organizations', [
      where('adminIds', 'array-contains', userId),
      orderBy('name'),
    ])
  }

  /**
   * Add a user to an organization as a member
   * Uses Firestore arrayUnion to add userId to memberIds array (no duplicates)
   * @param organizationId - Organization document ID
   * @param userId - User document ID to add
   * @returns Promise that resolves when update is complete
   * @throws Error if update fails
   */
  async addOrganizationMember(organizationId: string, userId: string): Promise<void> {
    try {
      // Get reference to the organization document
      const orgRef = doc(db, 'organizations', organizationId)
      // Use arrayUnion to add the userId to memberIds (avoids duplicates)
      await updateDoc(orgRef, {
        memberIds: arrayUnion(userId),
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error(
        `Error adding member ${userId} to organization ${organizationId}:`,
        error,
      )
      throw error
    }
  }

  /**
   * Remove a user from an organization
   * Removes user from both memberIds and adminIds arrays
   * @param organizationId - Organization document ID
   * @param userId - User document ID to remove
   * @returns Promise that resolves when update is complete
   * @throws Error if update fails
   */
  async removeOrganizationMember(organizationId: string, userId: string): Promise<void> {
    try {
      // Get reference to the organization document
      const orgRef = doc(db, 'organizations', organizationId)
      // Use arrayRemove to remove the userId from both arrays
      await updateDoc(orgRef, {
        memberIds: arrayRemove(userId),
        adminIds: arrayRemove(userId),
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error(
        `Error removing member ${userId} from organization ${organizationId}:`,
        error,
      )
      throw error
    }
  }

  /**
   * Add a user as an admin of an organization
   * Also adds them as a member if not already
   * Uses Firestore arrayUnion for both memberIds and adminIds (no duplicates)
   * @param organizationId - Organization document ID
   * @param userId - User document ID to make admin
   * @returns Promise that resolves when update is complete
   * @throws Error if update fails
   */
  async addOrganizationAdmin(organizationId: string, userId: string): Promise<void> {
    try {
      // Get reference to the organization document
      const orgRef = doc(db, 'organizations', organizationId)
      // Use arrayUnion to add the userId to both memberIds and adminIds
      // arrayUnion automatically avoids duplicates
      await updateDoc(orgRef, {
        memberIds: arrayUnion(userId),
        adminIds: arrayUnion(userId),
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error(`Error adding admin ${userId} to organization ${organizationId}:`, error)
      throw error
    }
  }

  /**
   * Remove admin status from a user in an organization
   * User remains a member (only removes from adminIds, not memberIds)
   * @param organizationId - Organization document ID
   * @param userId - User document ID to remove admin status from
   * @returns Promise that resolves when update is complete
   * @throws Error if update fails
   */
  async removeOrganizationAdmin(organizationId: string, userId: string): Promise<void> {
    try {
      // Get reference to the organization document
      const orgRef = doc(db, 'organizations', organizationId)
      // Use arrayRemove to remove the userId from adminIds only
      // User remains in memberIds
      await updateDoc(orgRef, {
        adminIds: arrayRemove(userId),
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error(
        `Error removing admin status from ${userId} in organization ${organizationId}:`,
        error,
      )
      throw error
    }
  }
}

// Export a singleton instance for use throughout the application
export const firebaseDataRepository = new FirebaseDataRepository()
