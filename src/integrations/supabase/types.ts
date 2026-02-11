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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type: string
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_players: {
        Row: {
          broker_user_id: string
          created_at: string
          id: string
          player_user_id: string
          tenant_id: string
        }
        Insert: {
          broker_user_id: string
          created_at?: string
          id?: string
          player_user_id: string
          tenant_id: string
        }
        Update: {
          broker_user_id?: string
          created_at?: string
          id?: string
          player_user_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_players_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      config_versions: {
        Row: {
          config_data: Json
          config_type: string
          created_at: string
          created_by: string
          id: string
          name: string
          published_at: string | null
          published_by: string | null
          status: Database["public"]["Enums"]["config_status"]
          tenant_id: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          config_data?: Json
          config_type: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          published_at?: string | null
          published_by?: string | null
          status?: Database["public"]["Enums"]["config_status"]
          tenant_id: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          config_data?: Json
          config_type?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          published_at?: string | null
          published_by?: string | null
          status?: Database["public"]["Enums"]["config_status"]
          tenant_id?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_versions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      game_players: {
        Row: {
          bet: number
          chips: number
          game_session_id: string
          hand: Json | null
          has_folded: boolean
          id: string
          is_current: boolean
          joined_at: string
          seat_position: number
          tenant_id: string
          user_id: string
        }
        Insert: {
          bet?: number
          chips?: number
          game_session_id: string
          hand?: Json | null
          has_folded?: boolean
          id?: string
          is_current?: boolean
          joined_at?: string
          seat_position: number
          tenant_id: string
          user_id: string
        }
        Update: {
          bet?: number
          chips?: number
          game_session_id?: string
          hand?: Json | null
          has_folded?: boolean
          id?: string
          is_current?: boolean
          joined_at?: string
          seat_position?: number
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_players_game_session_id_fkey"
            columns: ["game_session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_players_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          created_at: string
          current_player_index: number | null
          dealer_index: number
          ended_at: string | null
          game_state: Json | null
          game_table_id: string
          id: string
          pot: number
          round: number
          started_at: string | null
          status: Database["public"]["Enums"]["game_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_player_index?: number | null
          dealer_index?: number
          ended_at?: string | null
          game_state?: Json | null
          game_table_id: string
          id?: string
          pot?: number
          round?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["game_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_player_index?: number | null
          dealer_index?: number
          ended_at?: string | null
          game_state?: Json | null
          game_table_id?: string
          id?: string
          pot?: number
          round?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["game_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_game_table_id_fkey"
            columns: ["game_table_id"]
            isOneToOne: false
            referencedRelation: "game_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      game_tables: {
        Row: {
          big_blind: number
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_private: boolean
          max_buy_in: number
          max_players: number
          min_buy_in: number
          name: string
          rake_percentage: number
          room_code: string | null
          room_type: string
          small_blind: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          big_blind?: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_private?: boolean
          max_buy_in?: number
          max_players?: number
          min_buy_in?: number
          name: string
          rake_percentage?: number
          room_code?: string | null
          room_type?: string
          small_blind?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          big_blind?: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_private?: boolean
          max_buy_in?: number
          max_players?: number
          min_buy_in?: number
          name?: string
          rake_percentage?: number
          room_code?: string | null
          room_type?: string
          small_blind?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_tables_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          is_active: boolean
          tenant_id: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
          tenant_id?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          settings: Json | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          reference_id: string | null
          tenant_id: string | null
          type: Database["public"]["Enums"]["wallet_tx_type"]
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          tenant_id?: string | null
          type: Database["public"]["Enums"]["wallet_tx_type"]
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          tenant_id?: string | null
          type?: Database["public"]["Enums"]["wallet_tx_type"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          available: number
          bonus: number
          created_at: string
          id: string
          locked: number
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          available?: number
          bonus?: number
          created_at?: string
          id?: string
          locked?: number
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          available?: number
          bonus?: number
          created_at?: string
          id?: string
          locked?: number
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      game_players_public: {
        Row: {
          bet: number | null
          chips: number | null
          game_session_id: string | null
          has_folded: boolean | null
          id: string | null
          is_current: boolean | null
          joined_at: string | null
          seat_position: number | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          bet?: number | null
          chips?: number | null
          game_session_id?: string | null
          has_folded?: boolean | null
          id?: string | null
          is_current?: boolean | null
          joined_at?: string | null
          seat_position?: number | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          bet?: number | null
          chips?: number | null
          game_session_id?: string | null
          has_folded?: boolean | null
          id?: string | null
          is_current?: boolean | null
          joined_at?: string | null
          seat_position?: number | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_players_game_session_id_fkey"
            columns: ["game_session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_players_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_user_role: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_tenant_access: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      is_broker_of_player: {
        Args: { _broker_user_id: string; _player_user_id: string }
        Returns: boolean
      }
      is_master_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_player_in_session: {
        Args: { _session_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin_of_tenant: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      lookup_table_by_code: { Args: { _room_code: string }; Returns: string }
      process_wallet_transaction: {
        Args: {
          _amount: number
          _description?: string
          _metadata?: Json
          _reference_id?: string
          _type: Database["public"]["Enums"]["wallet_tx_type"]
          _wallet_id: string
        }
        Returns: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          reference_id: string | null
          tenant_id: string | null
          type: Database["public"]["Enums"]["wallet_tx_type"]
          wallet_id: string
        }
        SetofOptions: {
          from: "*"
          to: "wallet_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "master_super_admin" | "super_admin" | "broker" | "player"
      config_status: "draft" | "validated" | "published"
      game_status: "waiting" | "playing" | "finished"
      wallet_tx_type:
        | "deposit"
        | "withdrawal"
        | "bet"
        | "win"
        | "rake"
        | "bonus"
        | "transfer"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["master_super_admin", "super_admin", "broker", "player"],
      config_status: ["draft", "validated", "published"],
      game_status: ["waiting", "playing", "finished"],
      wallet_tx_type: [
        "deposit",
        "withdrawal",
        "bet",
        "win",
        "rake",
        "bonus",
        "transfer",
      ],
    },
  },
} as const
