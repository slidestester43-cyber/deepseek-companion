import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    console.log("M-Pesa callback received:", JSON.stringify(body));

    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) {
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resultCode = stkCallback.ResultCode;
    const checkoutRequestId = stkCallback.CheckoutRequestID;

    if (resultCode !== 0) {
      console.log(`Payment failed or cancelled. CheckoutRequestID: ${checkoutRequestId}, ResultCode: ${resultCode}`);
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract payment details from callback metadata
    const metadata = stkCallback.CallbackMetadata?.Item || [];
    let amount = 0;
    let mpesaReceiptNumber = "";
    let phoneNumber = "";

    for (const item of metadata) {
      if (item.Name === "Amount") amount = item.Value;
      if (item.Name === "MpesaReceiptNumber") mpesaReceiptNumber = item.Value;
      if (item.Name === "PhoneNumber") phoneNumber = String(item.Value);
    }

    console.log(`Payment successful: Amount=${amount}, Receipt=${mpesaReceiptNumber}, Phone=${phoneNumber}`);

    if (amount <= 0) {
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find user by phone number (stored in profiles)
    // Try multiple phone formats
    const phoneVariants = [
      phoneNumber,
      phoneNumber.replace(/^254/, "0"),
      `+${phoneNumber}`,
    ];

    let userId: string | null = null;

    for (const phone of phoneVariants) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("phone_number", phone)
        .single();
      if (profile) {
        userId = profile.user_id;
        break;
      }
    }

    if (!userId) {
      console.error(`No user found for phone: ${phoneNumber}`);
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Credit the user's balance
    const { data: balance } = await supabase
      .from("balances")
      .select("amount")
      .eq("user_id", userId)
      .single();

    if (balance) {
      const newAmount = Number(balance.amount) + amount;
      await supabase
        .from("balances")
        .update({ amount: newAmount })
        .eq("user_id", userId);
      console.log(`Credited KES ${amount} to user ${userId}. New balance: ${newAmount}`);
    }

    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("M-Pesa callback error:", error);
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
