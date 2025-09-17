import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { OpenAI } from "https://esm.sh/openai@4.10.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { content } = await req.json()
    if (!content) throw new Error("No content provided for skill extraction.")

    const prompt = `
      From the following text, extract all professional and technical skills mentioned.
      Analyze the text and identify specific, marketable skills.
      Return the output as a valid JSON object with a single key "skills" which is an array of strings.
      If no skills are found, return an empty array.
      Do not include soft skills like "communication" unless they are explicitly mentioned as a learning goal.
      Example:
      Input: "I want a roadmap to become a data scientist. I know Python and SQL."
      Output: {"skills": ["Python", "SQL", "Data Science"]}

      Text to analyze:
      ---
      ${content}
    `

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a highly accurate skill extraction tool that only outputs JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" }, // Enforce JSON output
    })

    const extractedData = JSON.parse(completion.choices[0].message.content)

    return new Response(JSON.stringify(extractedData), {
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