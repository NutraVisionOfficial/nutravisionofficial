import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Obtain a PayPal OAuth2 access token using client credentials.
 */
async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID")!;
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET")!;
  const base = "https://api-m.paypal.com";

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal token request failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * Verify a PayPal webhook event using the PayPal Webhook
 * Notifications Verify API (cryptographic signature check).
 */
async function verifyPayPalWebhook(
  req: Request,
  body: Record<string, unknown>
): Promise<boolean> {
  const webhookId = Deno.env.get("PAYPAL_WEBHOOK_ID");
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");

  if (!webhookId || !clientId || !clientSecret) {
    console.error("PayPal credentials not configured for webhook verification");
    return false;
  }

  const transmissionId = req.headers.get("paypal-transmission-id");
  const transmissionTime = req.headers.get("paypal-transmission-time");
  const transmissionSig = req.headers.get("paypal-transmission-sig");
  const certUrl = req.headers.get("paypal-cert-url");
  const authAlgo = req.headers.get("paypal-auth-algo");

  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
    console.error("Missing PayPal signature headers");
    return false;
  }

  try {
    const accessToken = await getPayPalAccessToken();
    const base = "https://api-m.paypal.com";

    const verifyRes = await fetch(
      `${base}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_algo: authAlgo,
          cert_url: certUrl,
          transmission_id: transmissionId,
          transmission_sig: transmissionSig,
          transmission_time: transmissionTime,
          webhook_id: webhookId,
          webhook_event: body,
        }),
      }
    );

    if (!verifyRes.ok) {
      const text = await verifyRes.text();
      console.error(`PayPal verify API error: ${verifyRes.status} ${text}`);
      return false;
    }

    const result = await verifyRes.json();
    return result.verification_status === "SUCCESS";
  } catch (err) {
    console.error("PayPal webhook verification failed:", err);
    return false;
  }
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

    // 1. Verify webhook authenticity via PayPal cryptographic signature
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

    // 2. Validate event structure
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
      return new Response(
        JSON.stringify({ received: true, ignored: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 4. Resolve the user
    const { email, customId } = extractSubscriberInfo(body);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let userId: string | null = customId;

    if (!userId && email) {
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
