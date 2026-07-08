import { MablyLandingPage } from "@/components/marketing/mably-landing-page";
import { LANDING_FAQ } from "@/lib/marketing/landing-faq";

export const metadata = {
  title: "Mably — Simple client portal for freelancers",
  description:
    "A simple client portal for freelancers — manage client communication, files, feedback, approvals, and project handoff in one branded link. From $9/month.",
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: LANDING_FAQ.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Mably",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Simple client portal for freelancers to manage client communication, files, feedback, approvals, and project handoff in one branded workspace.",
  offers: {
    "@type": "Offer",
    price: "9",
    priceCurrency: "USD",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "9",
      priceCurrency: "USD",
      unitText: "month",
    },
  },
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <MablyLandingPage />
    </>
  );
}
