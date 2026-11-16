export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      friend_devices: {
        Row: {
          code: string
          completed: number
          daily_results: Json | null
          day: string | null
          hcp: number | null
          id: string
          name: string
          request_at: string | null
          short_code: string | null
          token_hash: string
          updated_at: string
        }
        Insert: {
          code?: string
          completed?: number
          daily_results?: Json | null
          day?: string | null
          hcp?: number | null
          id: string
          name?: string
          request_at?: string | null
          short_code?: string | null
          token_hash: string
          updated_at?: string
        }
        Update: {
          code?: string
          completed?: number
          daily_results?: Json | null
          day?: string | null
          hcp?: number | null
          id?: string
          name?: string
          request_at?: string | null
          short_code?: string | null
          token_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      friend_links: {
        Row: {
          recipient: string
          sender: string
          status: string
        }
        Insert: {
          recipient: string
          sender: string
          status?: string
        }
        Update: {
          recipient?: string
          sender?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_links_recipient_fkey"
            columns: ["recipient"]
            isOneToOne: false
            referencedRelation: "friend_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_links_sender_fkey"
            columns: ["sender"]
            isOneToOne: false
            referencedRelation: "friend_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_players: {
        Row: {
          country: string
          device_id: string
          enabled: boolean
          name: string
          platform: string
        }
        Insert: {
          country: string
          device_id: string
          enabled?: boolean
          name: string
          platform: string
        }
        Update: {
          country?: string
          device_id?: string
          enabled?: boolean
          name?: string
          platform?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_players_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: true
            referencedRelation: "friend_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_rounds: {
        Row: {
          day: string
          device_id: string
          score: number
          slot: number
        }
        Insert: {
          day: string
          device_id: string
          score: number
          slot: number
        }
        Update: {
          day?: string
          device_id?: string
          score?: number
          slot?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_rounds_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "monthly_players"
            referencedColumns: ["device_id"]
          },
        ]
      }
      player_scores: {
        Row: {
          country: string
          device_id: string
          played: number
          updated_at: string
          wins: number
          write_token_hash: string | null
        }
        Insert: {
          country: string
          device_id: string
          played?: number
          updated_at?: string
          wins?: number
          write_token_hash?: string | null
        }
        Update: {
          country?: string
          device_id?: string
          played?: number
          updated_at?: string
          wins?: number
          write_token_hash?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      friends_action: {
        Args: {
          p_action: string
          p_code?: string
          p_completed?: number
          p_day?: string
          p_device: string
          p_hcp?: number
          p_name?: string
          p_target?: string
          p_token: string
        }
        Returns: Json
      }
      friends_daily_action: {
        Args: {
          p_action: string
          p_code?: string
          p_completed?: number
          p_day?: string
          p_device: string
          p_hcp?: number
          p_name?: string
          p_results?: Json
          p_target?: string
          p_token: string
        }
        Returns: Json
      }
      global_monthly_board: {
        Args: {
          p_action?: string
          p_country?: string
          p_device: string
          p_month: string
          p_name?: string
          p_platform?: string
          p_rounds?: Json
          p_token: string
        }
        Returns: Json
      }
      monthly_board: {
        Args: {
          p_action?: string
          p_country: string
          p_device: string
          p_month: string
          p_name?: string
          p_platform?: string
          p_rounds?: Json
          p_token: string
        }
        Returns: Json
      }
      new_friend_code: { Args: never; Returns: string }
      submit_score:
        | {
            Args: {
              p_country: string
              p_device: string
              p_played: number
              p_wins: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_country: string
              p_device: string
              p_played: number
              p_token: string
              p_wins: number
            }
            Returns: Json
          }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
