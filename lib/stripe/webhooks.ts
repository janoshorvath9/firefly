import { createAdminClient } from "@/lib/supabase/admin";
import { PROMOTION_DURATION_DAYS, SUBSCRIPTION_QUOTAS } from "./products";
import type Stripe from "stripe";

export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const admin = createAdminClient();
  const metadata = session.metadata ?? {};
  const businessAccountId = metadata.business_account_id;
  const promotionType = metadata.promotion_type;
  const targetId = metadata.target_id;

  if (!businessAccountId || !promotionType) return;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + PROMOTION_DURATION_DAYS);

  if (promotionType === "event_boost" && targetId) {
    await admin.from("promotions").insert({
      business_account_id: businessAccountId,
      type: promotionType,
      target_id: targetId,
      expires_at: expiresAt.toISOString(),
      stripe_payment_id: session.payment_intent as string,
      is_active: true,
    });

    await admin
      .from("events")
      .update({ is_promoted: true, promotion_intensity: 3 })
      .eq("id", targetId);
  } else if (targetId) {
    await admin.from("promotions").insert({
      business_account_id: businessAccountId,
      type: promotionType,
      target_id: targetId,
      expires_at: expiresAt.toISOString(),
      stripe_payment_id: session.payment_intent as string,
      is_active: true,
    });
  }
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const admin = createAdminClient();
  const businessAccountId = subscription.metadata.business_account_id;
  if (!businessAccountId) return;

  const item = subscription.items.data[0];
  const periodStart = new Date(
    (item?.current_period_start ?? Math.floor(Date.now() / 1000)) * 1000
  );
  const periodEnd = new Date(
    (item?.current_period_end ?? Math.floor(Date.now() / 1000)) * 1000
  );

  await admin.from("subscriptions").upsert(
    {
      business_account_id: businessAccountId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status,
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      ...SUBSCRIPTION_QUOTAS,
      used_promoted_events: 0,
      used_feed_posts: 0,
      used_newsletters: 0,
      used_social_posts: 0,
    },
    { onConflict: "business_account_id" }
  );
}

export async function isWebhookProcessed(
  stripeEventId: string
): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("stripe_webhook_events")
    .select("id")
    .eq("stripe_event_id", stripeEventId)
    .maybeSingle();
  return !!data;
}

export async function markWebhookProcessed(
  stripeEventId: string
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("stripe_webhook_events")
    .insert({ stripe_event_id: stripeEventId });
}
