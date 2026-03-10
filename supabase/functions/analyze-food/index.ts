import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate image size (max ~5 MB base64)
    const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
    if (typeof imageBase64 !== "string" || imageBase64.length > MAX_IMAGE_BYTES) {
      return new Response(
        JSON.stringify({ error: "Image too large. Maximum size is 5 MB." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate the image data URL format
    let imageUrl = imageBase64;
    if (!imageUrl.startsWith("data:image/")) {
      // If raw base64 without prefix, add it
      imageUrl = `data:image/jpeg;base64,${imageUrl}`;
    }

    console.log("Image URL prefix:", imageUrl.substring(0, 40));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch(
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
            {
              role: "system",
              content: `You are a food nutrition analyst. When given an image of food, identify all food items visible, estimate portion sizes, and calculate nutritional information. Return ONLY a valid JSON object with this exact structure, no markdown, no explanation:
{"name":"Food Name","calories":number,"protein":number,"carbs":number,"fats":number,"health_score":number,"verdict":"Excellent"|"Good"|"Mediocre"|"Avoid","reasoning":"one sentence explanation"}
- name: descriptive name of the food/meal
- calories: estimated total kcal
- protein: grams of protein
- carbs: grams of carbohydrates
- fats: grams of fat
- health_score: 0-100 rating based on nutritional density, ingredient quality, and macro balance. 80-100=Excellent, 50-79=Good, 25-49=Mediocre, 0-24=Avoid
- verdict: one of "Excellent", "Good", "Mediocre", or "Avoid" matching the health_score range
- reasoning: one short sentence explaining the score (e.g. "High protein with balanced macros and whole ingredients")
If you cannot identify food in the image, return: {"error":"No food detected in image"}`,
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Identify the food in this image. Estimate the portion size, calories, protein, carbs, and fats." },
                {
                  type: "image_url",
                  image_url: { url: imageUrl },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON from the AI response
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.error) {
      return new Response(
        JSON.stringify({ error: parsed.error }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-food error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
