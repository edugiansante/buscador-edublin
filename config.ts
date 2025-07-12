// Configuration constants and environment detection
// This file provides a safe way to access environment variables in the browser

export interface AppConfig {
  isDevelopment: boolean
  isProduction: boolean
  hostname: string
  baseUrl: string
  environment: {
    hasWindow: boolean
    hasProcess: boolean
    hasLocalStorage: boolean
  }
}

// Safe environment detection
export const getAppConfig = (): AppConfig => {
  let hostname = 'unknown'
  let baseUrl = 'https://figma-make-app.vercel.app'
  let isDevelopment = false
  let isProduction = true

  try {
    if (typeof window !== 'undefined') {
      hostname = window.location.hostname
      baseUrl = window.location.origin
      isDevelopment = hostname.includes('localhost') || hostname.includes('127.0.0.1')
      isProduction = !isDevelopment
    }
  } catch (error) {
    console.warn('Error detecting environment:', error)
  }

  return {
    isDevelopment,
    isProduction,
    hostname,
    baseUrl,
    environment: {
      hasWindow: typeof window !== 'undefined',
      hasProcess: typeof process !== 'undefined',
      hasLocalStorage: typeof localStorage !== 'undefined'
    }
  }
}

// Application constants
export const APP_CONSTANTS = {
  APP_NAME: 'Edublin',
  APP_DESCRIPTION: 'Conectando intercambistas de forma segura',
  APP_VERSION: '1.0.0',
  SEARCH_RATE_LIMIT: 3, // Number of searches before requiring auth
  CONTACT_RATE_LIMIT: 5, // Number of contacts per day
  DEFAULT_TIMEOUT: 5000, // Default timeout for operations in ms
  QUICK_TIMEOUT: 2000, // Quick timeout for fast operations in ms
  AUTH_TIMEOUT: 8000, // Timeout for auth operations in ms
} as const

// URLs for redirects
export const getRedirectUrls = () => {
  const config = getAppConfig()
  
  return {
    emailConfirmation: `${config.baseUrl}/#type=email_confirmation&action=confirmed`,
    passwordReset: `${config.baseUrl}/#type=recovery&action=password_reset`,
    login: `${config.baseUrl}/#login`,
    signup: `${config.baseUrl}/#signup`
  }
}

// Safe localStorage operations
export const storage = {
  get: (key: string): string | null => {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key)
      }
    } catch (error) {
      console.warn(`Error reading from localStorage (${key}):`, error)
    }
    return null
  },

  set: (key: string, value: string): boolean => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value)
        return true
      }
    } catch (error) {
      console.warn(`Error writing to localStorage (${key}):`, error)
    }
    return false
  },

  remove: (key: string): boolean => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key)
        return true
      }
    } catch (error) {
      console.warn(`Error removing from localStorage (${key}):`, error)
    }
    return false
  },

  clear: (): boolean => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear()
        return true
      }
    } catch (error) {
      console.warn('Error clearing localStorage:', error)
    }
    return false
  }
}

// Safe environment variable access
export const getEnvVar = (name: string): string => {
  try {
    // Try process.env first (if available)
    if (typeof process !== 'undefined' && process.env && process.env[name]) {
      return process.env[name] || ''
    }

    // Try window globals (some bundlers inject env vars here)
    if (typeof window !== 'undefined') {
      const windowGlobal = (window as any)[name]
      if (windowGlobal) {
        return windowGlobal
      }
    }

    // Try localStorage as fallback
    return storage.get(name) || ''
  } catch (error) {
    console.warn(`Error accessing environment variable ${name}:`, error)
    return ''
  }
}

// Common environment variables with fallbacks
export const ENV = {
  SUPABASE_URL: getEnvVar('REACT_APP_SUPABASE_URL') || 
                getEnvVar('VITE_SUPABASE_URL') || 
                getEnvVar('SUPABASE_URL') || 
                storage.get('supabase_url') || '',
                
  SUPABASE_ANON_KEY: getEnvVar('REACT_APP_SUPABASE_ANON_KEY') || 
                     getEnvVar('VITE_SUPABASE_ANON_KEY') || 
                     getEnvVar('SUPABASE_ANON_KEY') || 
                     storage.get('supabase_anon_key') || '',
} as const

// Debug info for development
export const getDebugInfo = () => {
  const config = getAppConfig()
  
  return {
    config,
    env: {
      hasSupabaseUrl: !!ENV.SUPABASE_URL,
      hasSupabaseKey: !!ENV.SUPABASE_ANON_KEY,
      supabaseUrlPreview: ENV.SUPABASE_URL ? ENV.SUPABASE_URL.substring(0, 20) + '...' : 'missing',
      supabaseKeyPreview: ENV.SUPABASE_ANON_KEY ? ENV.SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'missing'
    },
    storageItems: {
      supabaseConfigSkipped: storage.get('supabase_config_skipped'),
      hasStoredUrl: !!storage.get('supabase_url'),
      hasStoredKey: !!storage.get('supabase_anon_key')
    }
  }
}