import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: "en" | "ro" }>;
};

export default async function PromotionsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main data-route="business-promotions">
      {/* UI: implement promotions purchase UI here */}
      {/* Actions: createCheckoutSession, createSubscriptionCheckout */}
    </main>
  );
}
