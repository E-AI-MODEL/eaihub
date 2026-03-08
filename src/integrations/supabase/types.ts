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
      chat_messages: {
        Row: {
          analysis: Json | null
          content: string
          created_at: string
          id: string
          mechanical: Json | null
          role: string
          session_id: string
        }
        Insert: {
          analysis?: Json | null
          content: string
          created_at?: string
          id?: string
          mechanical?: Json | null
          role: string
          session_id: string
        }
        Update: {
          analysis?: Json | null
          content?: string
          created_at?: string
          id?: string
          mechanical?: Json | null
          role?: string
          session_id?: string
        }
        Relationships: []
      }
      mastery: {
        Row: {
          created_at: string
          current_node_id: string | null
          history: Json
          id: string
          path_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_node_id?: string | null
          history?: Json
          id?: string
          path_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_node_id?: string | null
          history?: Json
          id?: string
          path_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plugin_assignments: {
        Row: {
          assigned_to_role: Database["public"]["Enums"]["app_role"] | null
          assigned_to_user_id: string | null
          created_at: string
          created_by: string
          id: string
          is_enabled: boolean
          plugin_id: string
          school_id: string
        }
        Insert: {
          assigned_to_role?: Database["public"]["Enums"]["app_role"] | null
          assigned_to_user_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_enabled?: boolean
          plugin_id: string
          school_id: string
        }
        Update: {
          assigned_to_role?: Database["public"]["Enums"]["app_role"] | null
          assigned_to_user_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_enabled?: boolean
          plugin_id?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plugin_assignments_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "school_ssot"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          school_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          school_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          school_id?: string | null
        }
        Relationships: []
      }
      school_ssot: {
        Row: {
          based_on_version: string
          change_notes: string | null
          created_at: string
          created_by: string
          effective_hash: string | null
          id: string
          is_active: boolean
          plugin_json: Json
          school_id: string
          school_name: string
          updated_at: string
        }
        Insert: {
          based_on_version: string
          change_notes?: string | null
          created_at?: string
          created_by: string
          effective_hash?: string | null
          id?: string
          is_active?: boolean
          plugin_json?: Json
          school_id: string
          school_name: string
          updated_at?: string
        }
        Update: {
          based_on_version?: string
          change_notes?: string | null
          created_at?: string
          created_by?: string
          effective_hash?: string | null
          id?: string
          is_active?: boolean
          plugin_json?: Json
          school_id?: string
          school_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      ssot_changes: {
        Row: {
          action: string
          change_notes: string | null
          created_at: string
          id: string
          performed_by: string
          plugin_id: string
          previous_plugin_id: string | null
          school_id: string
        }
        Insert: {
          action: string
          change_notes?: string | null
          created_at?: string
          id?: string
          performed_by: string
          plugin_id: string
          previous_plugin_id?: string | null
          school_id: string
        }
        Update: {
          action?: string
          change_notes?: string | null
          created_at?: string
          id?: string
          performed_by?: string
          plugin_id?: string
          previous_plugin_id?: string | null
          school_id?: string
        }
        Relationships: []
      }
      student_sessions: {
        Row: {
          analysis: Json | null
          created_at: string | null
          current_node_id: string | null
          eai_state: Json | null
          id: string
          last_active_at: string | null
          last_message_preview: string | null
          level: string | null
          mechanical: Json | null
          messages_count: number | null
          name: string | null
          plugin_id: string | null
          progress: number | null
          session_id: string
          status: string | null
          subject: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis?: Json | null
          created_at?: string | null
          current_node_id?: string | null
          eai_state?: Json | null
          id?: string
          last_active_at?: string | null
          last_message_preview?: string | null
          level?: string | null
          mechanical?: Json | null
          messages_count?: number | null
          name?: string | null
          plugin_id?: string | null
          progress?: number | null
          session_id: string
          status?: string | null
          subject?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis?: Json | null
          created_at?: string | null
          current_node_id?: string | null
          eai_state?: Json | null
          id?: string
          last_active_at?: string | null
          last_message_preview?: string | null
          level?: string | null
          mechanical?: Json | null
          messages_count?: number | null
          name?: string | null
          plugin_id?: string | null
          progress?: number | null
          session_id?: string
          status?: string | null
          subject?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      teacher_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          session_id: string
          teacher_name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          session_id: string
          teacher_name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          session_id?: string
          teacher_name?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      owns_session: { Args: { _session_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "LEERLING" | "DOCENT" | "ADMIN" | "SUPERUSER"
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
      app_role: ["LEERLING", "DOCENT", "ADMIN", "SUPERUSER"],
    },
  },
} as const
