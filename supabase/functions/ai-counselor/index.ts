import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { OpenAI } from "https://esm.sh/openai@4.10.0"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const realisticCounselorSystemPrompt = `You are an expert AI Career and Education Counselor...`; // (Keep your full prompt here)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
})

serve(async (req) => {
  // DEBUG LOG 1: Prove the function is being hit
  console.log(`[DEBUG] Function invoked with method: ${req.method}`);

  // The critical CORS preflight check
  if (req.method === 'OPTIONS') {
    // DEBUG LOG 2: Prove we are handling the preflight request
    console.log('[DEBUG] Responding to OPTIONS preflight request.');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ... (rest of your try block is the same)
    const { query, history, session_id } = await req.json()
    if (!query || !session_id) throw new Error("Query and session_id are required.")

    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user } } = await userSupabaseClient.auth.getUser()
    if (!user) throw new Error("User not found.")
    
    await userSupabaseClient.from('chat_messages').insert({ user_id: user.id, session_id: session_id, role: 'user', content: query, })
    
    const messages = [{ role: "system", content: realisticCounselorSystemPrompt }];
    if (history && Array.isArray(history)) { messages.push(...history); }
    messages.push({ role: "user", content: query });

    const completion = await openai.chat.completions.create({ model: "gpt-4o-mini", messages: messages, max_tokens: 500, })
    const responseContent = completion.choices[0].message.content
    
    await userSupabaseClient.from('chat_messages').insert({ user_id: user.id, session_id: session_id, role: 'assistant', content: responseContent, })
    
    return new Response(JSON.stringify({ reply: responseContent }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200, })

  } catch (error) {
    // DEBUG LOG 3: See the exact error on the server side
    console.error('[ERROR] An error occurred in the function:', error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400, })
  }
})