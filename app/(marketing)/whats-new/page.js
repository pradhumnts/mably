import {
  getCanonicalMarketingUrl,
  getSocialShareMetadata,
} from "@/lib/marketing/social-share-metadata";
import { WhatsNewPage } from "@/components/marketing/whats-new-page";

const title = "What's New";
const description =
  "See what's new in Mably — features and improvements for your client workspace, from approvals and file versions to branding and more.";
const pageUrl = `${getCanonicalMarketingUrl()}/whats-new`;

export const metadata = {
  title,
  description,
  ...getSocialShareMetadata({ title, description, url: pageUrl }),
};

export default function WhatsNewRoute() {
  return <WhatsNewPage />;
}
