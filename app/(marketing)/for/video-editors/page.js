import { ForAudiencePage } from "@/components/marketing/for-audience-page";
import { FOR_VIDEO_EDITORS } from "@/lib/marketing/for-video-editors";
import {
  getCanonicalMarketingUrl,
  getSocialShareMetadata,
} from "@/lib/marketing/social-share-metadata";

const { title, description } = FOR_VIDEO_EDITORS.meta;
const pageUrl = `${getCanonicalMarketingUrl()}/for/video-editors`;

export const metadata = {
  title,
  description,
  ...getSocialShareMetadata({ title, description, url: pageUrl }),
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FOR_VIDEO_EDITORS.faqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export default function ForVideoEditorsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <ForAudiencePage content={FOR_VIDEO_EDITORS} />
    </>
  );
}
