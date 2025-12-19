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
      events: {
        Row: {
          id: string
          created_at: string
          event_name: string
          event_type: string // 'Count', 'Scale', 'Yes-No', etc.
          scale_label: string | null
          scale_max: number | null
          position: number
          color: string
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          event_name: string
          event_type: string
          scale_label?: string | null
          scale_max?: number | null
          position?: number
          color?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          event_name?: string
          event_type?: string
          scale_label?: string | null
          scale_max?: number | null
          position?: number
          color?: string
          user_id?: string | null
        }
      }
      logs: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          event_id: string
          event_name: string
          value: number
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          event_id: string
          event_name: string
          value: number
          user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          event_id?: string
          event_name?: string
          value?: number
          user_id?: string | null
        }
      }
      notes: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description?: string | null
          event_id: string
          start_date?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string | null
          event_id?: string
          start_date?: string
          user_id?: string | null
        }
      }
      users: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          description?: string | null
          event_id?: string
          start_date?: string
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
  }
}
