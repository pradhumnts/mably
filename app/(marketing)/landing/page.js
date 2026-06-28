import { MablyLandingPage } from "@/components/marketing/mably-landing-page";
import { LANDING_FAQ } from "@/lib/marketing/landing-faq";

export const metadata = {
  title: "Mably — Client workspace for freelancers",
  description:
    "Stop running client projects from scattered messages. Mably gives freelancers one branded link for updates, files, feedback, and approvals — from $9/month.",
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

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <MablyLandingPage />
    </>
  );
}
