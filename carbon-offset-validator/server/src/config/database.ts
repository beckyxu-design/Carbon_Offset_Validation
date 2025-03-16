import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://ssndcivabflkcfqwaapj.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseKey) {
  throw new Error('SUPABASE_KEY is required');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
