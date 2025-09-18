import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { OpenAI } from 'https://esm.sh/openai@4.11.1'

console.log('--- Cold Start: Initializing OpenRouter Function ---')

// Initialize the OpenAI client, but configure it for OpenRouter
const openrouter = new OpenAI({
  // Use the new secret we just created
  apiKey: Deno.env.get('OPENROUTER_API_KEY'),
  // This is the most important part: directing requests to OpenRouter's URL
  baseURL: 'https://openrouter.ai/api/v1',
  // OpenRouter requires these headers for analytics and to identify your app
  defaultHeaders: {
    'HTTP-Referer': 'https://civic-issues-obe6-2h6y1u5mh-sharmaronits-projects.vercel.app/', // Optional but recommended
    'X-Title': 'AI Counsellor',                     // Optional but recommended
  },
})

serve(async (req) => {
  console.log('--- New request received for OpenRouter ---')

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, history } = await req.json()
    console.log('Successfully parsed body. Query:', query)

    console.log('Requesting stream from OpenRouter...')
    const stream = await openrouter.chat.completions.create({
      // --- CHOOSE YOUR MODEL ---
      // This is where you can select from many free and paid models.
      // Mistral 7B is a great, fast, and free option.
      model: 'mistralai/mistral-7b-instruct:free', 
      // Other free options: 'nousresearch/nous-hermes-2-mistral-7b-dpo:free', 'openchat/openchat-7b:free'
      
      messages: [
        { role: 'system', content: 'You are a helpful career counselor.' },
        ...history,
        { role: 'user', content: query },
      ],
      stream: true,
    })
    console.log('Stream received from OpenRouter. Returning to client.')

    return new Response(stream, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    })

  } catch (error) {
    console.error('--- CRITICAL ERROR in OpenRouter function ---')
    console.error(error)
    
    return new Response(JSON.stringify({ error: 'An internal server error occurred.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
