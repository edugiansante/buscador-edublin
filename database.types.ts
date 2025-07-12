export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          nome: string
          idade: number | null
          cidade_origem: string | null
          telefone: string | null
          whatsapp: string | null
          whatsapp_opt_in: boolean
          foto_url: string | null
          interesses: string[] | null
          verificado: boolean
          premium: boolean
          relatos: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          nome: string
          idade?: number | null
          cidade_origem?: string | null
          telefone?: string | null
          whatsapp?: string | null
          whatsapp_opt_in?: boolean
          foto_url?: string | null
          interesses?: string[] | null
          verificado?: boolean
          premium?: boolean
          relatos?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nome?: string
          idade?: number | null
          cidade_origem?: string | null
          telefone?: string | null
          whatsapp?: string | null
          whatsapp_opt_in?: boolean
          foto_url?: string | null
          interesses?: string[] | null
          verificado?: boolean
          premium?: boolean
          relatos?: number
          created_at?: string
          updated_at?: string
        }
      }
      search_criteria: {
        Row: {
          id: string
          user_id: string
          cidade_origem: string
          pais_destino: string
          cidade_destino: string
          escola: string | null
          cia_aerea: string | null
          mes_ano: string
          curso: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          cidade_origem: string
          pais_destino: string
          cidade_destino: string
          escola?: string | null
          cia_aerea?: string | null
          mes_ano: string
          curso?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          cidade_origem?: string
          pais_destino?: string
          cidade_destino?: string
          escola?: string | null
          cia_aerea?: string | null
          mes_ano?: string
          curso?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          user_id: string
          matched_user_id: string
          search_criteria_id: string
          compatibilidade: number
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          matched_user_id: string
          search_criteria_id: string
          compatibilidade: number
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          matched_user_id?: string
          search_criteria_id?: string
          compatibilidade?: number
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      contact_requests: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          search_criteria_id: string
          status: 'pending' | 'approved' | 'rejected'
          message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          search_criteria_id: string
          status?: 'pending' | 'approved' | 'rejected'
          message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          search_criteria_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_user_id: string
          reason: string
          description: string | null
          status: 'pending' | 'reviewed' | 'resolved'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_user_id: string
          reason: string
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          reported_user_id?: string
          reason?: string
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved'
          created_at?: string
          updated_at?: string
        }
      }
      whatsapp_groups: {
        Row: {
          id: string
          name: string
          description: string | null
          cidade_destino: string
          mes_ano: string
          invite_link: string
          admin_user_id: string
          max_members: number
          current_members: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          cidade_destino: string
          mes_ano: string
          invite_link: string
          admin_user_id: string
          max_members?: number
          current_members?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          cidade_destino?: string
          mes_ano?: string
          invite_link?: string
          admin_user_id?: string
          max_members?: number
          current_members?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}