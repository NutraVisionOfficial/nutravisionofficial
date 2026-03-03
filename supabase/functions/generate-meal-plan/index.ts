import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MealPlanRequest {
  dietType: string;
  allergies: string[];
  cookingTime: string;
  mealsPerDay: string;
  calorieTarget: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { dietType, allergies, cookingTime, mealsPerDay, calorieTarget } =
      (await req.json()) as MealPlanRequest;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const mealSlots =
      mealsPerDay === "3_meals_2_snacks"
        ? ["breakfast", "lunch", "snack_1", "dinner", "snack_2"]
        : ["breakfast", "lunch", "dinner"];

    const systemPrompt = `You are an expert Indian nutritionist and meal planner. Generate a 7-day meal plan.

RULES:
- Diet type: ${dietType}
- Allergies/exclusions: ${allergies.length ? allergies.join(", ") : "none"}
- Cooking time preference: ${cookingTime}
- Daily calorie target: ~${calorieTarget} kcal
- Meal slots per day: ${mealSlots.join(", ")}
- Focus on Indian cuisine with some global variety
- Each meal must have: name, emoji, calories, protein (g), carbs (g), fats (g), cooking time in minutes, portion description
- Distribute calories sensibly across meals

You MUST respond using the generate_meal_plan tool.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Generate a full 7-day meal plan for the week (Monday through Sunday) with ${mealSlots.length} meals per day. Target ~${calorieTarget} kcal per day.`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_meal_plan",
                description: "Return a structured 7-day meal plan",
                parameters: {
                  type: "object",
                  properties: {
                    days: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          day: {
                            type: "string",
                            enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                          },
                          meals: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                slot: { type: "string" },
                                name: { type: "string" },
                                emoji: { type: "string" },
                                calories: { type: "number" },
                                protein: { type: "number" },
                                carbs: { type: "number" },
                                fats: { type: "number" },
                                cook_time_mins: { type: "number" },
                                portion: { type: "string" },
                              },
                              required: [
                                "slot",
                                "name",
                                "emoji",
                                "calories",
                                "protein",
                                "carbs",
                                "fats",
                                "cook_time_mins",
                                "portion",
                              ],
                              additionalProperties: false,
                            },
                          },
                        },
                        required: ["day", "meals"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["days"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "generate_meal_plan" },
          },
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);

      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to generate meal plan." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(result));
      return new Response(
        JSON.stringify({ error: "AI did not return a structured meal plan." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const plan = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-meal-plan error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
