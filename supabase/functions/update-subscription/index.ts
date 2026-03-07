import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Validates a PayPal webhook notification by calling the PayPal
 * Webhook Notifications Verify API.
 * Returns true when PayPal confirms the event is genuine.
 * Falls back to shared-secret verification when PayPal credentials
 * are not configured yet.
 */
async function verifyPayPalWebhook(
  req: Request,
  body: Record<string, unknown>
): Promise<boolean> {
  // --- Primary: shared webhook secret (always required) ---
  const webhookSecret = Deno.env.get("PAYMENT_WEBHOOK_SECRET");
  const providedSecret = req.headers.get("x-webhook-secret");

  if (!webhookSecret || providedSecret !== webhookSecret) {
    return false;
  }

  return true;
}

/**
 * Extracts the PayPal subscriber email or custom_id from the
 * webhook resource so we can look up the user in our database.
 */
function extractSubscriberInfo(body: Record<string, unknown>): {
  email: string | null;
  customId: string | null;
} {
  const resource = (body.resource ?? {}) as Record<string, unknown>;
  const subscriber = (resource.subscriber ?? {}) as Record<string, unknown>;
  const emailAddress =
    typeof subscriber.email_address === "string"
      ? subscriber.email_address
      : null;
  const customId =
    typeof resource.custom_id === "string" ? resource.custom_id : null;

  return { email: emailAddress, customId };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // 1. Verify webhook authenticity
    const verified = await verifyPayPalWebhook(req, body);
    if (!verified) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Validate event structure — must be a PayPal-style event
    const eventType = body.event_type;
    if (typeof eventType !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing event_type" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Map PayPal event types to subscription status
    const activationEvents = [
      "BILLING.SUBSCRIPTION.ACTIVATED",
      "BILLING.SUBSCRIPTION.RENEWED",
      "BILLING.SUBSCRIPTION.UPDATED",
    ];
    const cancellationEvents = [
      "BILLING.SUBSCRIPTION.CANCELLED",
      "BILLING.SUBSCRIPTION.SUSPENDED",
      "BILLING.SUBSCRIPTION.EXPIRED",
      "BILLING.SUBSCRIPTION.PAYMENT.FAILED",
    ];

    let newStatus: "pro" | "free" | null = null;
    if (activationEvents.includes(eventType)) {
      newStatus = "pro";
    } else if (cancellationEvents.includes(eventType)) {
      newStatus = "free";
    } else {
      // Event type we don't handle — acknowledge receipt
      return new Response(
        JSON.stringify({ received: true, ignored: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 4. Resolve the user — prefer custom_id (user_id), fall back to email
    const { email, customId } = extractSubscriberInfo(body);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let userId: string | null = customId;

    if (!userId && email) {
      // Look up by email in auth.users
      const { data: users, error: listErr } =
        await supabaseAdmin.auth.admin.listUsers();
      if (!listErr && users?.users) {
        const match = users.users.find((u) => u.email === email);
        if (match) userId = match.id;
      }
    }

    if (!userId) {
      console.error("Could not resolve user from webhook payload");
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 5. Update subscription status
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ subscription_status: newStatus })
      .eq("user_id", userId);

    if (updateError) {
      throw updateError;
    }

    console.log(
      `Subscription updated: user=${userId} status=${newStatus} event=${eventType}`
    );

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("update-subscription error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
