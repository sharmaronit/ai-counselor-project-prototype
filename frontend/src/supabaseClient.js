import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://peataenjmccoxachlihq.supabase.co' // Your local API URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlYXRhZW5qbWNjb3hhY2hsaWhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5Njk0MDcsImV4cCI6MjA3MzU0NTQwN30.a_Dqios2-nU1cK0c3k5MMc-AL-ygeyal7kjVV7bs2yc' // Paste the key from your terminal here

export const supabase = createClient(supabaseUrl, supabaseAnonKey)