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
          event_type: 'boolean' | 'scale'
          scale_label: string | null
          scale_max: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          event_name: string
          event_type: 'boolean' | 'scale'
          scale_label?: string | null
          scale_max?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          event_name?: string
          event_type?: 'boolean' | 'scale'
          scale_label?: string | null
          scale_max?: number | null
        }
      }
      logs: {
        Row: {
          id: string
          created_at: string
          event_id: string
          event_name: string
          value: number
        }
        Insert: {
          id?: string
          created_at?: string
          event_id: string
          event_name: string
          value: number
        }
        Update: {
          id?: string
          created_at?: string
          event_id?: string
          event_name?: string
          value?: number
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
