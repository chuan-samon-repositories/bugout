import type { Metadata } from "next";
import { getContainer } from "@/infrastructure/config";
import { CheckoutFlow } from "@/presentation/components/checkout/CheckoutFlow";
import { messages } from "@/presentation/i18n";

export const metadata: Metadata = {
  title: messages.checkout.metadata.title,
  robots: { index: false },
};

export default function CheckoutPage() {
  return <CheckoutFlow provider={getContainer().getProvider()} />;
}
