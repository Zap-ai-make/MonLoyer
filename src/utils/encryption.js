/**
 * Simple encryption utility for localStorage sensitive data
 * Uses Web Crypto API with AES-GCM
 *
 * IMPORTANT: This provides basic protection against casual inspection.
 * For production, consider using a more robust key management solution.
 */

import logger from './logger'

class EncryptionService {
  constructor() {
    this.algorithm = 'AES-GCM'
    this.keyLength = 256
    this.ivLength = 12 // 96 bits recommended for AES-GCM
    this.saltLength = 16
    this.iterations = 100000 // PBKDF2 iterations
    this.isSupported = this.checkSupport()
  }

  /**
   * Check if Web Crypto API is supported
   */
  checkSupport() {
    return typeof window !== 'undefined' &&
           window.crypto &&
           window.crypto.subtle
  }

  /**
   * Generate a device-specific key based on browser fingerprint
   * This is NOT cryptographically secure but adds a layer of obfuscation
   */
  async getDeviceKey() {
    try {
      // Create a device fingerprint from browser characteristics
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        new Date().getTimezoneOffset(),
        screen.colorDepth,
        screen.width + 'x' + screen.height
      ].join('|')

      // Add a salt stored in sessionStorage (changes per session)
      let sessionSalt = sessionStorage.getItem('_enc_salt')
      if (!sessionSalt) {
        sessionSalt = this.generateRandomString(32)
        sessionStorage.setItem('_enc_salt', sessionSalt)
      }

      const keyMaterial = fingerprint + sessionSalt

      // Derive key using PBKDF2
      const enc = new TextEncoder()
      const keyData = enc.encode(keyMaterial)

      const importedKey = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      )

      // Use a static salt (not ideal, but better than nothing)
      const salt = enc.encode('woning_crm_v1_salt_2024')

      const derivedKey = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: this.iterations,
          hash: 'SHA-256'
        },
        importedKey,
        { name: this.algorithm, length: this.keyLength },
        false,
        ['encrypt', 'decrypt']
      )

      return derivedKey
    } catch (error) {
      logger.error('Error generating device key:', error)
      return null
    }
  }

  /**
   * Generate random string for salts/IVs
   */
  generateRandomString(length) {
    const array = new Uint8Array(length)
    window.crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Encrypt data
   * @param {string} plaintext - Data to encrypt
   * @returns {Promise<string|null>} - Base64 encrypted data or null if failed
   */
  async encrypt(plaintext) {
    if (!this.isSupported || !plaintext) {
      return plaintext // Fallback: return as-is if crypto not supported
    }

    try {
      const key = await this.getDeviceKey()
      if (!key) return plaintext

      // Generate random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(this.ivLength))

      // Encrypt
      const enc = new TextEncoder()
      const encodedData = enc.encode(plaintext)

      const encryptedData = await window.crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        encodedData
      )

      // Combine IV + encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength)
      combined.set(iv, 0)
      combined.set(new Uint8Array(encryptedData), iv.length)

      // Convert to base64
      return this.arrayBufferToBase64(combined)
    } catch (error) {
      logger.error('Encryption error:', error)
      return plaintext // Fallback
    }
  }

  /**
   * Decrypt data
   * @param {string} ciphertext - Base64 encrypted data
   * @returns {Promise<string|null>} - Decrypted plaintext or null if failed
   */
  async decrypt(ciphertext) {
    if (!this.isSupported || !ciphertext) {
      return ciphertext
    }

    try {
      const key = await this.getDeviceKey()
      if (!key) return ciphertext

      // Convert from base64
      const combined = this.base64ToArrayBuffer(ciphertext)

      // Extract IV and encrypted data
      const iv = combined.slice(0, this.ivLength)
      const encryptedData = combined.slice(this.ivLength)

      // Decrypt
      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        encryptedData
      )

      // Decode to string
      const dec = new TextDecoder()
      return dec.decode(decryptedData)
    } catch (error) {
      logger.error('Decryption error:', error)
      return ciphertext // Fallback: return as-is (might be unencrypted old data)
    }
  }

  /**
   * Encrypt sensitive fields in an object
   * @param {Object} obj - Object with sensitive data
   * @param {Array<string>} sensitiveFields - Field names to encrypt
   * @returns {Promise<Object>} - Object with encrypted fields
   */
  async encryptObject(obj, sensitiveFields = []) {
    if (!obj || typeof obj !== 'object') return obj

    const encrypted = { ...obj }

    for (const field of sensitiveFields) {
      if (encrypted[field] !== undefined && encrypted[field] !== null) {
        const value = typeof encrypted[field] === 'string'
          ? encrypted[field]
          : JSON.stringify(encrypted[field])

        encrypted[field] = await this.encrypt(value)
        encrypted[`${field}_encrypted`] = true // Mark as encrypted
      }
    }

    return encrypted
  }

  /**
   * Decrypt sensitive fields in an object
   * @param {Object} obj - Object with encrypted data
   * @param {Array<string>} sensitiveFields - Field names to decrypt
   * @returns {Promise<Object>} - Object with decrypted fields
   */
  async decryptObject(obj, sensitiveFields = []) {
    if (!obj || typeof obj !== 'object') return obj

    const decrypted = { ...obj }

    for (const field of sensitiveFields) {
      if (decrypted[field] && decrypted[`${field}_encrypted`]) {
        const value = await this.decrypt(decrypted[field])

        // Try to parse if it was JSON
        try {
          decrypted[field] = JSON.parse(value)
        } catch {
          decrypted[field] = value
        }

        delete decrypted[`${field}_encrypted`] // Remove encryption marker
      }
    }

    return decrypted
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }
}

// Singleton instance
const encryptionService = new EncryptionService()

export default encryptionService
