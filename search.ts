import { supabase, Tables, TablesInsert, supabaseConfig } from './supabase'
import { generateDemoProfiles, filterDemoProfiles, DemoSearchResult } from './demo-data'

export type SearchCriteria = Tables<'search_criteria'>
export type SearchCriteriaInsert = TablesInsert<'search_criteria'>

export interface SearchFilters {
  cidadeOrigem: string
  paisDestino: string
  cidadeDestino: string
  escola?: string
  ciaAerea?: string | null
  mesAno: string
}

export interface SearchResult {
  id: string
  nome: string
  idade: number
  cidadeOrigem: string
  cidadeDestino: string
  paisDestino: string
  escola: string
  mesAno: string
  ciaAerea?: string
  whatsappOptIn: boolean
  verificado: boolean
  premium: boolean
  foto?: string
  bio?: string
  interesses: string[]
  matchScore: number
}

// Enhanced types for better search functionality
export interface UserWithCriteria {
  id: string
  nome: string
  idade: number | null
  cidade_origem: string | null
  foto_url: string | null
  verificado: boolean
  premium: boolean
  interesses: string[]
  whatsapp: string | null
  whatsapp_opt_in: boolean
  relatos: number
  search_criteria: Array<{
    id: string
    cidade_destino: string
    pais_destino: string
    escola: string | null
    cia_aerea: string | null
    mes_ano: string
    curso: string | null
  }>
  compatibilidade?: number
}

