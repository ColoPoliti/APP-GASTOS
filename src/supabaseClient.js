import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://smqonlewejgphiewscho.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_nnIHjvSjY1RVFshCylvIog_vo7Sd_6y';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);