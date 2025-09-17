import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { OpenAI } from 'https://esm.sh/openai@4.11.1'

// Initialize the OpenAI client with your secret key
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
})

serve(async (req) => {
  // This is needed if you're deploying functions locally
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, history } = await req.json()

    // Create the chat completion request to OpenAI, with stream: true
    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful career counselor.' },
        ...history, // Your frontend is already filtering this correctly
        { role: 'user', content: query },
      ],
      stream: true, // This is the crucial part that requests a stream
    })

    // Return a new Response object with the stream from OpenAI
    // This pipes the data directly from OpenAI to your frontend
    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
      },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})