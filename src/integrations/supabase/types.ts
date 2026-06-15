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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      findings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          kind: string
          location: string | null
          metadata: Json
          owner_id: string
          project_id: string
          run_id: string | null
          severity: Database["public"]["Enums"]["finding_severity"]
          status: Database["public"]["Enums"]["finding_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          kind: string
          location?: string | null
          metadata?: Json
          owner_id: string
          project_id: string
          run_id?: string | null
          severity?: Database["public"]["Enums"]["finding_severity"]
          status?: Database["public"]["Enums"]["finding_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          location?: string | null
          metadata?: Json
          owner_id?: string
          project_id?: string
          run_id?: string | null
          severity?: Database["public"]["Enums"]["finding_severity"]
          status?: Database["public"]["Enums"]["finding_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "findings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "findings_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "qa_runs"
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
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          default_branch: string
          gates_config: Json
          id: string
          name: string
          owner_id: string
          repo_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_branch?: string
          gates_config?: Json
          id?: string
          name: string
          owner_id: string
          repo_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_branch?: string
          gates_config?: Json
          id?: string
          name?: string
          owner_id?: string
          repo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      qa_runs: {
        Row: {
          branch: string | null
          commit_sha: string | null
          created_at: string
          finished_at: string | null
          id: string
          owner_id: string
          project_id: string
          started_at: string
          status: Database["public"]["Enums"]["run_status"]
          summary: Json
          trigger: string
        }
        Insert: {
          branch?: string | null
          commit_sha?: string | null
          created_at?: string
          finished_at?: string | null
          id?: string
          owner_id: string
          project_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["run_status"]
          summary?: Json
          trigger?: string
        }
        Update: {
          branch?: string | null
          commit_sha?: string | null
          created_at?: string
          finished_at?: string | null
          id?: string
          owner_id?: string
          project_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["run_status"]
          summary?: Json
          trigger?: string
        }
        Relationships: [
          {
            foreignKeyName: "qa_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      run_gates: {
        Row: {
          created_at: string
          duration_ms: number | null
          id: string
          name: string
          ordering: number
          output: Json
          owner_id: string
          phase: string
          run_id: string
          status: Database["public"]["Enums"]["gate_status"]
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          name: string
          ordering?: number
          output?: Json
          owner_id: string
          phase: string
          run_id: string
          status?: Database["public"]["Enums"]["gate_status"]
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          name?: string
          ordering?: number
          output?: Json
          owner_id?: string
          phase?: string
          run_id?: string
          status?: Database["public"]["Enums"]["gate_status"]
        }
        Relationships: [
          {
            foreignKeyName: "run_gates_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "qa_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
    }
    Enums: {
      app_role: "admin" | "member"
      finding_severity: "info" | "low" | "medium" | "high" | "critical"
      finding_status: "open" | "acknowledged" | "resolved" | "ignored"
      gate_status: "pending" | "running" | "passed" | "failed" | "skipped"
      run_status: "pending" | "running" | "passed" | "failed" | "cancelled"
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
      app_role: ["admin", "member"],
      finding_severity: ["info", "low", "medium", "high", "critical"],
      finding_status: ["open", "acknowledged", "resolved", "ignored"],
      gate_status: ["pending", "running", "passed", "failed", "skipped"],
      run_status: ["pending", "running", "passed", "failed", "cancelled"],
    },
  },
} as const
