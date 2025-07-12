import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// Check if Supabase configuration is available - browser safe
const getSupabaseConfig = () => {
  // Browser environment variables - check multiple possible sources
  let supabaseUrl = ''
  let supabaseAnonKey = ''

  // Try to get from various sources, safely checking for existence
  try {
    // Check if we're in a browser environment with window object
    if (typeof window !== 'undefined') {
      // Try window globals (some bundlers inject env vars here)
      supabaseUrl = (window as any).REACT_APP_SUPABASE_URL || 
                   (window as any).VITE_SUPABASE_URL || 
                   (window as any).SUPABASE_URL || 
                   ''

      supabaseAnonKey = (window as any).REACT_APP_SUPABASE_ANON_KEY || 
                       (window as any).VITE_SUPABASE_ANON_KEY || 
                       (window as any).SUPABASE_ANON_KEY || 
                       ''
    }

    // Check process.env if it exists (Node.js environment or bundler that exposes it)
    if (typeof process !== 'undefined' && process.env) {
      supabaseUrl = supabaseUrl || 
                   process.env.REACT_APP_SUPABASE_URL || 
                   process.env.VITE_SUPABASE_URL || 
                   process.env.SUPABASE_URL || 
                   ''

      supabaseAnonKey = supabaseAnonKey ||
                       process.env.REACT_APP_SUPABASE_ANON_KEY || 
                       process.env.VITE_SUPABASE_ANON_KEY || 
                       process.env.SUPABASE_ANON_KEY || 
                       ''
    }

    // Check localStorage as last resort (for user-configured credentials)
    if (typeof localStorage !== 'undefined') {
      supabaseUrl = supabaseUrl || localStorage.getItem('supabase_url') || ''
      supabaseAnonKey = supabaseAnonKey || localStorage.getItem('supabase_anon_key') || ''
    }
  } catch (error) {
    console.warn('Error accessing environment variables:', error)
  }

  console.log('🔧 Supabase Config Check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlPreview: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'missing',
    keyPreview: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'missing',
    sources: {
      hasWindow: typeof window !== 'undefined',
      hasProcess: typeof process !== 'undefined',
      hasLocalStorage: typeof localStorage !== 'undefined'
    }
  })

  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    isConfigured: !!(supabaseUrl && supabaseAnonKey)
  }
}

const config = getSupabaseConfig()

// Create a fallback client or real client based on configuration
let supabase: any

if (config.isConfigured) {
  console.log('✅ Creating configured Supabase client')
  try {
    supabase = createClient<Database>(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      global: {
        headers: {
          'x-application': 'edublin-figma-make'
        }
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    supabase = createMockClient()
  }
} else {
  console.warn('⚠️  Supabase not configured - creating mock client')
  supabase = createMockClient()
}

// Create mock client for when Supabase is not configured
function createMockClient() {
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signUp: (credentials: any) => Promise.resolve({ 
        data: { user: null, session: null }, 
        error: { message: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' } 
      }),
      signInWithPassword: (credentials: any) => Promise.resolve({ 
        data: { user: null, session: null }, 
        error: { message: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' } 
      }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: (callback: any) => {
        // Call callback with null immediately and return mock subscription
        setTimeout(() => callback('SIGNED_OUT', null), 0)
        return { 
          data: { 
            subscription: { 
              unsubscribe: () => console.log('Mock auth subscription unsubscribed') 
            } 
          } 
        }
      },
      resetPasswordForEmail: (email: string, options?: any) => Promise.resolve({ 
        error: { message: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' } 
      }),
      verifyOtp: (params: any) => Promise.resolve({ 
        error: { message: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' } 
      })
    },
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) => ({
          single: () => Promise.resolve({ 
            data: null, 
            error: { message: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' }
          }),
          limit: (count: number) => Promise.resolve({ 
            data: [], 
            error: { message: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' }
          })
        }),
        limit: (count: number) => Promise.resolve({ 
          data: [], 
          error: { message: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' }
        })
      }),
      insert: (data: any) => ({
        select: (columns?: string) => ({
          single: () => Promise.resolve({ 
            data: null, 
            error: { message: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' }
          })
        })
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: (columns?: string) => ({
            single: () => Promise.resolve({ 
              data: null, 
              error: { message: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' }
            })
          })
        })
      }),
      delete: () => ({
        eq: (column: string, value: any) => Promise.resolve({ 
          data: null, 
          error: { message: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' }
        })
      })
    }),
    rpc: (functionName: string, params?: any) => Promise.resolve({ 
      data: null, 
      error: { message: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' }
    })
  }
}

// Export configuration status for use in components
export const supabaseConfig = {
  isConfigured: config.isConfigured,
  needsSetup: !config.isConfigured,
  url: config.url,
  hasCredentials: !!(config.url && config.anonKey)
}

// Export types for TypeScript
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export { supabase }

// Utility function to check if Supabase is working
export const testSupabaseConnection = async (): Promise<{ 
  working: boolean, 
  configured: boolean, 
  error?: string 
}> => {
  if (!config.isConfigured) {
    return {
      working: false,
      configured: false,
      error: 'Supabase credentials not configured'
    }
  }

  try {
    // Try a simple operation with short timeout
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 2000)
    )
    
    const testPromise = supabase.from('users').select('id').limit(1)
    
    await Promise.race([testPromise, timeoutPromise])
    
    return {
      working: true,
      configured: true
    }
  } catch (error) {
    console.warn('🔌 Supabase connection test failed:', error)
    return {
      working: false,
      configured: true,
      error: error instanceof Error ? error.message : 'Connection failed'
    }
  }
}

// Helper function to get environment info
export const getEnvironmentInfo = () => {
  let hostname = 'unknown'
  let isProduction = false

  try {
    if (typeof window !== 'undefined') {
      hostname = window.location.hostname
      isProduction = !hostname.includes('localhost') && !hostname.includes('127.0.0.1')
    }
  } catch (error) {
    console.warn('Error getting environment info:', error)
  }

  return {
    isProduction,
    hostname,
    supabaseConfigured: config.isConfigured,
    hasUrl: !!config.url,
    hasKey: !!config.anonKey,
    environment: {
      hasWindow: typeof window !== 'undefined',
      hasProcess: typeof process !== 'undefined',
      hasLocalStorage: typeof localStorage !== 'undefined'
    }
  }
}

// Helper function to set Supabase configuration (for the config modal)
export const setSupabaseConfig = (url: string, anonKey: string): boolean => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('supabase_url', url)
      localStorage.setItem('supabase_anon_key', anonKey)
      return true
    }
    return false
  } catch (error) {
    console.error('Error saving Supabase config:', error)
    return false
  }
}

// Helper function to clear Supabase configuration
export const clearSupabaseConfig = (): boolean => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('supabase_url')
      localStorage.removeItem('supabase_anon_key')
      localStorage.removeItem('supabase_config_skipped')
      return true
    }
    return false
  } catch (error) {
    console.error('Error clearing Supabase config:', error)
    return false
  }
}