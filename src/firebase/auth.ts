import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import type { User as FirebaseUser } from 'firebase/auth'
import { auth, db } from './config'
import { doc, setDoc, Timestamp } from 'firebase/firestore'
import type { UserRole } from '@/types/models'

/**
 * Authentication service wrapper for Firebase Auth
 * Provides type-safe methods for user authentication and management
 */
export class AuthService {
  /**
   * Sign in with email and password
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise resolving to Firebase User object
   */
  async signIn(email: string, password: string): Promise<FirebaseUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return userCredential.user
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  /**
   * Sign out the current user
   * @returns Promise that resolves when sign out is complete
   */
  async signOut(): Promise<void> {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  /**
   * Create a new user account (admin only)
   * This is for invite-only registration where admins create accounts
   * @param email - User's email address
   * @param password - User's password
   * @param displayName - User's display name
   * @param role - User's role (athlete, guide, or admin)
   * @returns Promise resolving to Firebase User object
   */
  async createUser(
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
  ): Promise<FirebaseUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update the user's display name
      await updateProfile(user, { displayName })

      // Save the user record in Firestore using the auth UID as the document ID
      // This keeps the auth uid and firestore user record in sync.
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email ?? email,
        displayName,
        role,
        createdAt: Timestamp.now(),
        profileDetails: {},
      })

      return user
    } catch (error) {
      console.error('Create user error:', error)
      throw error
    }
  }

  /**
   * Listen to authentication state changes
   * @param callback - Function to call when auth state changes
   * @returns Unsubscribe function to stop listening
   */
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback)
  }

  /**
   * Get the current user
   * @returns Current Firebase User or null if not authenticated
   */
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser
  }
}

// Export a singleton instance
export const authService = new AuthService()
