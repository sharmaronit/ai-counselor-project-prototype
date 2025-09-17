import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY')
const SEARCH_QUERIES = ['indan scholarships', 'career development tips in india', 'engineering colleges in india news']

serve(async (_req) => {
  // NOTE: We don't need the 'req' object anymore because this is an admin task.
  try {
    // Create a special Supabase client with admin privileges
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use the powerful service_role key
    )

    const randomQuery = SEARCH_QUERIES[Math.floor(Math.random() * SEARCH_QUERIES.length)]
    const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(randomQuery)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`

    const newsResponse = await fetch(newsApiUrl)
    if (!newsResponse.ok) {
      const errorBody = await newsResponse.text()
      throw new Error(`NewsAPI request failed with status ${newsResponse.status}: ${errorBody}`)
    }
    const newsData = await newsResponse.json()

    if (!newsData.articles || newsData.articles.length === 0) {
      return new Response(JSON.stringify({ message: "No new articles found." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const notificationsToInsert = newsData.articles.map(article => ({
      title: article.title,
      content: article.description,
      source_url: article.url,
      category: randomQuery,
      published_at: article.publishedAt,
    }))

    // Use the admin client to insert data, bypassing any RLS policies
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert(notificationsToInsert)
      .select()

    if (error) throw error

    return new Response(JSON.stringify({ message: `Successfully inserted ${data.length} new notifications.` }), {
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