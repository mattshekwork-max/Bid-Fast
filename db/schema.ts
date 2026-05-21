// TypeScript Types
export type User = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  created_at: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
  subscription_ends_at: string | null;
  subscription_created_at: string | null;
};

export type Estimate = {
  id: number;
  user_id: string;
  title: string;
  voice_transcript: string;
  parsed_description: string | null;
  status: string;
  total_labor_cost: number;
  total_material_cost: number;
  total_cost: number;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  pdf_url: string | null;
  client_token: string | null;
  client_response: string | null;
  client_responded_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EstimateLineItem = {
  id: number;
  estimate_id: number;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  item_type: string;
  sort_order: number;
  created_at: string;
};

export type MaterialListItem = {
  id: number;
  estimate_id: number;
  material_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  supplier_note: string | null;
  exported: boolean;
  sort_order: number;
  created_at: string;
};

export type VoiceSession = {
  id: number;
  user_id: string;
  estimate_id: number | null;
  audio_url: string | null;
  raw_transcript: string;
  ai_parsed_json: string | null;
  session_type: string;
  duration_seconds: number | null;
  created_at: string;
};