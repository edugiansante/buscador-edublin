import { supabase, Tables, TablesInsert, supabaseConfig } from './supabase'
import { getAppConfig, getRedirectUrls, APP_CONSTANTS } from './config'
import { createDemoUser } from './demo-data'

export type User = Tables<'users'>

export interface SignUpData {
  email: string
  password: string
  nome: string
  idade?: number
  telefone?: string
}

export interface SignInData {
  email: string
  password: string
}

// Global force demo mode flag - can be set externally
let FORCE_DEMO_MODE = false

// Circuit breaker state management - MORE AGGRESSIVE
interface CircuitBreakerState {
  failureCount: number
  lastFailureTime: number
  isOpen: boolean
  nextAttemptTime: number
  permanentDemo: boolean // NEW: Once this is true, never try real mode again
}

// Global circuit breaker state
let circuitBreaker: CircuitBreakerState = {
  failureCount: 0,
  lastFailureTime: 0,
  isOpen: false,
  nextAttemptTime: 0,
  permanentDemo: false
}

// Circuit breaker configuration - MORE AGGRESSIVE
const CIRCUIT_BREAKER_CONFIG = {
  maxFailures: 2, // Reduced from 3 to 2 - fail faster
  resetTimeout: 60000, // Increased from 30s to 60s - longer wait
  failureWindow: 30000, // Reduced from 60s to 30s - shorter window
  permanentDemoAfter: 5, // After 5 total failures, switch to permanent demo
}

// Cache for auth state to avoid repeated calls
let authStateCache: {
  user: User | null
  timestamp: number
  isValid: boolean
} = {
  user: null,
  timestamp: 0,
  isValid: false
}

const CACHE_DURATION = 10000 // Increased to 10 seconds

// Check if we should attempt Supabase operations - MORE RESTRICTIVE
const shouldAttemptSupabaseOperation = (operation: string = 'unknown'): boolean => {
  const now = Date.now()
  
  // Check force demo mode flag
  if (FORCE_DEMO_MODE) {
    console.log(`🎭 Force demo mode active, skipping ${operation}`)
    return false
  }
  
  // Always block if Supabase not configured
  if (!isSupabaseAvailable()) {
    return false
  }
  
  // Check permanent demo mode
  if (circuitBreaker.permanentDemo) {
    console.log(`🎭 Permanent demo mode active, skipping ${operation}`)
    return false
  }
  
  // Check if circuit breaker is open
  if (circuitBreaker.isOpen) {
    if (now >= circuitBreaker.nextAttemptTime) {
      console.log(`🔄 Circuit breaker half-open for ${operation}, attempting reset...`)
      circuitBreaker.isOpen = false
      return true
    } else {
      const remainingTime = Math.ceil((circuitBreaker.nextAttemptTime - now) / 1000)
      console.log(`🚫 Circuit breaker open, blocking ${operation} (${remainingTime}s remaining)`)
      return false
    }
  }
  
  return true
}

// Record operation result for circuit breaker - MORE AGGRESSIVE FAILURE HANDLING
const recordOperationResult = (success: boolean, operation: string) => {
  const now = Date.now()
  
  if (success) {
    console.log(`✅ Operation succeeded: ${operation}`)
    // Only reset failure count if we haven't hit permanent demo threshold
    if (circuitBreaker.failureCount > 0 && !circuitBreaker.permanentDemo) {
      console.log('🔄 Resetting circuit breaker after successful operation')
      circuitBreaker.failureCount = Math.max(0, circuitBreaker.failureCount - 1) // Gradual reset
      circuitBreaker.isOpen = false
    }
  } else {
    console.log(`❌ Operation failed: ${operation}`)
    
    // Count all failures cumulatively
    circuitBreaker.failureCount++
    circuitBreaker.lastFailureTime = now
    
    // Check for permanent demo mode
    if (circuitBreaker.failureCount >= CIRCUIT_BREAKER_CONFIG.permanentDemoAfter) {
      console.log(`🎭 SWITCHING TO PERMANENT DEMO MODE after ${circuitBreaker.failureCount} failures`)
      circuitBreaker.permanentDemo = true
      circuitBreaker.isOpen = true
      FORCE_DEMO_MODE = true
      return
    }
    
    // Open circuit breaker if too many recent failures
    if (circuitBreaker.failureCount >= CIRCUIT_BREAKER_CONFIG.maxFailures) {
      console.log(`🚫 Circuit breaker opened after ${circuitBreaker.failureCount} failures`)
      circuitBreaker.isOpen = true
      circuitBreaker.nextAttemptTime = now + CIRCUIT_BREAKER_CONFIG.resetTimeout
    }
  }
}

