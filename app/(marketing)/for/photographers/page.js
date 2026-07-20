import { ForAudiencePage } from "@/components/marketing/for-audience-page";
import { FOR_PHOTOGRAPHERS } from "@/lib/marketing/for-photographers";
import {
  getCanonicalMarketingUrl,
  getSocialShareMetadata,
} from "@/lib/marketing/social-share-metadata";

const { title, description } = FOR_PHOTOGRAPHERS.meta;
const pageUrl = `${getCanonicalMarketingUrl()}/for/photographers`;

export const metadata = {
  title,
  description,
  ...getSocialShareMetadata({ title, description, url: pageUrl }),
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FOR_PHOTOGRAPHERS.faqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export default function ForPhotographersPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <ForAudiencePage content={FOR_PHOTOGRAPHERS} />
    </>
  );
}
