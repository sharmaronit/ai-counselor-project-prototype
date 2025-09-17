// File: supabase/functions/generate-roadmap/index.ts
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
    const { goal, skills } = await req.json() // e.g., goal: "Become a Backend Developer", skills: ["Python", "Git"]

    if (!goal) throw new Error("Goal is required.")

    const prompt = `
      A user wants to achieve the following goal: "${goal}".
      Their current self-reported skills are: ${skills && skills.length > 0 ? skills.join(', ') : 'None listed'}.

      Generate a realistic, step-by-step roadmap to help them achieve this goal.
      The roadmap should consist of 5-7 actionable steps.
      Provide the output as a valid JSON object with a single key "roadmap" which is an array of objects.
      Each object in the array must have three keys: "step" (an integer), "title" (a string), and "description" (a string).
      Do not include any text outside of the JSON object.
    `

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant that generates structured career roadmaps in JSON format." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" }, // Enforce JSON output
    })

    const roadmapData = JSON.parse(completion.choices[0].message.content)

    return new Response(JSON.stringify(roadmapData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})