// Get adaptive timeout based on circuit breaker state - MUCH MORE AGGRESSIVE
const getAdaptiveTimeout = (baseTimeout: number): number => {
  if (circuitBreaker.permanentDemo || FORCE_DEMO_MODE) {
    return 100 // Almost instant failure
  }
  
  if (circuitBreaker.failureCount > 0) {
    // Much more aggressive reduction
    const reduction = circuitBreaker.failureCount * 300 // 300ms per failure
    return Math.max(baseTimeout - reduction, 500) // Minimum 500ms
  }
  return baseTimeout
}

// Utility function to safely serialize error objects
const serializeError = (error: any) => {
  if (!error) return null
  
  // Handle Supabase errors specifically
  if (error.code || error.message || error.details) {
    return {
      name: error.name || 'Unknown',
      message: error.message || 'No message',
      code: error.code || 'NO_CODE',
      details: error.details || 'No details',
      hint: error.hint || 'No hint'
    }
  }
  
  // Handle standard errors
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  }
  
  // Handle plain objects
  try {
    return JSON.parse(JSON.stringify(error))
  } catch (e) {
    return { toString: error.toString() }
  }
}

// Utility function to create timeout promises with circuit breaker
const withTimeout = <T extends any>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> => {
  const adaptiveTimeout = getAdaptiveTimeout(timeoutMs)
  
  // If in permanent demo or force demo, fail immediately
  if (circuitBreaker.permanentDemo || FORCE_DEMO_MODE) {
    recordOperationResult(false, operation)
    return Promise.reject(new Error(`${operation} blocked - permanent demo mode active`))
  }
  
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => {
      recordOperationResult(false, operation)
      reject(new Error(`${operation} timed out after ${adaptiveTimeout}ms`))
    }, adaptiveTimeout)
  })
  
  return Promise.race([
    promise.then(result => {
      recordOperationResult(true, operation)
      return result
    }).catch(error => {
      recordOperationResult(false, operation)
      throw error
    }),
    timeoutPromise
  ])
}

// Check if Supabase is configured and working
const isSupabaseAvailable = (): boolean => {
  return supabaseConfig.isConfigured && !FORCE_DEMO_MODE && !circuitBreaker.permanentDemo
}

// Check if auth state cache is valid
const isAuthCacheValid = (): boolean => {
  const now = Date.now()
  return authStateCache.isValid && (now - authStateCache.timestamp) < CACHE_DURATION
}

// Update auth state cache
const updateAuthCache = (user: User | null) => {
  authStateCache = {
    user,
    timestamp: Date.now(),
    isValid: true
  }
}

// Clear auth state cache
const clearAuthCache = () => {
  authStateCache.isValid = false
}

// Quick database connectivity test
const quickDatabaseTest = async (): Promise<{ connected: boolean, error?: string }> => {
  if (!shouldAttemptSupabaseOperation('quick database test')) {
    return { 
      connected: false, 
      error: 'Supabase not available or circuit breaker active' 
    }
  }

  try {
    await withTimeout(
      supabase.from('users').select('id').limit(1),
      800, // Very short timeout
      'Quick database test'
    )
    return { connected: true }
  } catch (error) {
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Connection failed'
    }
  }
}

