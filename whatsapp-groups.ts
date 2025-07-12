import { supabase, Tables, TablesInsert } from './supabase'

export type WhatsAppGroup = Tables<'whatsapp_groups'>

export class WhatsAppGroupService {
  static async findOrCreateGroup(cidadeDestino: string, mesAno: string, adminUserId: string): Promise<WhatsAppGroup> {
    try {
      // Try to find existing active group
      const { data: existingGroup, error: findError } = await supabase
        .from('whatsapp_groups')
        .select('*')
        .eq('cidade_destino', cidadeDestino)
        .eq('mes_ano', mesAno)
        .eq('active', true)
        .lt('current_members', 'max_members')
        .single()

      if (existingGroup && !findError) {
        return existingGroup
      }

      // Create new group if none found
      const groupName = `${cidadeDestino} - ${this.formatDate(mesAno)}`
      const groupData: TablesInsert<'whatsapp_groups'> = {
        name: groupName,
        description: `Grupo para intercambistas chegando em ${cidadeDestino} em ${this.formatDate(mesAno)}`,
        cidade_destino: cidadeDestino,
        mes_ano: mesAno,
        invite_link: this.generateInviteLink(cidadeDestino, mesAno),
        admin_user_id: adminUserId,
        max_members: 256, // WhatsApp group limit
        current_members: 1, // Admin joins automatically
        active: true
      }

      const { data: newGroup, error: createError } = await supabase
        .from('whatsapp_groups')
        .insert(groupData)
        .select()
        .single()

      if (createError) throw createError

      return newGroup
    } catch (error) {
      console.error('Error finding or creating group:', error)
      
      // If table doesn't exist yet, create a mock group for demo
      if (error instanceof Error && error.message.includes('does not exist')) {
        return {
          id: `mock-${Date.now()}`,
          name: `${cidadeDestino} - ${this.formatDate(mesAno)}`,
          description: `Grupo para intercambistas chegando em ${cidadeDestino} em ${this.formatDate(mesAno)}`,
          cidade_destino: cidadeDestino,
          mes_ano: mesAno,
          invite_link: this.generateInviteLink(cidadeDestino, mesAno),
          admin_user_id: adminUserId,
          max_members: 256,
          current_members: 1,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
      
      throw error
    }
  }

  static async getGroupInviteLink(cidadeDestino: string, mesAno: string): Promise<string | null> {
    try {
      const { data: group, error } = await supabase
        .from('whatsapp_groups')
        .select('invite_link')
        .eq('cidade_destino', cidadeDestino)
        .eq('mes_ano', mesAno)
        .eq('active', true)
        .single()

      if (error || !group) return null

      return group.invite_link
    } catch (error) {
      console.error('Error getting group invite link:', error)
      return null
    }
  }

  static async updateMemberCount(groupId: string, increment: boolean): Promise<void> {
    try {
      const { data: group, error: fetchError } = await supabase
        .from('whatsapp_groups')
        .select('current_members')
        .eq('id', groupId)
        .single()

      if (fetchError) {
        console.error('Error fetching group for member count update:', fetchError)
        return // Don't throw, just log and continue
      }

      const newCount = increment 
        ? group.current_members + 1 
        : Math.max(0, group.current_members - 1)

      const { error: updateError } = await supabase
        .from('whatsapp_groups')
        .update({ 
          current_members: newCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupId)

      if (updateError) {
        console.error('Error updating member count:', updateError)
      }
    } catch (error) {
      console.error('Error updating member count:', error)
      // Don't throw - this is not critical for user experience
    }
  }

  static async getUserGroups(userId: string): Promise<WhatsAppGroup[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_groups')
        .select('*')
        .eq('admin_user_id', userId)
        .eq('active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error getting user groups:', error)
      return []
    }
  }

  private static generateInviteLink(cidadeDestino: string, mesAno: string): string {
    // In a real implementation, this would integrate with WhatsApp Business API
    // For now, we'll generate a demo link that opens WhatsApp web
    const groupId = `${cidadeDestino.toLowerCase().replace(/\s+/g, '-')}-${mesAno.replace('-', '')}`
    const message = encodeURIComponent(`Olá! Quero participar do grupo de intercambistas para ${cidadeDestino} em ${this.formatDate(mesAno)}. Vi pelo Edublin Connect!`)
    
    // This creates a link that opens WhatsApp with a pre-filled message
    // In production, this would be replaced with actual group invite links
    return `https://wa.me/?text=${message}`
  }

  private static formatDate(mesAno: string): string {
    const [year, month] = mesAno.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }
}