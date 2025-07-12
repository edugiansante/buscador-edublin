import { supabase, Tables, TablesInsert, TablesUpdate } from './supabase'
import { SearchService } from './search'

export type UserProfile = Tables<'users'>
export type SearchHistory = Tables<'search_criteria'>

export interface UserStats {
  totalSearches: number
  totalMatches: number
  totalContacts: number
  joinedGroups: number
  lastActivity: string
}

export interface UserActivity {
  searches: SearchHistory[]
  contactRequests: any[]
  groupMemberships: any[]
  stats: UserStats
}

export class UserDataService {
  // Get complete user profile with all related data
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting user profile:', error)
      return null
    }
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: TablesUpdate<'users'>): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  }

  // Get user's search history
  static async getSearchHistory(userId: string, limit = 10): Promise<SearchHistory[]> {
    try {
      const { data, error } = await supabase
        .from('search_criteria')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting search history:', error)
      return []
    }
  }

  // Get user activity summary
  static async getUserActivity(userId: string): Promise<UserActivity> {
    try {
      // Get searches
      const searches = await this.getSearchHistory(userId, 20)
      
      // Get contact requests (sent and received)
      const { data: contactRequests, error: contactError } = await supabase
        .from('contact_requests')
        .select(`
          *,
          from_user:users!contact_requests_from_user_id_fkey(nome, foto_url),
          to_user:users!contact_requests_to_user_id_fkey(nome, foto_url),
          search_criteria(cidade_destino, mes_ano)
        `)
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (contactError) throw contactError

      // Calculate stats
      const totalSearches = searches.length
      const totalContacts = contactRequests?.length || 0
      const lastActivity = searches[0]?.created_at || new Date().toISOString()

      // Get matches count for latest search
      let totalMatches = 0
      if (searches.length > 0) {
        try {
          const matches = await SearchService.findMatches(searches[0].id, userId)
          totalMatches = matches.length
        } catch (error) {
          console.warn('Could not get matches count:', error)
        }
      }

      const stats: UserStats = {
        totalSearches,
        totalMatches,
        totalContacts,
        joinedGroups: 0, // TODO: Implement group membership tracking
        lastActivity
      }

      return {
        searches,
        contactRequests: contactRequests || [],
        groupMemberships: [], // TODO: Implement
        stats
      }
    } catch (error) {
      console.error('Error getting user activity:', error)
      
      // Return empty activity on error
      return {
        searches: [],
        contactRequests: [],
        groupMemberships: [],
        stats: {
          totalSearches: 0,
          totalMatches: 0,
          totalContacts: 0,
          joinedGroups: 0,
          lastActivity: new Date().toISOString()
        }
      }
    }
  }

  // Update user interests
  static async updateInterests(userId: string, interests: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          interesses: interests,
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating interests:', error)
      throw error
    }
  }

  // Update WhatsApp settings
  static async updateWhatsAppSettings(userId: string, whatsapp: string, optIn: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          whatsapp: whatsapp,
          whatsapp_opt_in: optIn,
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating WhatsApp settings:', error)
      throw error
    }
  }

  // Delete user account and all related data
  static async deleteUserAccount(userId: string): Promise<void> {
    try {
      // Delete in order due to foreign key constraints
      
      // Delete contact requests
      await supabase
        .from('contact_requests')
        .delete()
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)

      // Delete matches
      await supabase
        .from('matches')
        .delete()
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

      // Delete search criteria
      await supabase
        .from('search_criteria')
        .delete()
        .eq('user_id', userId)

      // Delete user profile (this will also delete the auth user due to cascade)
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting user account:', error)
      throw error
    }
  }

  // Report user (for safety)
  static async reportUser(reporterId: string, reportedUserId: string, reason: string): Promise<void> {
    try {
      // Increment reports count for reported user
      const { error } = await supabase
        .from('users')
        .update({ 
          relatos: supabase.sql`relatos + 1`,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportedUserId)

      if (error) throw error

      // TODO: Create reports table for admin tracking
      console.log(`User ${reportedUserId} reported by ${reporterId} for: ${reason}`)
    } catch (error) {
      console.error('Error reporting user:', error)
      throw error
    }
  }

  // Get popular destinations (for suggestions)
  static async getPopularDestinations(limit = 10): Promise<Array<{ cidade_destino: string; count: number }>> {
    try {
      const { data, error } = await supabase
        .from('search_criteria')
        .select('cidade_destino')

      if (error) throw error

      // Count destinations
      const destinationCounts = data?.reduce((acc: Record<string, number>, item) => {
        acc[item.cidade_destino] = (acc[item.cidade_destino] || 0) + 1
        return acc
      }, {}) || {}

      // Convert to array and sort
      const sorted = Object.entries(destinationCounts)
        .map(([cidade_destino, count]) => ({ cidade_destino, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)

      return sorted
    } catch (error) {
      console.error('Error getting popular destinations:', error)
      return []
    }
  }

  // Get user recommendations based on activity
  static async getUserRecommendations(userId: string): Promise<{
    suggestedDestinations: string[]
    suggestedUsers: string[]
    suggestedGroups: string[]
  }> {
    try {
      const activity = await this.getUserActivity(userId)
      const popularDestinations = await this.getPopularDestinations(5)

      // Simple recommendations based on search history
      const searchedDestinations = activity.searches.map(s => s.cidade_destino)
      const suggestedDestinations = popularDestinations
        .map(d => d.cidade_destino)
        .filter(dest => !searchedDestinations.includes(dest))
        .slice(0, 3)

      return {
        suggestedDestinations,
        suggestedUsers: [], // TODO: Implement based on common interests/destinations
        suggestedGroups: [] // TODO: Implement based on user's search criteria
      }
    } catch (error) {
      console.error('Error getting user recommendations:', error)
      return {
        suggestedDestinations: [],
        suggestedUsers: [],
        suggestedGroups: []
      }
    }
  }

  // Export user data (GDPR compliance)
  static async exportUserData(userId: string): Promise<any> {
    try {
      const [profile, activity] = await Promise.all([
        this.getUserProfile(userId),
        this.getUserActivity(userId)
      ])

      return {
        profile,
        activity,
        exportDate: new Date().toISOString(),
        note: 'This is your complete data from Edublin Connect'
      }
    } catch (error) {
      console.error('Error exporting user data:', error)
      throw error
    }
  }
}