// Check if database tables exist and have the correct schema
const checkDatabaseSetup = async () => {
  console.log('🗄️  Checking database setup...')
  
  if (!isSupabaseAvailable()) {
    console.log('🎭 Supabase not available - returning demo mode status')
    return {
      isSetup: true, // In demo mode, consider it "set up"
      error: null,
      needsSetup: false,
      details: { 
        reason: 'demo_mode',
        supabaseConfigured: supabaseConfig.isConfigured,
        forceDemoMode: FORCE_DEMO_MODE,
        permanentDemo: circuitBreaker.permanentDemo,
        mode: 'demo'
      }
    }
  }

  if (!shouldAttemptSupabaseOperation('database setup check')) {
    console.log('🚫 Circuit breaker preventing database setup check')
    return {
      isSetup: false,
      error: 'Service temporarily unavailable - too many failures',
      needsSetup: false,
      details: { 
        reason: 'circuit_breaker_open',
        failureCount: circuitBreaker.failureCount,
        nextAttempt: circuitBreaker.nextAttemptTime,
        permanentDemo: circuitBreaker.permanentDemo
      }
    }
  }

  // Quick connectivity test first
  const connectTest = await quickDatabaseTest()
  if (!connectTest.connected) {
    console.log('❌ Database connection failed:', connectTest.error)
    return {
      isSetup: false,
      error: 'Database connection failed',
      needsSetup: false,
      details: { 
        reason: 'connection_failed',
        error: connectTest.error,
        supabaseConfigured: true
      }
    }
  }

  try {
    // Check if the table exists with very short timeout
    const { data, error } = await withTimeout(
      supabase.from('users').select('id').limit(1),
      1000,
      'Table existence check'
    )
    
    if (error) {
      const serializedError = serializeError(error)
      console.log('📊 Database setup check result:', serializedError)
      
      // Check for specific error codes
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return {
          isSetup: false,
          error: 'Tables not created',
          needsSetup: true,
          details: serializedError
        }
      }
      
      if (error.code === 'PGRST204' || error.message?.includes('could not find')) {
        return {
          isSetup: false,
          error: 'Schema incomplete - missing columns',
          needsSetup: true,
          details: serializedError
        }
      }

      if (error.code === 'SUPABASE_NOT_CONFIGURED') {
        return {
          isSetup: false,
          error: 'Supabase not configured',
          needsSetup: true,
          details: serializedError
        }
      }
      
      return {
        isSetup: false,
        error: 'Database error',
        needsSetup: false,
        details: serializedError
      }
    }
    
    // Check if required columns exist
    try {
      const { error: schemaError } = await withTimeout(
        supabase
          .from('users')
          .select('id, email, nome, idade, telefone, verificado, premium, relatos')
          .limit(1),
        800,
        'Schema validation'
      )
      
      if (schemaError) {
        const serializedError = serializeError(schemaError)
        console.log('❌ Schema validation failed:', serializedError)
        
        if (schemaError.code === 'PGRST204' || schemaError.message?.includes('could not find')) {
          return {
            isSetup: false,
            error: 'Schema incomplete - missing required columns',
            needsSetup: true,
            details: serializedError
          }
        }
        
        return {
          isSetup: false,
          error: 'Schema validation error',
          needsSetup: true,
          details: serializedError
        }
      }
      
      console.log('✅ Database tables exist and schema is complete')
      return {
        isSetup: true,
        error: null,
        needsSetup: false,
        details: null
      }
    } catch (schemaError) {
      const serializedError = serializeError(schemaError)
      console.error('❌ Schema test exception:', serializedError)
      
      return {
        isSetup: false,
        error: 'Schema validation failed',
        needsSetup: true,
        details: serializedError
      }
    }
    
  } catch (error) {
    const serializedError = serializeError(error)
    console.error('❌ Database setup check exception:', serializedError)
    
    return {
      isSetup: false,
      error: 'Connection error',
      needsSetup: false,
      details: serializedError
    }
  }
}

// Create minimal user data for offline mode or when database is not available
const createMinimalUser = (authUser: any, email?: string): User => {
  return {
    id: authUser?.id || 'offline-user',
    email: authUser?.email || email || 'user@example.com',
    nome: authUser?.user_metadata?.nome || authUser?.user_metadata?.name || 'Usuário',
    idade: authUser?.user_metadata?.idade || null,
    telefone: authUser?.user_metadata?.telefone || null,
    cidade_origem: null,
    whatsapp: null,
    whatsapp_opt_in: false,
    foto_url: null,
    interesses: [],
    verificado: !!authUser?.email_confirmed_at,
    premium: false,
    relatos: 0,
    created_at: authUser?.created_at || new Date().toISOString(),
    updated_at: authUser?.updated_at || new Date().toISOString()
  } as User
}

// Simulate auth delay for better UX
const simulateAuthDelay = (ms: number = 1500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Create demo user based on signup data
const createDemoUserFromSignup = (data: SignUpData): User => {
  const now = new Date().toISOString()
  return {
    id: `demo-user-${Date.now()}`,
    email: data.email,
    nome: data.nome,
    idade: data.idade || null,
    telefone: data.telefone || null,
    cidade_origem: null,
    whatsapp: null,
    whatsapp_opt_in: false,
    foto_url: null,
    interesses: [],
    verificado: true, // Demo users are automatically verified
    premium: false,
    relatos: 0,
    created_at: now,
    updated_at: now
  } as User
}

// Check if user is properly authenticated
const checkUserAuthentication = async (userId: string): Promise<boolean> => {
  if (!supabaseConfig.isConfigured || userId === 'demo-user' || FORCE_DEMO_MODE) {
    return true // Allow demo users
  }

  if (!shouldAttemptSupabaseOperation('user authentication check')) {
    console.log('🚫 Circuit breaker preventing auth check')
    return false
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.warn('⚠️  User not authenticated:', error?.message)
      return false
    }
    
    if (user.id !== userId) {
      console.warn('⚠️  User ID mismatch:', { provided: userId, actual: user.id })
      return false
    }
    
    return true
  } catch (error) {
    console.error('❌ Error checking authentication:', error)
    return false
  }
}

export class AuthService {
  // NEW: Method to force demo mode from external components
  static forceDemoMode(reason: string = 'external request') {
    console.log(`🎭 FORCING DEMO MODE: ${reason}`)
    FORCE_DEMO_MODE = true
    circuitBreaker.permanentDemo = true
    circuitBreaker.isOpen = true
    clearAuthCache()
  }

  // NEW: Method to check if in any form of demo mode
  static isInDemoMode(): boolean {
    return !supabaseConfig.isConfigured || FORCE_DEMO_MODE || circuitBreaker.permanentDemo
  }

