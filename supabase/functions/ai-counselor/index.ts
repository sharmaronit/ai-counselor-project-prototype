import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
// Import the Google Generative AI client library
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai'

// Initialize the Google AI client with your secret key
const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!)
const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

// Helper function to format Gemini's output to look like OpenAI's
// This is the magic that prevents you from needing to change your frontend
function formatAsOpenAIStream(chunkText: string): string {
  const response = {
    choices: [
      {
        delta: {
          content: chunkText,
        },
      },
    ],
  }
  return `data: ${JSON.stringify(response)}\n\n`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, history } = await req.json()

    // Gemini requires history to alternate between 'user' and 'model' roles
    const formattedHistory = history.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    const chat = model.startChat({
      history: formattedHistory,
    })

    const streamResult = await chat.sendMessageStream(query)

    // Create a new ReadableStream to send back to the client
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        // Loop through the stream from Gemini
        for await (const chunk of streamResult.stream) {
          const chunkText = chunk.text()
          // Format the chunk to look like an OpenAI response and enqueue it
          controller.enqueue(encoder.encode(formatAsOpenAIStream(chunkText)))
        }
        // Send the [DONE] message, also formatted
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

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