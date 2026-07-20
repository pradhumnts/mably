import { ForAudiencePage } from "@/components/marketing/for-audience-page";
import { FOR_CONSULTANTS } from "@/lib/marketing/for-consultants";
import {
  getCanonicalMarketingUrl,
  getSocialShareMetadata,
} from "@/lib/marketing/social-share-metadata";

const { title, description } = FOR_CONSULTANTS.meta;
const pageUrl = `${getCanonicalMarketingUrl()}/for/consultants`;

export const metadata = {
  title,
  description,
  ...getSocialShareMetadata({ title, description, url: pageUrl }),
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FOR_CONSULTANTS.faqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export default function ForConsultantsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <ForAudiencePage content={FOR_CONSULTANTS} />
    </>
  );
}
