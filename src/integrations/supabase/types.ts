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
      app_settings: {
        Row: {
          dark_mode_default: boolean
          default_hashtag_count: number
          default_language: string
          id: string
          image_aspect_ratio: string
          image_brand_consistency: string
          linkedin_style_mode: string
          simple_mode: boolean
          timezone: string
          tone_strictness: string
          updated_at: string
          x_style_mode: string
        }
        Insert: {
          dark_mode_default?: boolean
          default_hashtag_count?: number
          default_language?: string
          id?: string
          image_aspect_ratio?: string
          image_brand_consistency?: string
          linkedin_style_mode?: string
          simple_mode?: boolean
          timezone?: string
          tone_strictness?: string
          updated_at?: string
          x_style_mode?: string
        }
        Update: {
          dark_mode_default?: boolean
          default_hashtag_count?: number
          default_language?: string
          id?: string
          image_aspect_ratio?: string
          image_brand_consistency?: string
          linkedin_style_mode?: string
          simple_mode?: boolean
          timezone?: string
          tone_strictness?: string
          updated_at?: string
          x_style_mode?: string
        }
        Relationships: []
      }
      generated_content: {
        Row: {
          archived: boolean
          content_date: string
          created_at: string
          cta_text: string | null
          error_message: string | null
          favorite: boolean
          generation_source: string
          hashtags: string | null
          id: string
          image_prompt: string | null
          image_url: string | null
          linkedin_post: string | null
          objective: string | null
          platform: string
          project_id: string
          schedule_id: string | null
          scheduled_time: string | null
          status: string
          topic_title: string | null
          updated_at: string
          x_post: string | null
        }
        Insert: {
          archived?: boolean
          content_date?: string
          created_at?: string
          cta_text?: string | null
          error_message?: string | null
          favorite?: boolean
          generation_source?: string
          hashtags?: string | null
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          linkedin_post?: string | null
          objective?: string | null
          platform?: string
          project_id: string
          schedule_id?: string | null
          scheduled_time?: string | null
          status?: string
          topic_title?: string | null
          updated_at?: string
          x_post?: string | null
        }
        Update: {
          archived?: boolean
          content_date?: string
          created_at?: string
          cta_text?: string | null
          error_message?: string | null
          favorite?: boolean
          generation_source?: string
          hashtags?: string | null
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          linkedin_post?: string | null
          objective?: string | null
          platform?: string
          project_id?: string
          schedule_id?: string | null
          scheduled_time?: string | null
          status?: string
          topic_title?: string | null
          updated_at?: string
          x_post?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_content_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_content_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      project_knowledge_files: {
        Row: {
          extracted_text: string | null
          file_path: string
          file_type: string | null
          id: string
          notes: string | null
          original_filename: string | null
          project_id: string
          title: string
          uploaded_at: string
        }
        Insert: {
          extracted_text?: string | null
          file_path: string
          file_type?: string | null
          id?: string
          notes?: string | null
          original_filename?: string | null
          project_id: string
          title: string
          uploaded_at?: string
        }
        Update: {
          extracted_text?: string | null
          file_path?: string
          file_type?: string | null
          id?: string
          notes?: string | null
          original_filename?: string | null
          project_id?: string
          title?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_knowledge_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_knowledge_notes: {
        Row: {
          approved_keywords: string | null
          audience_notes: string | null
          content_pillars: string | null
          created_at: string
          differentiators: string | null
          forbidden_topics: string | null
          id: string
          key_features: string | null
          offer_notes: string | null
          project_id: string
          summary: string | null
          tone_rules: string | null
          updated_at: string
        }
        Insert: {
          approved_keywords?: string | null
          audience_notes?: string | null
          content_pillars?: string | null
          created_at?: string
          differentiators?: string | null
          forbidden_topics?: string | null
          id?: string
          key_features?: string | null
          offer_notes?: string | null
          project_id: string
          summary?: string | null
          tone_rules?: string | null
          updated_at?: string
        }
        Update: {
          approved_keywords?: string | null
          audience_notes?: string | null
          content_pillars?: string | null
          created_at?: string
          differentiators?: string | null
          forbidden_topics?: string | null
          id?: string
          key_features?: string | null
          offer_notes?: string | null
          project_id?: string
          summary?: string | null
          tone_rules?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_knowledge_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          active: boolean
          brand_color: string
          brand_tone: string | null
          brief_extracted: Json | null
          created_at: string
          id: string
          main_cta: string | null
          master_brief: string | null
          name: string
          primary_language: string
          short_description: string | null
          target_audience: string | null
          updated_at: string
          website_url: string | null
          writing_prompt: string | null
        }
        Insert: {
          active?: boolean
          brand_color?: string
          brand_tone?: string | null
          brief_extracted?: Json | null
          created_at?: string
          id?: string
          main_cta?: string | null
          master_brief?: string | null
          name: string
          primary_language?: string
          short_description?: string | null
          target_audience?: string | null
          updated_at?: string
          website_url?: string | null
          writing_prompt?: string | null
        }
        Update: {
          active?: boolean
          brand_color?: string
          brand_tone?: string | null
          brief_extracted?: Json | null
          created_at?: string
          id?: string
          main_cta?: string | null
          master_brief?: string | null
          name?: string
          primary_language?: string
          short_description?: string | null
          target_audience?: string | null
          updated_at?: string
          website_url?: string | null
          writing_prompt?: string | null
        }
        Relationships: []
      }
      review_actions: {
        Row: {
          action_type: string
          created_at: string
          generated_content_id: string
          id: string
          notes: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          generated_content_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          generated_content_id?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_actions_generated_content_id_fkey"
            columns: ["generated_content_id"]
            isOneToOne: false
            referencedRelation: "generated_content"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          active: boolean
          created_at: string
          day_of_week: number
          id: string
          image_required: boolean
          platform_mode: string
          posts_per_day: number
          project_id: string
          slot_time: string
          topic_mode: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          day_of_week?: number
          id?: string
          image_required?: boolean
          platform_mode?: string
          posts_per_day?: number
          project_id: string
          slot_time?: string
          topic_mode?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          day_of_week?: number
          id?: string
          image_required?: boolean
          platform_mode?: string
          posts_per_day?: number
          project_id?: string
          slot_time?: string
          topic_mode?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
    Enums: {},
  },
} as const
