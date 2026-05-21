export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          subscription_status: string;
          estimate_count_this_month: number;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          subscription_status?: string;
          estimate_count_this_month?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          subscription_status?: string;
          estimate_count_this_month?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      estimates: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          status: string;
          client_name: string | null;
          client_email: string | null;
          transcript: string | null;
          labor_total: number;
          material_total: number;
          client_token: string | null;
          client_response: string | null;
          client_responded_at: string | null;
          pdf_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          status?: string;
          client_name?: string | null;
          client_email?: string | null;
          transcript?: string | null;
          labor_total?: number;
          material_total?: number;
          client_token?: string | null;
          client_response?: string | null;
          client_responded_at?: string | null;
          pdf_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          status?: string;
          client_name?: string | null;
          client_email?: string | null;
          transcript?: string | null;
          labor_total?: number;
          material_total?: number;
          client_token?: string | null;
          client_response?: string | null;
          client_responded_at?: string | null;
          pdf_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      estimate_line_items: {
        Row: {
          id: string;
          estimate_id: string;
          description: string;
          quantity: number;
          unit: string;
          unit_price: number;
          total: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          estimate_id: string;
          description: string;
          quantity?: number;
          unit?: string;
          unit_price?: number;
          total?: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          estimate_id?: string;
          description?: string;
          quantity?: number;
          unit?: string;
          unit_price?: number;
          total?: number;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      material_list_items: {
        Row: {
          id: string;
          estimate_id: string;
          name: string;
          quantity: number;
          unit: string;
          unit_cost: number;
          total_cost: number;
          supplier: string | null;
          exported: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          estimate_id: string;
          name: string;
          quantity?: number;
          unit?: string;
          unit_cost?: number;
          total_cost?: number;
          supplier?: string | null;
          exported?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          estimate_id?: string;
          name?: string;
          quantity?: number;
          unit?: string;
          unit_cost?: number;
          total_cost?: number;
          supplier?: string | null;
          exported?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      voice_sessions: {
        Row: {
          id: string;
          user_id: string;
          estimate_id: string | null;
          transcript: string | null;
          duration_seconds: number | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          estimate_id?: string | null;
          transcript?: string | null;
          duration_seconds?: number | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          estimate_id?: string | null;
          transcript?: string | null;
          duration_seconds?: number | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
