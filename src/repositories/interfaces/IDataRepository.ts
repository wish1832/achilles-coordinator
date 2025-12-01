import type { QueryConstraint, Unsubscribe } from 'firebase/firestore'
import type { User, Run, SignUp, Pairing } from '@/types/models'

/**
 * Data repository interface
 * Defines the contract for all Firestore data operations
 * This abstraction allows for multiple implementations:
 * - Production: Real Firestore database
 * - Unit tests: In-memory mock implementation
 * - Integration tests: Firestore Emulator implementation
 */
export interface IDataRepository {
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
  addDocument<T extends { id?: string }>(
    collectionName: string,
    data: Omit<T, 'id'>,
  ): Promise<string>

  /**
   * Update an existing document
   * Automatically adds updatedAt timestamp
   * @param collectionName - Name of the Firestore collection
   * @param id - Document ID
   * @param data - Partial data to update
   * @returns Promise that resolves when update is complete
   * @throws Error if document update fails
   */
  updateDocument<T extends { id: string }>(
    collectionName: string,
    id: string,
    data: Partial<Omit<T, 'id'>>,
  ): Promise<void>

  /**
   * Delete a document from a collection
   * @param collectionName - Name of the Firestore collection
   * @param id - Document ID
   * @returns Promise that resolves when deletion is complete
   * @throws Error if document deletion fails
   */
  deleteDocument(collectionName: string, id: string): Promise<void>

  /**
   * Get a single document by ID
   * @param collectionName - Name of the Firestore collection
   * @param id - Document ID
   * @returns Promise resolving to the document data or null if not found
   * @throws Error if retrieval fails
   */
  getDocument<T extends { id: string }>(collectionName: string, id: string): Promise<T | null>

  /**
   * Get multiple documents from a collection
   * @param collectionName - Name of the Firestore collection
   * @param constraints - Array of query constraints (where, orderBy, limit)
   * @returns Promise resolving to array of documents
   * @throws Error if retrieval fails
   */
  getDocuments<T extends { id: string }>(
    collectionName: string,
    constraints?: QueryConstraint[],
  ): Promise<T[]>

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
    constraints?: QueryConstraint[],
  ): Unsubscribe

  // ==========================================
  // User-specific methods
  // ==========================================

  /**
   * Create a new user document in Firestore
   * @param userData - User data (without id)
   * @returns Promise resolving to the new user document ID
   * @throws Error if user creation fails
   */
  createUser(userData: Omit<User, 'id'>): Promise<string>

  /**
   * Update an existing user document
   * @param id - User document ID
   * @param userData - Partial user data to update
   * @returns Promise that resolves when update is complete
   * @throws Error if user update fails
   */
  updateUser(id: string, userData: Partial<Omit<User, 'id'>>): Promise<void>

  /**
   * Get a user document by ID
   * @param id - User document ID
   * @returns Promise resolving to the user data or null if not found
   * @throws Error if retrieval fails
   */
  getUser(id: string): Promise<User | null>

  /**
   * Get all users, ordered by display name
   * @returns Promise resolving to array of users
   * @throws Error if retrieval fails
   */
  getUsers(): Promise<User[]>

  // ==========================================
  // Run-specific methods
  // ==========================================

  /**
   * Create a new run document
   * @param runData - Run data (without id)
   * @returns Promise resolving to the new run document ID
   * @throws Error if run creation fails
   */
  createRun(runData: Omit<Run, 'id'>): Promise<string>

  /**
   * Update an existing run document
   * @param id - Run document ID
   * @param runData - Partial run data to update
   * @returns Promise that resolves when update is complete
   * @throws Error if run update fails
   */
  updateRun(id: string, runData: Partial<Omit<Run, 'id'>>): Promise<void>

  /**
   * Delete a run document
   * @param id - Run document ID
   * @returns Promise that resolves when deletion is complete
   * @throws Error if run deletion fails
   */
  deleteRun(id: string): Promise<void>

  /**
   * Get a run document by ID
   * @param id - Run document ID
   * @returns Promise resolving to the run data or null if not found
   * @throws Error if retrieval fails
   */
  getRun(id: string): Promise<Run | null>

  /**
   * Get all runs, ordered by date (ascending)
   * @returns Promise resolving to array of runs
   * @throws Error if retrieval fails
   */
  getRuns(): Promise<Run[]>

  /**
   * Get upcoming runs (date >= now), ordered by date (ascending)
   * @returns Promise resolving to array of upcoming runs
   * @throws Error if retrieval fails
   */
  getUpcomingRuns(): Promise<Run[]>

  // ==========================================
  // SignUp-specific methods
  // ==========================================

  /**
   * Create a new sign-up document
   * @param signUpData - SignUp data (without id)
   * @returns Promise resolving to the new sign-up document ID
   * @throws Error if sign-up creation fails
   */
  createSignUp(signUpData: Omit<SignUp, 'id'>): Promise<string>

  /**
   * Update an existing sign-up document
   * @param id - SignUp document ID
   * @param signUpData - Partial sign-up data to update
   * @returns Promise that resolves when update is complete
   * @throws Error if sign-up update fails
   */
  updateSignUp(id: string, signUpData: Partial<Omit<SignUp, 'id'>>): Promise<void>

  /**
   * Delete a sign-up document
   * @param id - SignUp document ID
   * @returns Promise that resolves when deletion is complete
   * @throws Error if sign-up deletion fails
   */
  deleteSignUp(id: string): Promise<void>

  /**
   * Get all sign-ups for a specific run, ordered by timestamp (descending)
   * @param runId - Run document ID
   * @returns Promise resolving to array of sign-ups
   * @throws Error if retrieval fails
   */
  getSignUpsForRun(runId: string): Promise<SignUp[]>

  /**
   * Get all sign-ups for a specific user, ordered by timestamp (descending)
   * @param userId - User document ID
   * @returns Promise resolving to array of sign-ups
   * @throws Error if retrieval fails
   */
  getUserSignUps(userId: string): Promise<SignUp[]>

  // ==========================================
  // Pairing-specific methods
  // ==========================================

  /**
   * Create a new pairing document
   * @param pairingData - Pairing data (without id)
   * @returns Promise resolving to the new pairing document ID
   * @throws Error if pairing creation fails
   */
  createPairing(pairingData: Omit<Pairing, 'id'>): Promise<string>

  /**
   * Update an existing pairing document
   * @param id - Pairing document ID
   * @param pairingData - Partial pairing data to update
   * @returns Promise that resolves when update is complete
   * @throws Error if pairing update fails
   */
  updatePairing(id: string, pairingData: Partial<Omit<Pairing, 'id'>>): Promise<void>

  /**
   * Delete a pairing document
   * @param id - Pairing document ID
   * @returns Promise that resolves when deletion is complete
   * @throws Error if pairing deletion fails
   */
  deletePairing(id: string): Promise<void>

  /**
   * Get all pairings for a specific run, ordered by createdAt (descending)
   * @param runId - Run document ID
   * @returns Promise resolving to array of pairings
   * @throws Error if retrieval fails
   */
  getPairingsForRun(runId: string): Promise<Pairing[]>
}
