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
      attempt_answers: {
        Row: {
          answered_at: string
          attempt_id: string
          id: string
          is_correct: boolean | null
          question_id: string
          selected_option: number | null
        }
        Insert: {
          answered_at?: string
          attempt_id: string
          id?: string
          is_correct?: boolean | null
          question_id: string
          selected_option?: number | null
        }
        Update: {
          answered_at?: string
          attempt_id?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string
          selected_option?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_attempts: {
        Row: {
          correct_count: number | null
          device_fingerprint: string | null
          exam_id: string
          id: string
          question_order: string[] | null
          score: number | null
          skipped_count: number | null
          started_at: string
          status: Database["public"]["Enums"]["attempt_status"]
          submitted_at: string | null
          user_id: string
          violations_count: number
          wrong_count: number | null
        }
        Insert: {
          correct_count?: number | null
          device_fingerprint?: string | null
          exam_id: string
          id?: string
          question_order?: string[] | null
          score?: number | null
          skipped_count?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["attempt_status"]
          submitted_at?: string | null
          user_id: string
          violations_count?: number
          wrong_count?: number | null
        }
        Update: {
          correct_count?: number | null
          device_fingerprint?: string | null
          exam_id?: string
          id?: string
          question_order?: string[] | null
          score?: number | null
          skipped_count?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["attempt_status"]
          submitted_at?: string | null
          user_id?: string
          violations_count?: number
          wrong_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          class_level: number
          created_at: string
          duration_minutes: number
          exam_type: Database["public"]["Enums"]["exam_type"]
          id: string
          is_published: boolean
          marks_correct: number
          marks_wrong: number
          scheduled_date: string
          shift: Database["public"]["Enums"]["exam_shift"]
          start_time: string
          title: string
          total_questions: number
          updated_at: string
        }
        Insert: {
          class_level: number
          created_at?: string
          duration_minutes?: number
          exam_type: Database["public"]["Enums"]["exam_type"]
          id?: string
          is_published?: boolean
          marks_correct?: number
          marks_wrong?: number
          scheduled_date: string
          shift?: Database["public"]["Enums"]["exam_shift"]
          start_time: string
          title: string
          total_questions?: number
          updated_at?: string
        }
        Update: {
          class_level?: number
          created_at?: string
          duration_minutes?: number
          exam_type?: Database["public"]["Enums"]["exam_type"]
          id?: string
          is_published?: boolean
          marks_correct?: number
          marks_wrong?: number
          scheduled_date?: string
          shift?: Database["public"]["Enums"]["exam_shift"]
          start_time?: string
          title?: string
          total_questions?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          class_level: number | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          photo_url: string | null
          school: string | null
          updated_at: string
        }
        Insert: {
          class_level?: number | null
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
          photo_url?: string | null
          school?: string | null
          updated_at?: string
        }
        Update: {
          class_level?: number | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          photo_url?: string | null
          school?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_option: number
          created_at: string
          exam_id: string
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          order_index: number
          question_text: string
        }
        Insert: {
          correct_option: number
          created_at?: string
          exam_id: string
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          order_index?: number
          question_text: string
        }
        Update: {
          correct_option?: number
          created_at?: string
          exam_id?: string
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          order_index?: number
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          challenge_started: boolean
          class: string
          created_at: string
          document_type: string | null
          document_url: string | null
          email: string | null
          id: string
          mobile_number: string
          photo_url: string | null
          rejection_reason: string | null
          school_name: string
          student_name: string
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          challenge_started?: boolean
          class?: string
          created_at?: string
          document_type?: string | null
          document_url?: string | null
          email?: string | null
          id?: string
          mobile_number?: string
          photo_url?: string | null
          rejection_reason?: string | null
          school_name?: string
          student_name?: string
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          challenge_started?: boolean
          class?: string
          created_at?: string
          document_type?: string | null
          document_url?: string | null
          email?: string | null
          id?: string
          mobile_number?: string
          photo_url?: string | null
          rejection_reason?: string | null
          school_name?: string
          student_name?: string
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      teacher_commissions: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string | null
          referral_id: string | null
          status: Database["public"]["Enums"]["commission_status"]
          teacher_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string | null
          referral_id?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          teacher_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string | null
          referral_id?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "teacher_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_commissions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_fraud_logs: {
        Row: {
          created_at: string
          detail: string
          id: string
          kind: string
          referral_id: string | null
          teacher_id: string | null
        }
        Insert: {
          created_at?: string
          detail?: string
          id?: string
          kind: string
          referral_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          created_at?: string
          detail?: string
          id?: string
          kind?: string
          referral_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_fraud_logs_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "teacher_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_fraud_logs_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_referrals: {
        Row: {
          amount: number
          created_at: string
          device: string | null
          fraud_flags: string[]
          id: string
          paid: boolean
          refunded: boolean
          student_class: string
          student_email: string
          student_name: string
          student_phone: string
          teacher_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          device?: string | null
          fraud_flags?: string[]
          id?: string
          paid?: boolean
          refunded?: boolean
          student_class?: string
          student_email?: string
          student_name?: string
          student_phone?: string
          teacher_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          device?: string | null
          fraud_flags?: string[]
          id?: string
          paid?: boolean
          refunded?: boolean
          student_class?: string
          student_email?: string
          student_name?: string
          student_phone?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_referrals_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_withdrawals: {
        Row: {
          amount: number
          created_at: string
          destination: string
          id: string
          method: string
          note: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          teacher_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          destination: string
          id?: string
          method: string
          note?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          teacher_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          destination?: string
          id?: string
          method?: string
          note?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_withdrawals_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          bank_acc: string | null
          bank_holder: string | null
          bank_ifsc: string | null
          code: string
          created_at: string
          email: string
          fraud_score: number
          id: string
          kyc_number: string | null
          kyc_type: string | null
          name: string
          phone: string
          status: Database["public"]["Enums"]["teacher_status"]
          updated_at: string
          upi: string | null
          user_id: string
        }
        Insert: {
          bank_acc?: string | null
          bank_holder?: string | null
          bank_ifsc?: string | null
          code: string
          created_at?: string
          email?: string
          fraud_score?: number
          id?: string
          kyc_number?: string | null
          kyc_type?: string | null
          name?: string
          phone?: string
          status?: Database["public"]["Enums"]["teacher_status"]
          updated_at?: string
          upi?: string | null
          user_id: string
        }
        Update: {
          bank_acc?: string | null
          bank_holder?: string | null
          bank_ifsc?: string | null
          code?: string
          created_at?: string
          email?: string
          fraud_score?: number
          id?: string
          kyc_number?: string | null
          kyc_type?: string | null
          name?: string
          phone?: string
          status?: Database["public"]["Enums"]["teacher_status"]
          updated_at?: string
          upi?: string | null
          user_id?: string
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
      violations_log: {
        Row: {
          attempt_id: string
          created_at: string
          details: Json | null
          id: string
          violation_type: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          details?: Json | null
          id?: string
          violation_type: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "violations_log_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "exam_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      attribute_referral: {
        Args: {
          _amount: number
          _code: string
          _device: string
          _student_class: string
          _student_email: string
          _student_name: string
          _student_phone: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      review_student_verification: {
        Args: { p_approve: boolean; p_reason: string; p_student_id: string }
        Returns: {
          challenge_started: boolean
          class: string
          created_at: string
          document_type: string | null
          document_url: string | null
          email: string | null
          id: string
          mobile_number: string
          photo_url: string | null
          rejection_reason: string | null
          school_name: string
          student_name: string
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
          verified_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "students"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_for_verification: {
        Args: {
          p_document_type: string
          p_document_url: string
          p_photo_url: string
        }
        Returns: {
          challenge_started: boolean
          class: string
          created_at: string
          document_type: string | null
          document_url: string | null
          email: string | null
          id: string
          mobile_number: string
          photo_url: string | null
          rejection_reason: string | null
          school_name: string
          student_name: string
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
          verified_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "students"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      teacher_balance: {
        Args: { _teacher_id: string }
        Returns: {
          available: number
          earned: number
          withdrawn: number
        }[]
      }
      teacher_by_code: {
        Args: { _code: string }
        Returns: {
          code: string
          name: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "student"
      attempt_status:
        | "in_progress"
        | "submitted"
        | "auto_submitted"
        | "disqualified"
      commission_status: "pending" | "approved" | "cancelled" | "paid"
      exam_shift: "day" | "night"
      exam_type: "mid" | "final"
      teacher_status: "pending" | "approved" | "rejected" | "suspended"
      verification_status: "not_submitted" | "pending" | "verified" | "rejected"
      withdrawal_status: "requested" | "approved" | "paid" | "rejected"
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
      app_role: ["admin", "student"],
      attempt_status: [
        "in_progress",
        "submitted",
        "auto_submitted",
        "disqualified",
      ],
      commission_status: ["pending", "approved", "cancelled", "paid"],
      exam_shift: ["day", "night"],
      exam_type: ["mid", "final"],
      teacher_status: ["pending", "approved", "rejected", "suspended"],
      verification_status: ["not_submitted", "pending", "verified", "rejected"],
      withdrawal_status: ["requested", "approved", "paid", "rejected"],
    },
  },
} as const
