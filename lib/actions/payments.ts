"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import { getStripe } from "@/lib/stripe/client";
import { PROMOTION_PRICES } from "@/lib/stripe/products";
import { success, failure } from "@/lib/utils/action-result";
import { supabaseDisabled } from "@/lib/utils/supabase-guard";
import type { ActionResult, PromotionType } from "@/types";

export async function createCheckoutSession(
  type: PromotionType,
  targetId?: string
): Promise<ActionResult<{ url: string }>> {
  const disabled = supabaseDisabled<{ url: string }>();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    if (!session.businessAccountId) {
      return failure("Business account required");
    }

    const price = PROMOTION_PRICES[type];
    if (!price) return failure("Invalid promotion type");

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: price.currency,
            unit_amount: price.amount,
            product_data: { name: price.label },
          },
          quantity: 1,
        },
      ],
      metadata: {
        business_account_id: session.businessAccountId,
        promotion_type: type,
        target_id: targetId ?? "",
      },
      success_url: `${appUrl}/business/promotions?success=true`,
      cancel_url: `${appUrl}/business/promotions?canceled=true`,
    });

    if (!checkoutSession.url) return failure("Failed to create checkout session");
    return success({ url: checkoutSession.url });
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to create checkout session"
    );
  }
}

export async function createSubscriptionCheckout(): Promise<
  ActionResult<{ url: string }>
> {
  const disabled = supabaseDisabled<{ url: string }>();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    if (!session.businessAccountId) {
      return failure("Business account required");
    }

    const priceId = process.env.STRIPE_PREMIUM_SUBSCRIPTION_PRICE_ID;
    if (!priceId) return failure("Subscription price not configured");

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        business_account_id: session.businessAccountId,
      },
      subscription_data: {
        metadata: {
          business_account_id: session.businessAccountId,
        },
      },
      success_url: `${appUrl}/business/promotions?subscription=success`,
      cancel_url: `${appUrl}/business/promotions?canceled=true`,
    });

    if (!checkoutSession.url) return failure("Failed to create checkout session");
    return success({ url: checkoutSession.url });
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to create subscription checkout"
    );
  }
}

export async function useSubscriptionQuota(
  type: PromotionType
): Promise<ActionResult> {
  const disabled = supabaseDisabled();
  if (disabled) return disabled;

  try {
    const session = await getSession();
    if (!session.businessAccountId) {
      return failure("Business account required");
    }

    const supabase = await createClient();
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("business_account_id", session.businessAccountId)
      .eq("status", "active")
      .single();

    if (!sub) return failure("No active subscription");

    const quotaMap: Record<PromotionType, { quota: string; used: string }> = {
      event_boost: {
        quota: "quota_promoted_events",
        used: "used_promoted_events",
      },
      feed_post: { quota: "quota_feed_posts", used: "used_feed_posts" },
      newsletter: { quota: "quota_newsletters", used: "used_newsletters" },
      social_media: { quota: "quota_social_posts", used: "used_social_posts" },
    };

    const mapping = quotaMap[type];
    const quota = sub[mapping.quota as keyof typeof sub] as number;
    const used = sub[mapping.used as keyof typeof sub] as number;

    if (used >= quota) return failure("Subscription quota exceeded");

    const updatePayload =
      type === "event_boost"
        ? { used_promoted_events: used + 1 }
        : type === "feed_post"
          ? { used_feed_posts: used + 1 }
          : type === "newsletter"
            ? { used_newsletters: used + 1 }
            : { used_social_posts: used + 1 };

    const { error } = await supabase
      .from("subscriptions")
      .update(updatePayload)
      .eq("id", sub.id);

    if (error) return failure(error.message);
    return success(undefined);
  } catch (e) {
    return failure(
      e instanceof Error ? e.message : "Failed to use subscription quota"
    );
  }
}
