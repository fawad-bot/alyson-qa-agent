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
      alerts: {
        Row: {
          body: string | null
          channel: string
          created_at: string
          finding_id: string | null
          id: string
          owner_id: string
          read_at: string | null
          run_id: string | null
          severity: string
          title: string
        }
        Insert: {
          body?: string | null
          channel?: string
          created_at?: string
          finding_id?: string | null
          id?: string
          owner_id: string
          read_at?: string | null
          run_id?: string | null
          severity: string
          title: string
        }
        Update: {
          body?: string | null
          channel?: string
          created_at?: string
          finding_id?: string | null
          id?: string
          owner_id?: string
          read_at?: string | null
          run_id?: string | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "qa_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      credentials: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          kind: string
          name: string
          owner_id: string
          persona_id: string | null
          status: string
          updated_at: string
          vault_ref: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          kind?: string
          name: string
          owner_id: string
          persona_id?: string | null
          status?: string
          updated_at?: string
          vault_ref: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          kind?: string
          name?: string
          owner_id?: string
          persona_id?: string | null
          status?: string
          updated_at?: string
          vault_ref?: string
        }
        Relationships: [
          {
            foreignKeyName: "credentials_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_items: {
        Row: {
          created_at: string
          finding_id: string | null
          id: string
          kind: string
          owner_id: string
          payload: Json
          run_id: string | null
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          finding_id?: string | null
          id?: string
          kind: string
          owner_id: string
          payload?: Json
          run_id?: string | null
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          finding_id?: string | null
          id?: string
          kind?: string
          owner_id?: string
          payload?: Json
          run_id?: string | null
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_items_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_items_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "qa_runs"
            referencedColumns: ["id"]
          },
        ]
      }
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
      fix_tasks: {
        Row: {
          assignee: string | null
          auto_fixable: boolean
          created_at: string
          finding_id: string | null
          id: string
          owner_id: string
          patch_preview: string | null
          priority: string
          requires_human_review: boolean
          run_id: string | null
          status: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee?: string | null
          auto_fixable?: boolean
          created_at?: string
          finding_id?: string | null
          id?: string
          owner_id: string
          patch_preview?: string | null
          priority?: string
          requires_human_review?: boolean
          run_id?: string | null
          status?: string
          summary?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee?: string | null
          auto_fixable?: boolean
          created_at?: string
          finding_id?: string | null
          id?: string
          owner_id?: string
          patch_preview?: string | null
          priority?: string
          requires_human_review?: boolean
          run_id?: string | null
          status?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fix_tasks_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fix_tasks_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "qa_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json
          created_at: string
          id: string
          owner_id: string
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          owner_id: string
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          owner_id?: string
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      personas: {
        Row: {
          created_at: string
          description: string
          enabled: boolean
          id: string
          name: string
          owner_id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          enabled?: boolean
          id?: string
          name: string
          owner_id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          enabled?: boolean
          id?: string
          name?: string
          owner_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
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
      qa_triggers: {
        Row: {
          config: Json
          created_at: string
          enabled: boolean
          id: string
          kind: string
          label: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          kind: string
          label: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          kind?: string
          label?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quality_gates: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          metric: string
          name: string
          operator: string
          owner_id: string
          severity: string
          threshold: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          metric: string
          name: string
          operator: string
          owner_id: string
          severity?: string
          threshold: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          metric?: string
          name?: string
          operator?: string
          owner_id?: string
          severity?: string
          threshold?: number
          updated_at?: string
        }
        Relationships: []
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
      test_suites: {
        Row: {
          checks: Json
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          name: string
          owner_id: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          checks?: Json
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name: string
          owner_id: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          checks?: Json
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name?: string
          owner_id?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
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
      workspace_settings: {
        Row: {
          ai_auto_fix: boolean
          ai_starts_runs: boolean
          created_at: string
          default_gate: string
          default_mode: string
          evidence_retention_days: number
          owner_id: string
          updated_at: string
          workspace_name: string
        }
        Insert: {
          ai_auto_fix?: boolean
          ai_starts_runs?: boolean
          created_at?: string
          default_gate?: string
          default_mode?: string
          evidence_retention_days?: number
          owner_id: string
          updated_at?: string
          workspace_name?: string
        }
        Update: {
          ai_auto_fix?: boolean
          ai_starts_runs?: boolean
          created_at?: string
          default_gate?: string
          default_mode?: string
          evidence_retention_days?: number
          owner_id?: string
          updated_at?: string
          workspace_name?: string
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