  // NEW: Quick connection test that switches to demo on failure
  static async testQuickConnection(): Promise<{ success: boolean, shouldUseDemoMode: boolean }> {
    if (!supabaseConfig.isConfigured) {
      return { success: false, shouldUseDemoMode: true }
    }

    if (FORCE_DEMO_MODE || circuitBreaker.permanentDemo) {
      return { success: false, shouldUseDemoMode: true }
    }

    try {
      // Very quick test with 500ms timeout
      await withTimeout(
        supabase.from('users').select('id').limit(1),
        500,
        'Quick connection test'
      )
      return { success: true, shouldUseDemoMode: false }
    } catch (error) {
      console.warn('⚠️  Quick connection test failed, recommending demo mode')
      // Don't force demo mode here, let the circuit breaker handle it
      return { success: false, shouldUseDemoMode: circuitBreaker.isOpen || circuitBreaker.failureCount >= 2 }
    }
  }

  static async signUp(data: SignUpData) {
    try {
      // If Supabase is not available, simulate signup
      if (!isSupabaseAvailable()) {
        console.log('🎭 Demo mode: Simulating user signup...')
        
        // Simulate API delay
        await simulateAuthDelay(2000)
        
        // Basic email validation
        if (!data.email.includes('@')) {
          throw new Error('Email inválido.')
        }
        
        // Basic password validation
        if (data.password.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres.')
        }
        
        // Create demo user
        const demoUser = createDemoUserFromSignup(data)
        
        // Store demo user in localStorage for persistence
        localStorage.setItem('demo_current_user', JSON.stringify(demoUser))
        updateAuthCache(demoUser)
        
        console.log('✅ Demo signup successful for:', data.email)
        
        // Return mock auth data structure
        return {
          user: {
            id: demoUser.id,
            email: demoUser.email,
            user_metadata: {
              nome: demoUser.nome,
              idade: demoUser.idade,
              telefone: demoUser.telefone
            },
            email_confirmed_at: new Date().toISOString(),
            created_at: demoUser.created_at
          },
          session: {
            user: {
              id: demoUser.id,
              email: demoUser.email
            },
            access_token: 'demo-token',
            expires_at: Date.now() + 3600000 // 1 hour
          }
        }
      }

      if (!shouldAttemptSupabaseOperation('user signup')) {
        throw new Error('Sistema temporariamente indisponível. Tente novamente em alguns momentos.')
      }

      // Real Supabase signup flow
      console.log('🔑 Real mode: Starting Supabase signup...')

      // Quick database check
      const dbCheck = await withTimeout(
        checkDatabaseSetup(),
        1500,
        'Database setup check for signup'
      )
      
      if (!dbCheck.isSetup && dbCheck.needsSetup) {
        console.error('❌ Database not set up - tables need to be created')
        throw new Error('Sistema não configurado. Entre em contato com o suporte.')
      }

      const redirectUrls = getRedirectUrls()
      console.log('🚀 Starting real signup process')

      const { data: authData, error: authError } = await withTimeout(
        supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: redirectUrls.emailConfirmation,
            data: {
              nome: data.nome,
              idade: data.idade,
              telefone: data.telefone
            }
          }
        }),
        2000,
        'User signup'
      )

      if (authError) {
        const serializedError = serializeError(authError)
        console.error('❌ Auth signup error:', serializedError)
        throw authError
      }

      console.log('✅ Auth signup successful')

      // Try to create profile if database is available
      if (authData.user && dbCheck.isSetup) {
        try {
          const userData: TablesInsert<'users'> = {
            id: authData.user.id,
            email: data.email,
            nome: data.nome,
            idade: data.idade || null,
            telefone: data.telefone || null,
            whatsapp_opt_in: false,
            verificado: false,
            premium: false,
            relatos: 0
          }

          await withTimeout(
            supabase.from('users').insert(userData),
            1500,
            'Profile creation'
          )
          
          console.log('✅ User profile created successfully')
        } catch (profileError) {
          console.warn('⚠️  Profile creation failed, but signup successful:', profileError)
        }
      }

      return { user: authData.user, session: authData.session }
    } catch (error: any) {
      const serializedError = serializeError(error)
      console.error('❌ Error in signUp:', serializedError)
      
      if (error instanceof Error && error.message.includes('timed out')) {
        throw new Error('Operação demorou mais que o esperado. Verifique sua conexão.')
      }
      
      if (error.message?.includes('User already registered')) {
        throw new Error('Este email já está cadastrado. Tente fazer login.')
      }
      if (error.message?.includes('Password should be')) {
        throw new Error('A senha deve ter pelo menos 6 caracteres.')
      }
      if (error.message?.includes('Invalid email')) {
        throw new Error('Email inválido.')
      }
      if (error.message?.includes('Sistema não configurado')) {
        throw error
      }
      if (error.message?.includes('temporariamente indisponível')) {
        throw error
      }
      
      throw new Error('Erro ao criar conta. Tente novamente.')
    }
  }

  static async signIn(data: SignInData) {
    try {
      // If Supabase is not available, simulate signin
      if (!isSupabaseAvailable()) {
        console.log('🎭 Demo mode: Simulating user signin...')
        
        // Simulate API delay
        await simulateAuthDelay(1500)
        
        // Check if we have a stored demo user with this email
        const storedUser = localStorage.getItem('demo_current_user')
        if (storedUser) {
          const demoUser = JSON.parse(storedUser)
          if (demoUser.email === data.email) {
            console.log('✅ Demo signin successful for stored user:', data.email)
            updateAuthCache(demoUser)
            return {
              user: demoUser,
              session: {
                user: demoUser,
                access_token: 'demo-token',
                expires_at: Date.now() + 3600000
              }
            }
          }
        }
        
        // Check demo credentials
        if (data.email === 'demo@edublin.com.br' && data.password === 'demo123') {
          const demoUser = createDemoUser()
          localStorage.setItem('demo_current_user', JSON.stringify(demoUser))
          updateAuthCache(demoUser)
          console.log('✅ Demo signin successful with demo credentials')
          return {
            user: demoUser,
            session: {
              user: demoUser,
              access_token: 'demo-token',
              expires_at: Date.now() + 3600000
            }
          }
        }
        
        // Invalid credentials in demo mode
        throw new Error('Email ou senha incorretos. Use demo@edublin.com.br / demo123 ou crie uma conta demo.')
      }

      if (!shouldAttemptSupabaseOperation('user signin')) {
        throw new Error('Sistema temporariamente indisponível. Tente novamente em alguns momentos.')
      }

      // Real Supabase signin flow
      console.log('🔑 Starting real signin process')

      const { data: authData, error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password
        }),
        2000,
        'User signin'
      )

      if (error) {
        const serializedError = serializeError(error)
        console.error('❌ Auth signin error:', serializedError)
        throw error
      }

      console.log('✅ Auth signin successful')

      // Try to get user profile
      if (authData.user) {
        try {
          const { data: userData, error: userError } = await withTimeout(
            supabase.from('users').select('*').eq('id', authData.user.id).single(),
            1500,
            'User profile fetch'
          )

          if (userError && userError.code !== 'PGRST116') {
            console.warn('⚠️  Profile fetch failed:', userError)
          }

          if (userData) {
            console.log('✅ User profile loaded successfully')
            updateAuthCache(userData)
            return { user: userData, session: authData.session }
          } else {
            // Create profile if it doesn't exist
            console.log('💾 Creating missing user profile...')
            const profileData: TablesInsert<'users'> = {
              id: authData.user.id,
              email: authData.user.email || data.email,
              nome: authData.user.user_metadata?.nome || data.email.split('@')[0],
              idade: authData.user.user_metadata?.idade || null,
              telefone: authData.user.user_metadata?.telefone || null,
              whatsapp_opt_in: false,
              verificado: !!authData.user.email_confirmed_at,
              premium: false,
              relatos: 0
            }

            const { data: newUserData } = await withTimeout(
              supabase.from('users').insert(profileData).select().single(),
              1500,
              'Profile creation on login'
            )

            if (newUserData) {
              updateAuthCache(newUserData)
              return { user: newUserData, session: authData.session }
            }
          }
        } catch (profileError) {
          console.warn('⚠️  Profile operations failed, using minimal user:', profileError)
        }

        // Fallback to minimal user
        const minimalUser = createMinimalUser(authData.user, data.email)
        updateAuthCache(minimalUser)
        return {
          user: minimalUser,
          session: authData.session
        }
      }

      return { user: null, session: authData.session }
    } catch (error: any) {
      const serializedError = serializeError(error)
      console.error('❌ Error in signIn:', serializedError)
      
      if (error instanceof Error && error.message.includes('timed out')) {
        throw new Error('Operação demorou mais que o esperado. Verifique sua conexão.')
      }
      
      if (error.message?.includes('Invalid login credentials')) {
        if (!isSupabaseAvailable()) {
          throw new Error('Email ou senha incorretos. Use demo@edublin.com.br / demo123 ou crie uma conta demo.')
        }
        throw new Error('Email ou senha incorretos.')
      }
      if (error.message?.includes('Email not confirmed')) {
        throw new Error('Confirme seu email para fazer login.')
      }
      if (error.message?.includes('Sistema não configurado')) {
        throw error
      }
      if (error.message?.includes('temporariamente indisponível')) {
        throw error
      }
      
      throw new Error('Erro ao fazer login. Tente novamente.')
    }
  }

  static async signOut() {
    try {
      clearAuthCache()
      
      // Clear demo user data
      if (!isSupabaseAvailable()) {
        console.log('🎭 Demo mode: Clearing demo user data')
        localStorage.removeItem('demo_current_user')
        return
      }

      if (!shouldAttemptSupabaseOperation('user signout')) {
        console.log('🚫 Circuit breaker preventing signout, clearing local data')
        localStorage.removeItem('demo_current_user')
        return
      }

      console.log('👋 Signing out user...')
      await withTimeout(
        supabase.auth.signOut(),
        1000,
        'User signout'
      )
      console.log('✅ User signed out successfully')
    } catch (error) {
      console.error('❌ Error signing out:', error)
      // Clear local data anyway
      localStorage.removeItem('demo_current_user')
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      // Check cache first
      if (isAuthCacheValid()) {
        console.log('💾 Using cached auth state')
        return authStateCache.user
      }

      // In demo mode, get user from localStorage
      if (!isSupabaseAvailable()) {
        console.log('🎭 Demo mode: Getting current demo user')
        const storedUser = localStorage.getItem('demo_current_user')
        if (storedUser) {
          const demoUser = JSON.parse(storedUser)
          console.log('✅ Found demo user:', demoUser.nome)
          updateAuthCache(demoUser)
          return demoUser
        }
        console.log('❌ No demo user found')
        updateAuthCache(null)
        return null
      }

      if (!shouldAttemptSupabaseOperation('get current user')) {
        console.log('🚫 Circuit breaker preventing getCurrentUser')
        return null
      }

      console.log('👤 Getting current user...')
      const { data: { user } } = await withTimeout(
        supabase.auth.getUser(),
        1000,
        'Current user fetch'
      )
      
      if (!user) {
        console.log('❌ No authenticated user found')
        updateAuthCache(null)
        return null
      }

      console.log('✅ Found authenticated user')

      // Try to get profile with very short timeout
      try {
        const { data: userData, error } = await withTimeout(
          supabase.from('users').select('*').eq('id', user.id).single(),
          1000,
          'User profile fetch'
        )

        if (error && error.code !== 'PGRST116') {
          console.warn('⚠️  Profile fetch failed, using minimal user:', error)
          const minimalUser = createMinimalUser(user)
          updateAuthCache(minimalUser)
          return minimalUser
        }

        if (userData) {
          console.log('✅ User profile loaded')
          updateAuthCache(userData)
          return userData
        }
      } catch (profileError) {
        console.warn('⚠️  Profile loading failed, using minimal user:', profileError)
      }

      const minimalUser = createMinimalUser(user)
      updateAuthCache(minimalUser)
      return minimalUser
    } catch (error) {
      const serializedError = serializeError(error)
      console.error('❌ Error getting current user:', serializedError)
      updateAuthCache(null)
      return null
    }
  }

  static async updateProfile(userId: string, updates: Partial<User>) {
    try {
      clearAuthCache() // Clear cache on profile update
      
      // In demo mode, update localStorage
      if (!isSupabaseAvailable()) {
        console.log('🎭 Demo mode: Updating demo user profile')
        const storedUser = localStorage.getItem('demo_current_user')
        if (storedUser) {
          const demoUser = JSON.parse(storedUser)
          const updatedUser = {
            ...demoUser,
            ...updates,
            updated_at: new Date().toISOString()
          }
          localStorage.setItem('demo_current_user', JSON.stringify(updatedUser))
          updateAuthCache(updatedUser)
          console.log('✅ Demo profile updated successfully')
          return updatedUser
        }
        throw new Error('Usuário demo não encontrado.')
      }

      if (!shouldAttemptSupabaseOperation('profile update')) {
        throw new Error('Sistema temporariamente indisponível. Tente novamente em alguns momentos.')
      }

      console.log('📝 Updating user profile:', { userId })

      const { data, error } = await withTimeout(
        supabase
          .from('users')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single(),
        1500,
        'Profile update'
      )

      if (error) {
        throw error
      }

      console.log('✅ Profile updated successfully')
      updateAuthCache(data)
      return data
    } catch (error) {
      console.error('❌ Error updating profile:', error)
      if (error instanceof Error && error.message.includes('timed out')) {
        throw new Error('Operação demorou mais que o esperado.')
      }
      if (error instanceof Error && error.message.includes('temporariamente indisponível')) {
        throw error
      }
      throw error
    }
  }

  static async resetPassword(email: string) {
    try {
      // In demo mode, just simulate
      if (!isSupabaseAvailable()) {
        console.log('🎭 Demo mode: Simulating password reset')
        await simulateAuthDelay(1000)
        console.log('✅ Demo password reset email "sent"')
        return
      }

      if (!shouldAttemptSupabaseOperation('password reset')) {
        throw new Error('Sistema temporariamente indisponível. Tente novamente em alguns momentos.')
      }

      const redirectUrls = getRedirectUrls()
      
      await withTimeout(
        supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrls.passwordReset }),
        2000,
        'Password reset email'
      )
      
      console.log('✅ Password reset email sent successfully')
    } catch (error) {
      console.error('❌ Error resetting password:', error)
      if (error instanceof Error && error.message.includes('timed out')) {
        throw new Error('Operação demorou mais que o esperado.')
      }
      if (error instanceof Error && error.message.includes('temporariamente indisponível')) {
        throw error
      }
      throw new Error('Erro ao enviar email de recuperação.')
    }
  }

  static async handleEmailConfirmation() {
    try {
      // In demo mode, always succeed
      if (!isSupabaseAvailable()) {
        console.log('🎭 Demo mode: Simulating email confirmation')
        return { success: true, user: createDemoUser() }
      }

      if (!shouldAttemptSupabaseOperation('email confirmation')) {
        return { success: false, error: 'Sistema temporariamente indisponível.' }
      }

      console.log('📧 Handling email confirmation...')
      
      const { data: { session }, error: sessionError } = await withTimeout(
        supabase.auth.getSession(),
        1500,
        'Session check for email confirmation'
      )
      
      if (sessionError) {
        return { success: false, error: 'Erro ao confirmar email.' }
      }

      if (session?.user) {
        // Try to update profile
        try {
          await withTimeout(
            supabase
              .from('users')
              .update({ verificado: true, updated_at: new Date().toISOString() })
              .eq('id', session.user.id),
            1000,
            'User verification update'
          )
          console.log('✅ User verification updated successfully')
        } catch (updateError) {
          console.warn('⚠️  Failed to update user verification:', updateError)
        }

        return { success: true, user: session.user }
      }

      return { success: false, error: 'Sessão não encontrada.' }
    } catch (error) {
      console.error('❌ Error handling email confirmation:', error)
      if (error instanceof Error && error.message.includes('timed out')) {
        return { success: false, error: 'Operação demorou mais que o esperado.' }
      }
      return { success: false, error: 'Erro ao processar confirmação.' }
    }
  }

  // CRITICAL: NEVER CALL SUPABASE IF NOT AVAILABLE
  static onAuthStateChange(callback: (user: User | null) => void) {
    console.log('👂 Setting up auth state change listener...')
    
    // IMMEDIATE CHECK: Block if any form of demo mode is active
    if (FORCE_DEMO_MODE || circuitBreaker.permanentDemo || !supabaseConfig.isConfigured) {
      console.log('🎭 Demo mode active - setting up demo auth listener (NO SUPABASE CALLS)')
      
      // Check for stored demo user immediately
      const storedUser = localStorage.getItem('demo_current_user')
      if (storedUser) {
        try {
          const demoUser = JSON.parse(storedUser)
          console.log('✅ Found stored demo user:', demoUser.nome)
          updateAuthCache(demoUser)
          setTimeout(() => callback(demoUser), 10) // Almost instant
        } catch (error) {
          console.warn('⚠️  Error parsing stored demo user:', error)
          setTimeout(() => callback(null), 10)
        }
      } else {
        console.log('❌ No stored demo user found')
        setTimeout(() => callback(null), 10)
      }
      
      // Return mock subscription for demo mode
      return { 
        data: { 
          subscription: { 
            unsubscribe: () => console.log('🎭 Demo auth listener unsubscribed') 
          } 
        } 
      }
    }
    
    // CIRCUIT BREAKER CHECK: If circuit is open, use cached data only
    if (circuitBreaker.isOpen) {
      console.log('🚫 Circuit breaker open, using cached auth state only')
      
      if (isAuthCacheValid()) {
        console.log('💾 Using cached auth state due to circuit breaker')
        setTimeout(() => callback(authStateCache.user), 10)
      } else {
        console.log('❌ No valid cache, returning null due to circuit breaker')
        setTimeout(() => callback(null), 10)
      }
      
      // Return mock subscription
      return { 
        data: { 
          subscription: { 
            unsubscribe: () => console.log('🚫 Circuit breaker auth listener unsubscribed') 
          } 
        } 
      }
    }
    
    // REAL MODE: Set up actual Supabase auth listener
    console.log('🔄 Setting up REAL Supabase auth state listener')
    
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Real auth state changed:', { event, hasSession: !!session, userId: session?.user?.id })

      // Final safety check - if circuit breaker opened during session, abort
      if (circuitBreaker.isOpen || FORCE_DEMO_MODE) {
        console.log('🚫 Circuit breaker opened during auth state change, aborting')
        const minimalUser = session?.user ? createMinimalUser(session.user) : null
        updateAuthCache(minimalUser)
        callback(minimalUser)
        return
      }

      if (session?.user) {
        try {
          // ULTRA-SHORT timeout for profile fetch
          const { data: userData, error } = await withTimeout(
            supabase.from('users').select('*').eq('id', session.user.id).single(),
            600, // Reduced to 600ms
            'Get user profile in auth state change'
          )

          if (error) {
            // Handle different types of errors
            if (error.code === 'PGRST116') {
              // User not found in profiles table - create minimal user
              console.log('⚠️  User profile not found, creating minimal user')
              const minimalUser = createMinimalUser(session.user)
              updateAuthCache(minimalUser)
              callback(minimalUser)
              return
            } else {
              console.warn('⚠️  Profile fetch failed, using minimal user:', error)
              const minimalUser = createMinimalUser(session.user)
              updateAuthCache(minimalUser)
              callback(minimalUser)
              return
            }
          }

          if (userData) {
            console.log('✅ User profile loaded in auth state change')
            updateAuthCache(userData)
            callback(userData)
          } else {
            console.log('⚠️  No profile data, using minimal user')
            const minimalUser = createMinimalUser(session.user)
            updateAuthCache(minimalUser)
            callback(minimalUser)
          }
        } catch (error) {
          console.error('❌ Error getting user profile in auth state change:', error)
          
          // Use minimal user as fallback
          console.log('🔄 Using minimal user as fallback due to error')
          const minimalUser = createMinimalUser(session.user)
          updateAuthCache(minimalUser)
          callback(minimalUser)
        }
      } else {
        console.log('❌ No session found, user logged out')
        clearAuthCache()
        callback(null)
      }
    })
  }

  static getEnvironmentInfo() {
    const appConfig = getAppConfig()
    const redirectUrls = getRedirectUrls()
    
    return {
      ...appConfig,
      redirectUrls,
      supabaseConfigured: supabaseConfig.isConfigured,
      isDemoMode: AuthService.isInDemoMode(),
      forceDemoMode: FORCE_DEMO_MODE,
      circuitBreaker: {
        failureCount: circuitBreaker.failureCount,
        isOpen: circuitBreaker.isOpen,
        nextAttemptTime: circuitBreaker.nextAttemptTime,
        permanentDemo: circuitBreaker.permanentDemo
      },
      supabaseConfig: {
        hasCredentials: supabaseConfig.hasCredentials,
        isConfigured: supabaseConfig.isConfigured,
        needsSetup: supabaseConfig.needsSetup
      }
    }
  }

  static async testConnection() {
    try {
      if (!isSupabaseAvailable()) {
        return {
          isSetup: true, // Demo mode is always "set up"
          error: null,
          needsSetup: false,
          details: { reason: 'demo_mode', mode: 'demo' }
        }
      }

      return await withTimeout(
        checkDatabaseSetup(),
        1500,
        'Database connection test'
      )
    } catch (error) {
      const serializedError = serializeError(error)
      console.error('❌ Database connection test exception:', serializedError)
      return { 
        isSetup: false, 
        error: 'Connection test failed', 
        needsSetup: false, 
        details: serializedError 
      }
    }
  }

  static async getDatabaseStatus() {
    return await checkDatabaseSetup()
  }

  static async testDatabaseFunctionality() {
    try {
      if (!isSupabaseAvailable()) {
        return {
          success: true,
          data: { message: 'Demo mode active', mode: 'demo' }
        }
      }

      if (!shouldAttemptSupabaseOperation('database functionality test')) {
        return {
          success: false,
          error: { message: 'Circuit breaker open', code: 'CIRCUIT_BREAKER_OPEN' }
        }
      }

      const { data, error } = await withTimeout(
        supabase.rpc('test_database_setup'),
        1500,
        'Database functionality test'
      )
      
      if (error) {
        return { success: false, error }
      }
      
      return { success: true, data }
    } catch (error) {
      const serializedError = serializeError(error)
      console.error('❌ Database functionality test exception:', serializedError)
      return { success: false, error: serializedError }
    }
  }

  // Demo mode utility methods
  static isDemoMode(): boolean {
    return AuthService.isInDemoMode()
  }

  static getDemoCredentials() {
    return {
      email: 'demo@edublin.com.br',
      password: 'demo123',
      nome: 'Usuário Demo'
    }
  }

  static clearDemoData() {
    localStorage.removeItem('demo_current_user')
    clearAuthCache()
    console.log('🎭 Demo data cleared')
  }

  // Circuit breaker management
  static getCircuitBreakerStatus() {
    return {
      failureCount: circuitBreaker.failureCount,
      isOpen: circuitBreaker.isOpen,
      nextAttemptTime: circuitBreaker.nextAttemptTime,
      timeUntilRetry: circuitBreaker.isOpen ? Math.max(0, circuitBreaker.nextAttemptTime - Date.now()) : 0,
      permanentDemo: circuitBreaker.permanentDemo,
      forceDemoMode: FORCE_DEMO_MODE
    }
  }

  static resetCircuitBreaker() {
    console.log('🔄 Manually resetting circuit breaker')
    circuitBreaker = {
      failureCount: 0,
      lastFailureTime: 0,
      isOpen: false,
      nextAttemptTime: 0,
      permanentDemo: false
    }
    FORCE_DEMO_MODE = false
    clearAuthCache()
  }
}