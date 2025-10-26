/**
 * Client-side Rate Limiter for Authentication
 * Prevents brute force attacks by limiting login attempts
 *
 * This is a basic client-side implementation. For production,
 * implement server-side rate limiting using Firebase Cloud Functions.
 */

import logger from './logger'

class RateLimiter {
  constructor() {
    this.storageKey = 'auth_rate_limit'
    this.maxAttempts = 5 // Maximum failed login attempts
    this.lockoutDuration = 15 * 60 * 1000 // 15 minutes in milliseconds
    this.attemptWindow = 5 * 60 * 1000 // 5 minute sliding window
  }

  /**
   * Get current rate limit state from storage
   */
  getState(identifier = 'global') {
    try {
      const stored = localStorage.getItem(`${this.storageKey}_${identifier}`)
      if (!stored) {
        return {
          attempts: [],
          lockedUntil: null
        }
      }
      return JSON.parse(stored)
    } catch (error) {
      logger.error('Error reading rate limit state:', error)
      return { attempts: [], lockedUntil: null }
    }
  }

  /**
   * Save rate limit state to storage
   */
  setState(identifier = 'global', state) {
    try {
      localStorage.setItem(`${this.storageKey}_${identifier}`, JSON.stringify(state))
    } catch (error) {
      logger.error('Error saving rate limit state:', error)
    }
  }

  /**
   * Clean up old attempts outside the sliding window
   */
  cleanupOldAttempts(attempts) {
    const now = Date.now()
    return attempts.filter(timestamp => {
      return now - timestamp < this.attemptWindow
    })
  }

  /**
   * Check if an identifier (IP/email) is currently locked out
   * @param {string} identifier - Email or IP to check
   * @returns {Object} - { isLocked: boolean, remainingTime: number|null, message: string|null }
   */
  checkLimit(identifier = 'global') {
    const state = this.getState(identifier)
    const now = Date.now()

    // Check if currently locked out
    if (state.lockedUntil && now < state.lockedUntil) {
      const remainingSeconds = Math.ceil((state.lockedUntil - now) / 1000)
      const remainingMinutes = Math.ceil(remainingSeconds / 60)

      return {
        isLocked: true,
        remainingTime: remainingSeconds,
        message: `Trop de tentatives échouées. Veuillez réessayer dans ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`
      }
    }

    // Clean up old attempts
    const recentAttempts = this.cleanupOldAttempts(state.attempts)

    // Check if attempts exceed limit
    if (recentAttempts.length >= this.maxAttempts) {
      // Lock out the identifier
      const lockedUntil = now + this.lockoutDuration
      this.setState(identifier, {
        attempts: recentAttempts,
        lockedUntil
      })

      const lockoutMinutes = Math.ceil(this.lockoutDuration / 1000 / 60)

      return {
        isLocked: true,
        remainingTime: this.lockoutDuration / 1000,
        message: `Trop de tentatives échouées. Compte temporairement verrouillé pour ${lockoutMinutes} minutes.`
      }
    }

    return {
      isLocked: false,
      remainingAttempts: this.maxAttempts - recentAttempts.length,
      message: null
    }
  }

  /**
   * Record a failed login attempt
   * @param {string} identifier - Email or IP
   */
  recordFailedAttempt(identifier = 'global') {
    const state = this.getState(identifier)
    const now = Date.now()

    // Clean up old attempts
    const recentAttempts = this.cleanupOldAttempts(state.attempts)

    // Add new attempt
    recentAttempts.push(now)

    // Check if we should lock out
    if (recentAttempts.length >= this.maxAttempts) {
      this.setState(identifier, {
        attempts: recentAttempts,
        lockedUntil: now + this.lockoutDuration
      })

      logger.warn(`Rate limit exceeded for ${identifier}. Account locked.`)
    } else {
      this.setState(identifier, {
        attempts: recentAttempts,
        lockedUntil: null
      })
    }

    return this.checkLimit(identifier)
  }

  /**
   * Reset rate limit for an identifier (after successful login)
   * @param {string} identifier - Email or IP
   */
  reset(identifier = 'global') {
    try {
      localStorage.removeItem(`${this.storageKey}_${identifier}`)
    } catch (error) {
      logger.error('Error resetting rate limit:', error)
    }
  }

  /**
   * Clear all rate limit data (admin function)
   */
  clearAll() {
    try {
      const keys = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.storageKey)) {
          keys.push(key)
        }
      }
      keys.forEach(key => localStorage.removeItem(key))
    } catch (error) {
      logger.error('Error clearing rate limits:', error)
    }
  }

  /**
   * Get statistics about rate limiting
   */
  getStats() {
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this.storageKey)) {
        keys.push(key)
      }
    }

    const stats = {
      totalTracked: keys.length,
      currentlyLocked: 0,
      activeAttempts: 0
    }

    keys.forEach(key => {
      try {
        const state = JSON.parse(localStorage.getItem(key))
        const now = Date.now()

        if (state.lockedUntil && now < state.lockedUntil) {
          stats.currentlyLocked++
        }

        const recentAttempts = this.cleanupOldAttempts(state.attempts || [])
        stats.activeAttempts += recentAttempts.length
      } catch (error) {
        // Skip malformed entries
      }
    })

    return stats
  }
}

// Singleton instance
const rateLimiter = new RateLimiter()

export default rateLimiter
