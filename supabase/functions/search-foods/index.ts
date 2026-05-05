// Universal food search powered by Lovable AI.
// Returns categorized results: Popular Globally + Regional Favorites.
// Understands food names in any language.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FoodItem {
  name: string;
  emoji: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  origin: string;
}

interface SearchResponse {
  global: FoodItem[];
  regional: FoodItem[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated user to prevent abuse of AI credits
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required", global: [], regional: [] }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await authClient.auth.getUser();
    if (userErr || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication", global: [], regional: [] }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { query, region } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ global: [], regional: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const safeQuery = query.trim().slice(0, 120);
    const safeRegion = (typeof region === "string" && region.trim()) || "India";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a multilingual nutrition expert. Users may search in any language (English, Hindi, Spanish, Italian, Japanese, Mandarin, Arabic, French, etc.). Translate and interpret intent. Return realistic per-serving nutrition for common foods/dishes worldwide.

Always return TWO buckets:
1. "global" — up to 5 popular dishes globally that match the query (Italian, Japanese, Mexican, American, Mediterranean, Chinese, etc.).
2. "regional" — up to 5 dishes from the user's region (${safeRegion}) that match the query. If region is "India", prioritize Indian dishes (Roti, Sabji, Dal, Biryani, etc.).

If the query clearly maps to a single dish, still try to surface variants (e.g. "pasta" -> carbonara, pesto, arrabbiata globally; pasta-style Indian dishes regionally).
Use sensible emojis. Portions in human terms ("1 cup", "1 medium", "100g"). Numbers must be integers (round)."}`;

    const tool = {
      type: "function",
      function: {
        name: "return_food_results",
        description: "Return categorized food search results",
        parameters: {
          type: "object",
          properties: {
            global: { type: "array", items: foodItemSchema() },
            regional: { type: "array", items: foodItemSchema() },
          },
          required: ["global", "regional"],
          additionalProperties: false,
        },
      },
    };

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `User region: ${safeRegion}\nSearch query: "${safeQuery}"` },
          ],
          tools: [tool],
          tool_choice: { type: "function", function: { name: "return_food_results" } },
        }),
      },
    );

    if (!aiResp.ok) {
      const text = await aiResp.text();
      console.error("AI gateway error", aiResp.status, text);
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit hit, try again in a moment.", global: [], regional: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits in Workspace → Usage.", global: [], regional: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: "Search temporarily unavailable.", global: [], regional: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await aiResp.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    let parsed: SearchResponse = { global: [], regional: [] };
    if (args) {
      try { parsed = JSON.parse(args); } catch (e) { console.error("Parse error:", e); }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("search-foods error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown", global: [], regional: [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function foodItemSchema() {
  return {
    type: "object",
    properties: {
      name: { type: "string" },
      emoji: { type: "string" },
      portion: { type: "string" },
      calories: { type: "integer" },
      protein: { type: "integer" },
      carbs: { type: "integer" },
      fats: { type: "integer" },
      origin: { type: "string", description: "Country/region of origin" },
    },
    required: ["name", "emoji", "portion", "calories", "protein", "carbs", "fats", "origin"],
    additionalProperties: false,
  };
}
