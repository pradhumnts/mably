import { notFound } from "next/navigation";
import { LegalPage } from "@/components/marketing/legal-page";
import { getLegalPage, LEGAL_SLUGS } from "@/lib/marketing/legal-pages";

export function generateStaticParams() {
  return LEGAL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = getLegalPage(slug);

  if (!page) {
    return { title: "Not found" };
  }

  return {
    title: `${page.title} - Mably`,
    description: page.description,
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
