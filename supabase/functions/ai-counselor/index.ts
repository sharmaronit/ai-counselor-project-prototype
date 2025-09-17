import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts' // Ensure this file exists
import { OpenAI } from 'https://esm.sh/openai@4.11.1'

// Initialize the OpenAI client using the secret key from your Supabase dashboard
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
})

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, history } = await req.json()

    // Request a stream from the OpenAI API
    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful career counselor.' },
        ...history, // Pass the conversation history for context
        { role: 'user', content: query },
      ],
      stream: true, // This is the most important setting
    })

    // Immediately return the stream from OpenAI directly to the frontend
    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream', // Required header for streaming
      },
    })
  } catch (error) {
    console.error('Error in Supabase function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})