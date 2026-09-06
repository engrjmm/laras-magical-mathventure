import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { SaveData } from './storage';

export type ChildProfile = {
  id: string;
  parent_id: string;
  parent_email?: string;
  name: string;
  save_data: SaveData;
  updated_at: string;
};

let client: SupabaseClient | null | undefined;

export function getCloudClient() {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  client = url && key ? createClient(url, key) : null;
  return client;
}
