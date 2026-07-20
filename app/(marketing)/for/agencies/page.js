import { ForAudiencePage } from "@/components/marketing/for-audience-page";
import { FOR_AGENCIES } from "@/lib/marketing/for-agencies";
import {
  getCanonicalMarketingUrl,
  getSocialShareMetadata,
} from "@/lib/marketing/social-share-metadata";

const { title, description } = FOR_AGENCIES.meta;
const pageUrl = `${getCanonicalMarketingUrl()}/for/agencies`;

export const metadata = {
  title,
  description,
  ...getSocialShareMetadata({ title, description, url: pageUrl }),
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FOR_AGENCIES.faqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export default function ForAgenciesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <ForAudiencePage content={FOR_AGENCIES} />
    </>
  );
}
