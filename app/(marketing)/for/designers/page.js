import { ForAudiencePage } from "@/components/marketing/for-audience-page";
import { FOR_DESIGNERS } from "@/lib/marketing/for-designers";
import {
  getCanonicalMarketingUrl,
  getSocialShareMetadata,
} from "@/lib/marketing/social-share-metadata";

const { title, description } = FOR_DESIGNERS.meta;
const pageUrl = `${getCanonicalMarketingUrl()}/for/designers`;

export const metadata = {
  title,
  description,
  ...getSocialShareMetadata({ title, description, url: pageUrl }),
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FOR_DESIGNERS.faqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export default function ForDesignersPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <ForAudiencePage content={FOR_DESIGNERS} />
    </>
  );
}
