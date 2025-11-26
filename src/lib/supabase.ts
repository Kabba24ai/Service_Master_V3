import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://0ec90b57d6e95fcbda19832f.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MjQyMDAsImV4cCI6MjA0ODIwMDIwMH0.QGHR3jLlqYfCWWZ5OODqBOLKD2R8xLx8V8pZQGJZ0lU';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
