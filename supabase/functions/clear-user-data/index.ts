import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Create a Supabase client with the user's authorization to verify them
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 2. Get the user's ID from their token. This is the secure part.
    const { data: { user } } = await userSupabaseClient.auth.getUser()
    if (!user) throw new Error("Authentication failed. User not found.")

    // 3. Create a special Supabase client with admin privileges to perform deletions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 4. Perform the deletions from all user-specific tables
    // The Promise.all runs these deletions concurrently for better performance.
    const [skillsRes, chatsRes, roadmapsRes, goalsRes] = await Promise.all([
      supabaseAdmin.from('user_skills').delete().eq('user_id', user.id),
      supabaseAdmin.from('chat_messages').delete().eq('user_id', user.id),
      supabaseAdmin.from('roadmap_steps').delete().eq('user_id', user.id),
      supabaseAdmin.from('user_goals').delete().eq('user_id', user.id)
    ]);

    // Optional: Check for errors in each deletion
    if (skillsRes.error) throw new Error(`Failed to delete skills: ${skillsRes.error.message}`);
    if (chatsRes.error) throw new Error(`Failed to delete chats: ${chatsRes.error.message}`);
    if (roadmapsRes.error) throw new Error(`Failed to delete roadmaps: ${roadmapsRes.error.message}`);
    if (goalsRes.error) throw new Error(`Failed to delete goals: ${goalsRes.error.message}`);

    return new Response(JSON.stringify({ message: "User data cleared successfully." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})