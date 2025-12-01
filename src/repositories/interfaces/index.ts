/**
 * Repository interfaces for data access abstraction
 * These interfaces define contracts that can be implemented by:
 * - Production implementations (Firebase SDK)
 * - Mock implementations (in-memory for unit tests)
 * - Emulator implementations (Firebase emulators for integration tests)
 */

export type { IAuthRepository } from './IAuthRepository'
export type { IDataRepository } from './IDataRepository'
