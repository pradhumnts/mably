import Link from "next/link";
import { LEGAL_NAV } from "@/lib/marketing/legal-pages";
import { appPath } from "@/lib/site-urls";

function renderInlinePart(part, index) {
  if (typeof part === "string") {
    return <span key={index}>{part}</span>;
  }

  const text = part.text ?? "";
  if (!part.href) {
    return (
      <strong key={index} className="font-semibold text-zinc-900">
        {text}
      </strong>
    );
  }

  const isExternal =
    part.external || part.href.startsWith("http") || part.href.startsWith("mailto:");

  if (isExternal) {
    return (
      <a
        key={index}
        href={part.href}
        className="text-orange-600 underline underline-offset-4 transition hover:text-orange-700"
        {...(part.href.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {text}
      </a>
    );
  }

  return (
    <Link
      key={index}
      href={part.href}
      className="text-orange-600 underline underline-offset-4 transition hover:text-orange-700"
    >
      {text}
    </Link>
  );
}

function LegalBlock({ block }) {
  if (block.type === "ul") {
    return (
      <ul className="my-4 list-disc space-y-2 pl-5 text-zinc-600">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  const Tag = block.type === "h3" ? "h3" : "p";
  const className =
    block.type === "h3"
      ? "mt-6 text-base font-semibold text-zinc-900 first:mt-0"
      : "my-4 text-base leading-relaxed text-zinc-600 first:mt-0 last:mb-0";

  return (
    <Tag className={className}>
      {block.parts.map((part, index) => renderInlinePart(part, index))}
    </Tag>
  );
}

/**
 * Shared layout for /legal/* pages.
 */
export function LegalPage({ page, activeSlug }) {
  return (
    <div className="min-h-svh bg-white text-zinc-900">
      <header className="border-b border-zinc-100 px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link href="/" className="shrink-0">
            <img
              src="/images/Logo-SVG.svg"
              alt="Mably"
              className="h-6 w-auto opacity-90"
              draggable={false}
            />
          </Link>
          <Link
            href={appPath("/")}
            className="text-sm text-zinc-500 transition hover:text-orange-600"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-sm text-zinc-400">Last update: {page.lastUpdated}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          {page.title}
        </h1>

        <div className="mt-8 border-t border-zinc-100 pt-8">
          {page.intro?.map((block, index) => (
            <LegalBlock key={`intro-${index}`} block={block} />
          ))}

          {page.sections.map((section) => (
            <section key={section.heading ?? "section"} className="mt-10 first:mt-0">
              {section.heading ? (
                <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
                  {section.heading}
                </h2>
              ) : null}
              <div className={section.heading ? "mt-4" : ""}>
                {section.blocks.map((block, index) => (
                  <LegalBlock key={`${section.heading}-${index}`} block={block} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-zinc-100 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <nav
            className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-500"
            aria-label="Legal"
          >
            {LEGAL_NAV.map((item) => (
              <Link
                key={item.slug}
                href={`/legal/${item.slug}`}
                className={
                  item.slug === activeSlug
                    ? "font-medium text-zinc-900"
                    : "transition hover:text-orange-600"
                }
                aria-current={item.slug === activeSlug ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="mt-6 text-sm text-zinc-400">
            © {new Date().getFullYear()} Mably
          </p>
        </div>
      </footer>
    </div>
  );
}
