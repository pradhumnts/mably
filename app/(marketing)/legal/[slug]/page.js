import { notFound } from "next/navigation";
import { LegalPage } from "@/components/marketing/legal-page";
import { getLegalPage, LEGAL_SLUGS } from "@/lib/marketing/legal-pages";
import {
  getCanonicalMarketingUrl,
  getSocialShareMetadata,
} from "@/lib/marketing/social-share-metadata";

export function generateStaticParams() {
  return LEGAL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = getLegalPage(slug);

  if (!page) {
    return { title: "Not found" };
  }

  const title = `${page.title} - Mably`;
  const description = page.description;
  const pageUrl = `${getCanonicalMarketingUrl()}/legal/${slug}`;

  return {
    title,
    description,
    ...getSocialShareMetadata({ title, description, url: pageUrl }),
  };
}

export default async function LegalDocumentPage({ params }) {
  const { slug } = await params;
  const page = getLegalPage(slug);

  if (!page) {
    notFound();
  }

  return <LegalPage page={page} activeSlug={slug} />;
}
