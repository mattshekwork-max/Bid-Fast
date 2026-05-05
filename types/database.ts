// Minimal database types for CatchFlow
// Replace with auto-generated types from `supabase gen types` when available

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
      workspaces: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          email: string;
          workspace_id: string | null;
          full_name: string | null;
          role: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          workspace_id?: string | null;
          full_name?: string | null;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          workspace_id?: string | null;
          full_name?: string | null;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          workspace_id: string;
          name: string | null;
          email: string | null;
          phone: string | null;
          company: string | null;
          source: string;
          status: string;
          urgency_score: number | null;
          urgency_reason: string | null;
          intent: string | null;
          language: string;
          summary: string | null;
          subject_line: string | null;
          suggested_reply: string | null;
          last_activity_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          source?: string;
          status?: string;
          urgency_score?: number | null;
          urgency_reason?: string | null;
          intent?: string | null;
          language?: string;
          summary?: string | null;
          subject_line?: string | null;
          suggested_reply?: string | null;
          last_activity_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          source?: string;
          status?: string;
          urgency_score?: number | null;
          urgency_reason?: string | null;
          intent?: string | null;
          language?: string;
          summary?: string | null;
          subject_line?: string | null;
          suggested_reply?: string | null;
          last_activity_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      follow_ups: {
        Row: {
          id: string;
          lead_id: string;
          workspace_id: string;
          type: string;
          priority: string;
          due_at: string | null;
          completed_at: string | null;
          notes: string | null;
          outcome: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          workspace_id: string;
          type?: string;
          priority?: string;
          due_at?: string | null;
          completed_at?: string | null;
          notes?: string | null;
          outcome?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          workspace_id?: string;
          type?: string;
          priority?: string;
          due_at?: string | null;
          completed_at?: string | null;
          notes?: string | null;
          outcome?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      email_events: {
        Row: {
          id: string;
          workspace_id: string;
          lead_id: string | null;
          direction: string;
          from_address: string | null;
          to_address: string | null;
          subject: string | null;
          body_text: string | null;
          body_html: string | null;
          message_id: string | null;
          in_reply_to: string | null;
          processed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          lead_id?: string | null;
          direction?: string;
          from_address?: string | null;
          to_address?: string | null;
          subject?: string | null;
          body_text?: string | null;
          body_html?: string | null;
          message_id?: string | null;
          in_reply_to?: string | null;
          processed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          lead_id?: string | null;
          direction?: string;
          from_address?: string | null;
          to_address?: string | null;
          subject?: string | null;
          body_text?: string | null;
          body_html?: string | null;
          message_id?: string | null;
          in_reply_to?: string | null;
          processed?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
  };
}