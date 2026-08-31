import {
  getCanonicalMarketingUrl,
  getSocialShareMetadata,
} from "@/lib/marketing/social-share-metadata";
import { PricingPage } from "@/components/marketing/pricing-page";

const title = "Pricing";
const description =
  "Simple, honest pricing for Mably — one branded client portal for files, feedback, and approvals. Starter from $2.25/mo, Growth from $4.75/mo. Cancel anytime.";
const pageUrl = `${getCanonicalMarketingUrl()}/pricing`;

export const metadata = {
  title,
  description,
  ...getSocialShareMetadata({ title, description, url: pageUrl }),
};

export default function PricingRoute() {
  return <PricingPage />;
}
