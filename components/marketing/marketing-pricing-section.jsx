import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MARKETING_PRICING_PLANS } from "@/lib/marketing/pricing-plans";
import { appPath } from "@/lib/site-urls";

const APP_SIGN_UP = appPath("/?intent=signup");

/**
 * Pricing cards — same block as the homepage #pricing section.
 * @param {{ id?: string; className?: string; showHeader?: boolean; headerAnimateOnLoad?: boolean }} props
 */
export function MarketingPricingSection({
  id = "pricing",
  className,
  showHeader = true,
  headerAnimateOnLoad = false,
}) {
  return (
    <section
      id={id}
      className={cn("relative scroll-mt-24 px-4 py-24 sm:px-5 sm:py-32", className)}
    >
      <div className="relative mx-auto max-w-6xl">
        {showHeader ? (
          <div
            className="mx-auto mb-14 max-w-2xl text-center sm:mb-16"
            {...(headerAnimateOnLoad ? { "data-animate-on-load": true } : {})}
          >
            <p
              data-reveal
              className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400"
            >
              Pricing
            </p>
            <h2
              data-split
              className="mt-3 text-balance text-3xl font-semibold tracking-[-0.03em] text-zinc-900 sm:text-4xl lg:text-[2.75rem]"
            >
              One workspace for your clients.
              <span className="font-normal text-zinc-400"> One honest price for you.</span>
            </h2>
            <p
              data-reveal
              className="mt-4 text-base leading-relaxed text-zinc-500 sm:mt-5 sm:text-lg"
            >
              Stop stitching together email, Drive, and invoices. Send one branded client portal
              — clients know what to review, what changed, and what was approved. Cancel anytime.
            </p>
          </div>
        ) : null}

        <div
          data-reveal-group
          className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-2 lg:items-stretch"
        >
          {MARKETING_PRICING_PLANS.map((plan) => (
            <div
              key={plan.name}
              data-reveal-item
              className={cn(
                "relative flex flex-col rounded-[1.75rem] p-8 sm:p-9",
                plan.highlight
                  ? "bg-orange-500 text-white shadow-[0_24px_60px_-20px_rgba(249,115,22,0.55)]"
                  : "border border-zinc-100 bg-white text-zinc-900 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.12)]"
              )}
            >
              {plan.savingsBadge ? (
                <span className="absolute right-5 top-5 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-orange-600 shadow-sm ring-1 ring-white/80">
                  {plan.savingsBadge}
                </span>
              ) : null}

              <div>
                <h3 className="text-2xl font-semibold tracking-[-0.02em] sm:text-[1.75rem]">
                  {plan.name}
                </h3>
                <p
                  className={cn(
                    "mt-2 text-sm leading-relaxed",
                    plan.highlight ? "text-white/75" : "text-zinc-500"
                  )}
                >
                  {plan.description}
                </p>
              </div>

              <div className="mt-8 flex items-baseline gap-2">
                {plan.originalPrice ? (
                  <span
                    className={cn(
                      "text-2xl font-medium line-through sm:text-3xl",
                      plan.highlight ? "text-white/50" : "text-zinc-400"
                    )}
                  >
                    {plan.originalPrice}
                  </span>
                ) : null}
                <span className="text-5xl font-semibold tracking-tight sm:text-[3.25rem]">
                  {plan.price}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    plan.highlight ? "text-white/70" : "text-zinc-500"
                  )}
                >
                  {plan.period}
                </span>
              </div>

              <p
                className={cn(
                  "mt-3 text-sm leading-relaxed",
                  plan.highlight ? "text-white/75" : "text-zinc-500"
                )}
              >
                {plan.note}
              </p>

              <ul className="mt-8 flex-1 space-y-3.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-[15px] leading-snug">
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        plan.highlight ? "text-white" : "text-zinc-900"
                      )}
                      strokeWidth={2.5}
                    />
                    <span className={plan.highlight ? "text-white/90" : "text-zinc-700"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                asChild
                className={cn(
                  "mt-10 h-12 w-full rounded-full text-[15px] font-semibold",
                  plan.highlight
                    ? "bg-white text-orange-600 hover:bg-orange-50"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                )}
              >
                <Link href={APP_SIGN_UP}>
                  {plan.cta}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>

        <p
          data-reveal
          className="mx-auto mt-12 max-w-xl text-center text-sm leading-relaxed text-zinc-500 sm:text-[15px]"
        >
          We&apos;re offering the first 50 members{" "}
          <span className="font-medium text-zinc-700">75% off locked in forever</span> — for
          freelancers who want clearer projects without the chaos. Spots are filling fast.
        </p>
      </div>
    </section>
  );
}
