import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kfyecqjbevkokuirpdel.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeWVjcWpiZXZrb2t1aXJwZGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNDI1NzksImV4cCI6MjA3OTcxODU3OX0.Xw1vXS9qhLw126g44oBK3vTfW_ga4QDg_GKp_Tz5ZuY';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
