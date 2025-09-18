import { createClient } from '@supabase/supabase-js'

// These lines read the variables from your .env file
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// This check ensures your .env file is set up correctly
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be defined in your .env file.");
}

// This creates and exports the Supabase client that your whole app will use
export const supabase = createClient(supabaseUrl, supabaseAnonKey)