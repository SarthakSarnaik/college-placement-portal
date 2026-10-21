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
      announcements: {
        Row: {
          body: string
          company_id: string | null
          id: string
          is_demo: boolean
          published_at: string
          title: string
        }
        Insert: {
          body: string
          company_id?: string | null
          id?: string
          is_demo?: boolean
          published_at?: string
          title: string
        }
        Update: {
          body?: string
          company_id?: string | null
          id?: string
          is_demo?: boolean
          published_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          dsa_difficulty: Database["public"]["Enums"]["difficulty"]
          first_visit_year: number | null
          headquarters: string
          id: string
          is_demo: boolean
          is_published: boolean
          name: string
          overview: string
          sector: string
          updated_at: string
          verification_status: string
          website: string | null
        }
        Insert: {
          created_at?: string
          dsa_difficulty?: Database["public"]["Enums"]["difficulty"]
          first_visit_year?: number | null
          headquarters?: string
          id?: string
          is_demo?: boolean
          is_published?: boolean
          name: string
          overview?: string
          sector?: string
          updated_at?: string
          verification_status?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          dsa_difficulty?: Database["public"]["Enums"]["difficulty"]
          first_visit_year?: number | null
          headquarters?: string
          id?: string
          is_demo?: boolean
          is_published?: boolean
          name?: string
          overview?: string
          sector?: string
          updated_at?: string
          verification_status?: string
          website?: string | null
        }
        Relationships: []
      }
      cs_fundamentals: {
        Row: {
          company_id: string
          created_at: string
          id: string
          notes: string | null
          priority: number
          subject: string
          subtopics: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          priority?: number
          subject: string
          subtopics?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          priority?: number
          subject?: string
          subtopics?: string
        }
        Relationships: [
          {
            foreignKeyName: "cs_fundamentals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      dsa_topics: {
        Row: {
          category: string
          company_id: string
          difficulty: Database["public"]["Enums"]["difficulty"]
          id: string
          notes: string | null
          priority: number
          topic: string
        }
        Insert: {
          category?: string
          company_id: string
          difficulty?: Database["public"]["Enums"]["difficulty"]
          id?: string
          notes?: string | null
          priority?: number
          topic: string
        }
        Update: {
          category?: string
          company_id?: string
          difficulty?: Database["public"]["Enums"]["difficulty"]
          id?: string
          notes?: string | null
          priority?: number
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "dsa_topics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      eligibility_criteria: {
        Row: {
          branches: string
          company_id: string
          created_at: string
          id: string
          is_current: boolean
          max_backlogs: number | null
          min_cgpa: number | null
          notes: string | null
          year: number
        }
        Insert: {
          branches?: string
          company_id: string
          created_at?: string
          id?: string
          is_current?: boolean
          max_backlogs?: number | null
          min_cgpa?: number | null
          notes?: string | null
          year: number
        }
        Update: {
          branches?: string
          company_id?: string
          created_at?: string
          id?: string
          is_current?: boolean
          max_backlogs?: number | null
          min_cgpa?: number | null
          notes?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "eligibility_criteria_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_rounds: {
        Row: {
          company_id: string
          duration: string | null
          id: string
          name: string
          preparation: string
          purpose: string
          round_order: number
        }
        Insert: {
          company_id: string
          duration?: string | null
          id?: string
          name: string
          preparation?: string
          purpose?: string
          round_order: number
        }
        Update: {
          company_id?: string
          duration?: string | null
          id?: string
          name?: string
          preparation?: string
          purpose?: string
          round_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "interview_rounds_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      job_roles: {
        Row: {
          company_id: string
          created_at: string
          ctc_note: string | null
          hiring_year: number
          id: string
          location: string | null
          title: string
        }
        Insert: {
          company_id: string
          created_at?: string
          ctc_note?: string | null
          hiring_year: number
          id?: string
          location?: string | null
          title: string
        }
        Update: {
          company_id?: string
          created_at?: string
          ctc_note?: string | null
          hiring_year?: number
          id?: string
          location?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          branch: string | null
          created_at: string
          email: string
          full_name: string
          graduation_year: number | null
          id: string
        }
        Insert: {
          branch?: string | null
          created_at?: string
          email?: string
          full_name?: string
          graduation_year?: number | null
          id: string
        }
        Update: {
          branch?: string | null
          created_at?: string
          email?: string
          full_name?: string
          graduation_year?: number | null
          id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          asked_on: string | null
          company_id: string
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty"]
          experience: string | null
          id: string
          question: string
          round_id: string | null
          source_id: string | null
          topic: string | null
        }
        Insert: {
          asked_on?: string | null
          company_id: string
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty"]
          experience?: string | null
          id?: string
          question: string
          round_id?: string | null
          source_id?: string | null
          topic?: string | null
        }
        Update: {
          asked_on?: string | null
          company_id?: string
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty"]
          experience?: string | null
          id?: string
          question?: string
          round_id?: string | null
          source_id?: string | null
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "interview_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          reviewed_at: string | null
          source_type: string
          status: string
          title: string
          url: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          source_type?: string
          status?: string
          title: string
          url?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          source_type?: string
          status?: string
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sources_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      company_visible: { Args: { _id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      set_admin: {
        Args: { _make_admin: boolean; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "student"
      difficulty: "easy" | "medium" | "hard"
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
    Enums: {
      app_role: ["admin", "student"],
      difficulty: ["easy", "medium", "hard"],
    },
  },
} as const