export interface ContactRequest {
  id: string
  requester_id: string
  target_id: string
  search_criteria_id: string
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

// Convert demo result to search result
const convertDemoToSearchResult = (demo: DemoSearchResult): SearchResult => ({
  id: demo.id,
  nome: demo.nome,
  idade: demo.idade,
  cidadeOrigem: demo.cidadeOrigem,
  cidadeDestino: demo.cidadeDestino,
  paisDestino: demo.paisDestino,
  escola: demo.escola,
  mesAno: demo.mesAno,
  ciaAerea: demo.ciaAerea,
  whatsappOptIn: demo.whatsappOptIn,
  verificado: demo.verificado,
  premium: demo.premium,
  foto: demo.foto,
  bio: demo.bio,
  interesses: demo.interesses,
  matchScore: demo.matchScore
})

// Simulate network delay for demo
const simulateDelay = (ms: number = 1000): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Check if user is properly authenticated
const checkUserAuthentication = async (userId: string): Promise<boolean> => {
  if (!supabaseConfig.isConfigured || userId === 'demo-user') {
    return true // Allow demo users
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

export class SearchService {
  static async saveSearchCriteria(userId: string, filters: SearchFilters): Promise<SearchCriteria> {
    // If Supabase is not configured, return demo data
    if (!supabaseConfig.isConfigured || userId === 'demo-user') {
      console.log('🎭 Demo mode: Simulating search criteria save...')
      await simulateDelay(800) // Simulate API delay
      
      return {
        id: `demo-search-${Date.now()}`,
        user_id: userId,
        cidade_origem: filters.cidadeOrigem,
        pais_destino: filters.paisDestino,
        cidade_destino: filters.cidadeDestino,
        escola: filters.escola || null,
        cia_aerea: filters.ciaAerea || null,
        mes_ano: filters.mesAno,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as SearchCriteria
    }

    try {
      console.log('💾 Saving search criteria:', { userId, filters })

      // Check if user is properly authenticated
      const isAuthenticated = await checkUserAuthentication(userId)
      if (!isAuthenticated) {
        throw new Error('User not properly authenticated')
      }

      const searchData: SearchCriteriaInsert = {
        user_id: userId,
        cidade_origem: filters.cidadeOrigem,
        pais_destino: filters.paisDestino,
        cidade_destino: filters.cidadeDestino,
        escola: filters.escola || null,
        cia_aerea: filters.ciaAerea || null,
        mes_ano: filters.mesAno
      }

      const { data, error } = await supabase
        .from('search_criteria')
        .insert(searchData)
        .select()
        .single()

      if (error) {
        console.error('❌ Error saving search criteria:', error)
        
        // Handle specific RLS errors
        if (error.code === '42501') {
          throw new Error('Não foi possível salvar a busca. Verifique se você está logado corretamente.')
        }
        
        throw error
      }

      console.log('✅ Search criteria saved successfully')
      return data
    } catch (error) {
      console.error('❌ Error in saveSearchCriteria:', error)
      
      // Re-throw with user-friendly message
      if (error instanceof Error) {
        if (error.message.includes('authenticated')) {
          throw new Error('É necessário estar logado para salvar a busca.')
        }
        if (error.message.includes('42501') || error.message.includes('row-level security')) {
          throw new Error('Não foi possível salvar a busca. Tente fazer login novamente.')
        }
      }
      
      throw error
    }
  }

  static async findMatches(searchCriteriaId: string, userId: string): Promise<UserWithCriteria[]> {
    // If Supabase is not configured, return demo data
    if (!supabaseConfig.isConfigured || userId === 'demo-user') {
      console.log('🎭 Demo mode: Generating mock matches...')
      await simulateDelay(1200)
      
      const demoProfiles = generateDemoProfiles(15)
      
      // Convert to UserWithCriteria format
      const matches: UserWithCriteria[] = demoProfiles.map(profile => ({
        id: profile.id,
        nome: profile.nome,
        idade: profile.idade,
        cidade_origem: profile.cidadeOrigem,
        foto_url: `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1494790108755-2616b612b47c' : '1507003211169-0a1dd7228f2d'}?w=150&h=150&fit=crop&crop=face`,
        verificado: profile.verificado,
        premium: profile.premium,
        interesses: profile.interesses,
        whatsapp: profile.whatsappOptIn ? `+5511${Math.floor(Math.random() * 900000000 + 100000000)}` : null,
        whatsapp_opt_in: profile.whatsappOptIn,
        relatos: Math.floor(Math.random() * 3),
        search_criteria: [{
          id: `demo-criteria-${profile.id}`,
          cidade_destino: profile.cidadeDestino,
          pais_destino: profile.paisDestino,
          escola: profile.escola,
          cia_aerea: profile.ciaAerea,
          mes_ano: profile.mesAno,
          curso: null
        }],
        compatibilidade: profile.matchScore
      }))
      
      console.log(`🎯 Generated ${matches.length} demo matches`)
      return matches
    }

    try {
      console.log('🔍 Finding matches for search criteria:', searchCriteriaId)

      // Get the search criteria first
      const { data: criteria, error: criteriaError } = await supabase
        .from('search_criteria')
        .select('*')
        .eq('id', searchCriteriaId)
        .single()

      if (criteriaError || !criteria) {
        console.error('❌ Error getting search criteria:', criteriaError)
        throw new Error('Critérios de busca não encontrados')
      }

      // Find users with similar criteria
      const { data: matches, error: matchError } = await supabase
        .from('users')
        .select(`
          id,
          nome,
          idade,
          cidade_origem,
          foto_url,
          verificado,
          premium,
          interesses,
          whatsapp,
          whatsapp_opt_in,
          relatos,
          search_criteria!inner (
            id,
            cidade_destino,
            pais_destino,
            escola,
            cia_aerea,
            mes_ano,
            curso
          )
        `)
        .eq('search_criteria.pais_destino', criteria.pais_destino)
        .eq('search_criteria.cidade_destino', criteria.cidade_destino)
        .neq('id', userId) // Exclude the searching user
        .limit(20)

      if (matchError) {
        console.error('❌ Error finding matches:', matchError)
        throw matchError
      }

      // Calculate compatibility scores
      const matchesWithScores: UserWithCriteria[] = (matches || []).map(user => {
        let score = 60 // Base score

        // Same origin city
        if (user.cidade_origem === criteria.cidade_origem) {
          score += 15
        }

        // Same school
        if (criteria.escola && user.search_criteria[0]?.escola && 
            user.search_criteria[0].escola.toLowerCase().includes(criteria.escola.toLowerCase())) {
          score += 20
        }

        // Same airline
        if (criteria.cia_aerea && user.search_criteria[0]?.cia_aerea === criteria.cia_aerea) {
          score += 10
        }

        // Similar travel dates
        if (criteria.mes_ano && user.search_criteria[0]?.mes_ano) {
          const [criteriaYear, criteriaMonth] = criteria.mes_ano.split('-')
          const [userYear, userMonth] = user.search_criteria[0].mes_ano.split('-')
          
          if (criteriaYear === userYear) {
            score += 15
            if (Math.abs(parseInt(criteriaMonth) - parseInt(userMonth)) <= 1) {
              score += 10
            }
          }
        }

        // Verification bonus
        if (user.verificado) {
          score += 5
        }

        return {
          ...user,
          compatibilidade: Math.min(100, score)
        }
      })

      // Sort by compatibility score
      const sortedMatches = matchesWithScores.sort((a, b) => (b.compatibilidade || 0) - (a.compatibilidade || 0))

      console.log(`✅ Found ${sortedMatches.length} matches`)
      return sortedMatches
    } catch (error) {
      console.error('❌ Error in findMatches:', error)
      throw error
    }
  }

  static async requestContact(requesterId: string, targetId: string, searchCriteriaId: string, message: string): Promise<ContactRequest> {
    // If Supabase is not configured, return demo data
    if (!supabaseConfig.isConfigured || requesterId === 'demo-user') {
      console.log('🎭 Demo mode: Simulating contact request...')
      await simulateDelay(1000)
      
      return {
        id: `demo-contact-${Date.now()}`,
        requester_id: requesterId,
        target_id: targetId,
        search_criteria_id: searchCriteriaId,
        message,
        status: 'pending',
        created_at: new Date().toISOString()
      } as ContactRequest
    }

    try {
      console.log('📞 Creating contact request:', { requesterId, targetId, searchCriteriaId })

      // Check authentication
      const isAuthenticated = await checkUserAuthentication(requesterId)
      if (!isAuthenticated) {
        throw new Error('User not properly authenticated')
      }

      const { data, error } = await supabase
        .from('contact_requests')
        .insert({
          requester_id: requesterId,
          target_id: targetId,
          search_criteria_id: searchCriteriaId,
          message: message,
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating contact request:', error)
        
        if (error.code === '42501') {
          throw new Error('Não foi possível enviar a solicitação. Verifique se você está logado.')
        }
        
        throw error
      }

      console.log('✅ Contact request created successfully')
      return data as ContactRequest
    } catch (error) {
      console.error('❌ Error in requestContact:', error)
      
      if (error instanceof Error && error.message.includes('authenticated')) {
        throw new Error('É necessário estar logado para solicitar contato.')
      }
      
      throw error
    }
  }

  static async getContactRequests(userId: string): Promise<ContactRequest[]> {
    // If Supabase is not configured, return demo data
    if (!supabaseConfig.isConfigured || userId === 'demo-user') {
      console.log('🎭 Demo mode: Returning mock contact requests...')
      await simulateDelay(600)
      
      return [
        {
          id: 'demo-contact-1',
          requester_id: 'demo-user-1',
          target_id: userId,
          search_criteria_id: 'demo-criteria-1',
          message: 'Olá! Vi que você também vai para Toronto. Gostaria de conversar sobre o intercâmbio!',
          status: 'pending',
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ] as ContactRequest[]
    }

    try {
      console.log('📥 Getting contact requests for user:', userId)

      const { data, error } = await supabase
        .from('contact_requests')
        .select('*')
        .eq('target_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error getting contact requests:', error)
        throw error
      }

      console.log(`✅ Found ${data?.length || 0} contact requests`)
      return data as ContactRequest[] || []
    } catch (error) {
      console.error('❌ Error in getContactRequests:', error)
      throw error
    }
  }

  static async searchUsers(filters: SearchFilters): Promise<SearchResult[]> {
    // If Supabase is not configured, use demo data
    if (!supabaseConfig.isConfigured) {
      console.log('🎭 Demo mode: Using simulated search results...')
      await simulateDelay(1500) // Simulate search delay
      
      const demoProfiles = generateDemoProfiles(20)
      const filteredProfiles = filterDemoProfiles(demoProfiles, filters)
      
      console.log(`🎯 Demo search found ${filteredProfiles.length} results`)
      return filteredProfiles.slice(0, 12).map(convertDemoToSearchResult)
    }

    try {
      console.log('🔍 Searching for users with filters:', filters)

      // Build the query
      let query = supabase
        .from('users')
        .select(`
          id,
          nome,
          idade,
          cidade_origem,
          foto_url,
          verificado,
          premium,
          interesses,
          search_criteria!inner (
            cidade_destino,
            pais_destino,
            escola,
            cia_aerea,
            mes_ano
          )
        `)

      // Apply filters
      query = query
        .eq('search_criteria.pais_destino', filters.paisDestino)
        .eq('search_criteria.cidade_destino', filters.cidadeDestino)

      // Optional filters
      if (filters.escola) {
        query = query.ilike('search_criteria.escola', `%${filters.escola}%`)
      }

      if (filters.ciaAerea) {
        query = query.eq('search_criteria.cia_aerea', filters.ciaAerea)
      }

      // Date range filter (same year or ±2 months)
      const [searchYear, searchMonth] = filters.mesAno.split('-')
      query = query.gte('search_criteria.mes_ano', `${searchYear}-01`)
        .lte('search_criteria.mes_ano', `${searchYear}-12`)

      const { data, error } = await query.limit(20)

      if (error) {
        console.error('❌ Error searching users:', error)
        throw error
      }

      console.log(`✅ Found ${data?.length || 0} users`)

      // Transform and calculate match scores
      const results: SearchResult[] = (data || []).map((user: any) => {
        let matchScore = 60 // Base score

        // City origin similarity
        if (user.cidade_origem === filters.cidadeOrigem) {
          matchScore += 15
        }

        // School similarity
        if (filters.escola && user.search_criteria.escola?.toLowerCase().includes(filters.escola.toLowerCase())) {
          matchScore += 20
        }

        // Airline similarity
        if (filters.ciaAerea && user.search_criteria.cia_aerea === filters.ciaAerea) {
          matchScore += 10
        }

        // Date proximity
        const [userYear, userMonth] = user.search_criteria.mes_ano.split('-')
        if (userYear === searchYear) {
          matchScore += 15
          if (Math.abs(parseInt(searchMonth) - parseInt(userMonth)) <= 1) {
            matchScore += 10
          }
        }

        // Verification bonus
        if (user.verificado) {
          matchScore += 5
        }

        return {
          id: user.id,
          nome: user.nome,
          idade: user.idade,
          cidadeOrigem: user.cidade_origem,
          cidadeDestino: user.search_criteria.cidade_destino,
          paisDestino: user.search_criteria.pais_destino,
          escola: user.search_criteria.escola || '',
          mesAno: user.search_criteria.mes_ano,
          ciaAerea: user.search_criteria.cia_aerea,
          whatsappOptIn: true, // Assume true for found users
          verificado: user.verificado,
          premium: user.premium,
          foto: user.foto_url,
          interesses: user.interesses || [],
          matchScore: Math.min(100, matchScore)
        }
      })

      // Sort by match score
      return results.sort((a, b) => b.matchScore - a.matchScore)
    } catch (error) {
      console.error('❌ Error in searchUsers:', error)
      throw error
    }
  }

  static async getUserSearchHistory(userId: string): Promise<SearchCriteria[]> {
    // If Supabase is not configured, return demo data
    if (!supabaseConfig.isConfigured || userId === 'demo-user') {
      console.log('🎭 Demo mode: Returning mock search history...')
      await simulateDelay(500)
      
      return [
        {
          id: 'demo-history-1',
          user_id: userId,
          cidade_origem: 'São Paulo, SP',
          pais_destino: 'Canadá',
          cidade_destino: 'Toronto',
          escola: 'University of Toronto',
          cia_aerea: 'Air Canada',
          mes_ano: '2026-03',
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          updated_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'demo-history-2',
          user_id: userId,
          cidade_origem: 'São Paulo, SP',
          pais_destino: 'Reino Unido',
          cidade_destino: 'Londres',
          escola: 'London School of Economics',
          cia_aerea: null,
          mes_ano: '2026-01',
          created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          updated_at: new Date(Date.now() - 172800000).toISOString()
        }
      ] as SearchCriteria[]
    }

    try {
      console.log('📚 Getting search history for user:', userId)

      const { data, error } = await supabase
        .from('search_criteria')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('❌ Error getting search history:', error)
        throw error
      }

      console.log(`✅ Found ${data?.length || 0} search history items`)
      return data || []
    } catch (error) {
      console.error('❌ Error in getUserSearchHistory:', error)
      throw error
    }
  }

  static async deleteSearchCriteria(id: string): Promise<void> {
    // If Supabase is not configured, simulate deletion
    if (!supabaseConfig.isConfigured) {
      console.log('🎭 Demo mode: Simulating search criteria deletion...')
      await simulateDelay(300)
      return
    }

    try {
      console.log('🗑️ Deleting search criteria:', id)

      const { error } = await supabase
        .from('search_criteria')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('❌ Error deleting search criteria:', error)
        throw error
      }

      console.log('✅ Search criteria deleted successfully')
    } catch (error) {
      console.error('❌ Error in deleteSearchCriteria:', error)
      throw error
    }
  }

  static async getPopularDestinations(): Promise<Array<{ pais: string; cidade: string; count: number }>> {
    // If Supabase is not configured, return demo data
    if (!supabaseConfig.isConfigured) {
      console.log('🎭 Demo mode: Returning popular destinations...')
      await simulateDelay(400)
      
      return [
        { pais: 'Canadá', cidade: 'Toronto', count: 45 },
        { pais: 'Estados Unidos', cidade: 'Nova York', count: 38 },
        { pais: 'Reino Unido', cidade: 'Londres', count: 32 },
        { pais: 'Austrália', cidade: 'Sydney', count: 28 },
        { pais: 'Irlanda', cidade: 'Dublin', count: 25 },
        { pais: 'França', cidade: 'Paris', count: 22 },
        { pais: 'Alemanha', cidade: 'Berlim', count: 19 },
        { pais: 'Espanha', cidade: 'Madri', count: 16 }
      ]
    }

    try {
      console.log('🌍 Getting popular destinations...')

      const { data, error } = await supabase
        .from('search_criteria')
        .select('pais_destino, cidade_destino')

      if (error) {
        console.error('❌ Error getting popular destinations:', error)
        throw error
      }

      // Count destinations
      const destinationCounts: { [key: string]: number } = {}
      data?.forEach(item => {
        const key = `${item.pais_destino}|${item.cidade_destino}`
        destinationCounts[key] = (destinationCounts[key] || 0) + 1
      })

      // Convert to array and sort
      const popularDestinations = Object.entries(destinationCounts)
        .map(([key, count]) => {
          const [pais, cidade] = key.split('|')
          return { pais, cidade, count }
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      console.log(`✅ Found ${popularDestinations.length} popular destinations`)
      return popularDestinations
    } catch (error) {
      console.error('❌ Error in getPopularDestinations:', error)
      throw error
    }
  }

  // Demo mode utility functions
  static isDemoMode(): boolean {
    return !supabaseConfig.isConfigured
  }

  static getDemoMessage(): string {
    const messages = [
      'Dados simulados para demonstração',
      'Usando perfis de exemplo',
      'Modo demonstração ativo',
      'Resultados simulados'
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }
}