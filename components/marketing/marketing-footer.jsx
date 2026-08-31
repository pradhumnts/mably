import Link from "next/link";
import { LEGAL_LINKS } from "@/lib/constants/legal-links";
import { DEMO_PORTAL_HREF } from "@/lib/data/demo-project";
import { appPath } from "@/lib/site-urls";

const APP_SIGN_IN = appPath("/");
const APP_SIGN_UP = appPath("/?intent=signup");
const APP_DEMO = appPath(DEMO_PORTAL_HREF);

/**
 * Footer link columns. Items with `soon: true` render as muted labels with a
 * "Soon" pill — swap the flag for a `href` when the page ships (e.g. Vs pages
 * and the blog).
 */
const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Explore the demo", href: APP_DEMO },
      { label: "Get started", href: APP_SIGN_UP },
      { label: "Sign in", href: APP_SIGN_IN },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "For freelancers", href: "/for/freelancers" },
      { label: "For designers", href: "/for/designers" },
      { label: "For web designers", href: "/for/web-designers" },
      { label: "For agencies", href: "/for/agencies" },
      { label: "For video editors", href: "/for/video-editors" },
      { label: "For photographers", href: "/for/photographers" },
      { label: "For consultants", href: "/for/consultants" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "What’s new", href: "/whats-new" },
      { label: "Blog", href: "/blog" },
      { label: "Compare", soon: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: LEGAL_LINKS.terms },
      { label: "Privacy", href: LEGAL_LINKS.privacy },
      { label: "Refund", href: LEGAL_LINKS.refund },
    ],
  },
];

/**
 * Shared marketing footer — brand column + categorized link columns.
 * @param {{ blurb?: string }} props — per-page tagline under the logo.
 */
export function MarketingFooter({ blurb, noBorder = false }) {
  return (
    <footer className={`${noBorder ? "pt-10 sm:pt-12" : "border-t border-zinc-100 pt-16 sm:pt-20"} bg-[#faf9f6] px-4 pb-10 sm:px-5`}>
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)] lg:gap-20">
          {/* Brand */}
          <div>
            <img
              src="/images/Logo-SVG.svg"
              alt="Mably"
              className="h-7 w-auto"
              draggable={false}
            />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">
              {blurb || "A calmer client experience — one branded link for files, feedback, and approvals."}
            </p>
            <p className="mt-6 text-xs text-zinc-400">
              From $9/month · Cancel anytime
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            {FOOTER_COLUMNS.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
                  {column.title}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {link.soon ? (
                        <span className="inline-flex items-center gap-2 text-sm text-zinc-400">
                          {link.label}
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                            Soon
                          </span>
                        </span>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-zinc-600 transition-colors duration-300 hover:text-zinc-900"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-zinc-200/70 pt-6 sm:flex-row">
          <p className="text-sm text-zinc-400">© {new Date().getFullYear()} Mably</p>
          <p className="text-sm text-zinc-400">
            Built for amazing client experiences.
          </p>
        </div>
      </div>
    </footer>
  );
}
