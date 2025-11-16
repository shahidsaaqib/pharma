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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          created_at: string
          expense_date: string
          id: string
          note: string | null
          synced: boolean
          type: Database["public"]["Enums"]["expense_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          expense_date?: string
          id?: string
          note?: string | null
          synced?: boolean
          type: Database["public"]["Enums"]["expense_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          expense_date?: string
          id?: string
          note?: string | null
          synced?: boolean
          type?: Database["public"]["Enums"]["expense_type"]
          user_id?: string
        }
        Relationships: []
      }
      medicines: {
        Row: {
          cost_price: number
          created_at: string
          expiry: string | null
          id: string
          name: string
          quantity: number
          reorder_level: number
          sale_price: number
          strength: string | null
          type: Database["public"]["Enums"]["medicine_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_price: number
          created_at?: string
          expiry?: string | null
          id?: string
          name: string
          quantity?: number
          reorder_level?: number
          sale_price: number
          strength?: string | null
          type?: Database["public"]["Enums"]["medicine_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_price?: number
          created_at?: string
          expiry?: string | null
          id?: string
          name?: string
          quantity?: number
          reorder_level?: number
          sale_price?: number
          strength?: string | null
          type?: Database["public"]["Enums"]["medicine_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      refund_items: {
        Row: {
          amount: number
          created_at: string
          id: string
          medicine_name: string
          quantity: number
          refund_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          medicine_name: string
          quantity: number
          refund_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          medicine_name?: string
          quantity?: number
          refund_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_items_refund_id_fkey"
            columns: ["refund_id"]
            isOneToOne: false
            referencedRelation: "refunds"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          created_at: string
          id: string
          refund_date: string
          sale_id: string
          synced: boolean
          total_refund: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          refund_date?: string
          sale_id: string
          synced?: boolean
          total_refund: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          refund_date?: string
          sale_id?: string
          synced?: boolean
          total_refund?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          cost_price: number
          created_at: string
          id: string
          medicine_name: string
          quantity: number
          sale_id: string
          sale_price: number
          subtotal: number
        }
        Insert: {
          cost_price: number
          created_at?: string
          id?: string
          medicine_name: string
          quantity: number
          sale_id: string
          sale_price: number
          subtotal: number
        }
        Update: {
          cost_price?: number
          created_at?: string
          id?: string
          medicine_name?: string
          quantity?: number
          sale_id?: string
          sale_price?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          balance: number | null
          cash_received: number | null
          created_at: string
          customer_name: string
          id: string
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          refunded: boolean
          sale_date: string
          synced: boolean
          total: number
          user_id: string
        }
        Insert: {
          balance?: number | null
          cash_received?: number | null
          created_at?: string
          customer_name: string
          id?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          refunded?: boolean
          sale_date?: string
          synced?: boolean
          total: number
          user_id: string
        }
        Update: {
          balance?: number | null
          cash_received?: number | null
          created_at?: string
          customer_name?: string
          id?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          refunded?: boolean
          sale_date?: string
          synced?: boolean
          total?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      expense_type: "rent" | "salary" | "utilities" | "supplies" | "other"
      medicine_type:
        | "tablet"
        | "capsule"
        | "syrup"
        | "injection"
        | "ointment"
        | "drops"
        | "other"
      payment_mode: "cash" | "udhar"
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
      expense_type: ["rent", "salary", "utilities", "supplies", "other"],
      medicine_type: [
        "tablet",
        "capsule",
        "syrup",
        "injection",
        "ointment",
        "drops",
        "other",
      ],
      payment_mode: ["cash", "udhar"],
    },
  },
} as const
