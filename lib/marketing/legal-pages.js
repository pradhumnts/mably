/**
 * Legal page content (migrated from mably.io Framer site).
 * @typedef {{ text: string, href?: string, external?: boolean }} LegalInlinePart
 * @typedef {{ type: 'p' | 'h3', parts: (string | LegalInlinePart)[] }} LegalBlock
 * @typedef {{ type: 'ul', items: string[] }} LegalListBlock
 * @typedef {LegalBlock | LegalListBlock} LegalSectionBlock
 * @typedef {{ title: string, description: string, lastUpdated: string, intro?: LegalSectionBlock[], sections: { heading?: string, blocks: LegalSectionBlock[] }[] }} LegalPage
 */

/** @type {Record<string, LegalPage>} */
export const LEGAL_PAGES = {
  "terms-conditions": {
    title: "Terms & Conditions",
    description:
      "Terms governing your access to Mably's website, application, and related services.",
    lastUpdated: "June 1, 2026",
    intro: [
      {
        type: "p",
        parts: [
          'These Terms & Conditions ("Terms") govern your access to Mably\'s website (mably.io), application (app.mably.io), and related services ("Service"). By using the Service, you agree to these Terms.',
        ],
      },
    ],
    sections: [
      {
        heading: "Who we are",
        blocks: [
          {
            type: "p",
            parts: [
              'These Terms are between you and ',
              { text: "Mably", href: undefined },
              ' ("Mably", "we", "us"). Mably provides software for freelancers and studios to run branded client portals for project delivery. Mably is operated from ',
              { text: "India", href: undefined },
              ".",
            ],
          },
          {
            type: "p",
            parts: [
              "Privacy: see our Privacy Policy at ",
              { text: "mably.io/legal/privacy-policy", href: "/legal/privacy-policy" },
              "\nRefunds: see our Refund Policy at ",
              { text: "mably.io/legal/refund-policy", href: "/legal/refund-policy" },
            ],
          },
          {
            type: "p",
            parts: [
              {
                text: "We are committed to",
              },
              " respecting and protecting any personal information you share with us. (You can read more in our Privacy Policy.)",
            ],
          },
        ],
      },
      {
        heading: "1. Introduction",
        blocks: [
          {
            type: "p",
            parts: [
              "Mably is software run by our team and is currently in active development. By accessing our website, joining the waitlist, signing up for early access, or using the product, you agree to these Terms.",
            ],
          },
        ],
      },
      {
        heading: "2. Eligibility and accounts",
        blocks: [
          {
            type: "p",
            parts: [
              "You must be at least 18 and able to enter a binding contract. You are responsible for your account credentials and activity under your account.",
            ],
          },
          {
            type: "p",
            parts: [
              "You must provide accurate information and keep it updated. You may not use the Service for unlawful purposes, spam, malware, or to harass others.",
            ],
          },
        ],
      },
      {
        heading: "3. Subscriptions and billing",
        blocks: [
          {
            type: "p",
            parts: [
              "Some features require a paid subscription (e.g. Starter or Growth plans). Prices and features are described on our website or in the app and may change with notice where required.",
            ],
          },
          {
            type: "p",
            parts: [
              "Payments are processed by our payment provider (Polar). By subscribing, you authorize recurring charges according to your plan until you cancel. Cancellation and refunds are governed by our Refund Policy.",
            ],
          },
          {
            type: "p",
            parts: [
              "We may suspend or limit access for non-payment, abuse, or violation of these Terms.",
            ],
          },
        ],
      },
      {
        heading: "4. Client portals and your content",
        blocks: [
          {
            type: "p",
            parts: [
              "You may invite clients to project portals and upload content (files, messages, branding, etc.). ",
              { text: "You control what you share" },
              " and are responsible for having the right to use and share that content with your clients.",
            ],
          },
          {
            type: "p",
            parts: [
              "You grant Mably a limited license to host, display, and process your content solely to provide the Service.",
            ],
          },
          {
            type: "p",
            parts: [
              "You must not upload illegal content or violate others' rights. We may remove content or suspend accounts that violate these Terms or create risk for us or other users.",
            ],
          },
          {
            type: "p",
            parts: [
              {
                text: "Client relationship:",
              },
              " Mably is not a party to your contracts with clients. Fees your clients pay you for work are outside Mably unless we explicitly offer that feature later.",
            ],
          },
        ],
      },
      {
        heading: "5. Acceptable use",
        blocks: [
          {
            type: "p",
            parts: ["You agree not to:"],
          },
          {
            type: "ul",
            items: [
              "Reverse engineer or scrape the Service except as allowed by law",
              "Overload or disrupt our systems",
              "Attempt unauthorized access to other accounts or data",
              "Misrepresent your identity or impersonate others",
            ],
          },
        ],
      },
      {
        heading: "6. Intellectual property",
        blocks: [
          {
            type: "p",
            parts: [
              "Mably's software, branding, and website content are owned by Mably or our licensors. These Terms do not transfer ownership to you.",
            ],
          },
          {
            type: "p",
            parts: [
              "Your content remains yours, subject to the license you grant us above.",
            ],
          },
        ],
      },
      {
        heading: "7. Service availability",
        blocks: [
          {
            type: "p",
            parts: [
              "We strive for reliable uptime but do not guarantee uninterrupted or error-free operation. We may modify, suspend, or discontinue features with reasonable notice where practical.",
            ],
          },
          {
            type: "p",
            parts: [
              'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" TO THE MAXIMUM EXTENT PERMITTED BY LAW. WE DISCLAIM WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.',
            ],
          },
        ],
      },
      {
        heading: "8. Limitation of liability",
        blocks: [
          {
            type: "p",
            parts: [
              "To the maximum extent permitted by law, Mably and its operators will not be liable for indirect, incidental, special, consequential, or punitive damages, or loss of profits, data, or goodwill.",
            ],
          },
          {
            type: "p",
            parts: [
              "Our total liability for claims relating to the Service in any 12-month period is limited to the greater of (a) amounts you paid us for the Service in that period, or (b) USD $100.",
            ],
          },
          {
            type: "p",
            parts: [
              "Some jurisdictions do not allow certain limits; in those cases, our liability is limited to the fullest extent permitted by law.",
            ],
          },
        ],
      },
      {
        heading: "9. Termination",
        blocks: [
          {
            type: "p",
            parts: [
              "You may stop using the Service and cancel your subscription at any time per the Refund Policy.",
            ],
          },
          {
            type: "p",
            parts: [
              "We may suspend or terminate your access if you breach these Terms, create security risk, or where required by law. Upon termination, your right to use the Service ends; we may delete or retain data per our Privacy Policy and legal obligations.",
            ],
          },
        ],
      },
      {
        heading: "10. Contact",
        blocks: [
          {
            type: "p",
            parts: [
              "Questions about these Terms: ",
              { text: "hello@mably.io", href: "mailto:hello@mably.io" },
            ],
          },
        ],
      },
      {
        heading: "11. Governing law",
        blocks: [
          {
            type: "p",
            parts: [
              "These Terms are governed by the laws of ",
              { text: "India" },
              ", without regard to conflict-of-law rules. Courts in ",
              { text: "Rajasthan, India" },
              " shall have exclusive jurisdiction, subject to mandatory consumer protections in your country of residence where applicable.",
            ],
          },
        ],
      },
    ],
  },
  "privacy-policy": {
    title: "Privacy Policy",
    description:
      "How Mably collects, uses, and protects personal information when you use our website and app.",
    lastUpdated: "June 1, 2026",
    intro: [
      {
        type: "p",
        parts: [
          'This Privacy Policy explains how Mably ("we", "us") collects, uses, and protects personal information when you visit mably.io, create an account, subscribe to a plan, or use our client portal features.',
        ],
      },
    ],
    sections: [
      {
        heading: "1. Who We Are",
        blocks: [
          {
            type: "p",
            parts: [
              "Mably is operated by team at prad.dev from India. We provide software that lets freelancers and small studios run branded client portals for projects (files, updates, messaging, and related project delivery).",
            ],
          },
          {
            type: "p",
            parts: [
              "For privacy questions or requests: ",
              { text: "hello@mably.io", href: "mailto:hello@mably.io" },
            ],
          },
        ],
      },
      {
        heading: "2. What information we collect",
        blocks: [
          {
            type: "p",
            parts: [{ text: "When you visit our website (mably.io)" }],
          },
          {
            type: "ul",
            items: [
              "Name and email if you submit a form, join early access, or contact us",
              "Usage data (pages viewed, clicks, device/browser type) via analytics (e.g. PostHog)",
              "Referral/UTM data (e.g. how you found us)",
            ],
          },
          {
            type: "p",
            parts: [{ text: "When you create a Mably account and use the app (app.mably.io)" }],
          },
          {
            type: "ul",
            items: [
              "Account details: email, name, profile photo (if you add one)",
              "Authentication data handled by our auth provider",
              "Project and client data you enter (project names, client names/emails, messages, files you upload, branding settings)",
              "Billing-related data: subscription status and plan; payment is processed by our payment provider (Polar). We do not store full card numbers on our servers.",
              "Technical logs: IP address, session identifiers, and error logs needed to operate and secure the service",
            ],
          },
          {
            type: "p",
            parts: [{ text: "When your clients use a project portal" }],
          },
          {
            type: "ul",
            items: [
              "We process information needed to give them access (e.g. email for invite/sign-in, activity within that project)",
              "Clients only see projects they are invited to, subject to access controls in the product",
            ],
          },
          {
            type: "p",
            parts: [
              "We do not intentionally collect sensitive categories of data (e.g. health, government IDs) through Mably. Please do not upload them unless you have a lawful basis to do so.",
            ],
          },
        ],
      },
      {
        heading: "3. How we use your information",
        blocks: [
          {
            type: "p",
            parts: ["We use personal information to:"],
          },
          {
            type: "ul",
            items: [
              "Provide, maintain, and improve Mably",
              "Create and manage your account and projects",
              "Send service emails (e.g. sign-in codes, client invites, billing notices)",
              "Process subscriptions and prevent fraud or abuse",
              "Understand product usage and fix issues (analytics and monitoring)",
              "Comply with law and enforce our Terms",
            ],
          },
          {
            type: "p",
            parts: [
              "We may send product updates or marketing emails only where allowed and with opt-out where required. You can unsubscribe from marketing messages when we offer that option.",
            ],
          },
        ],
      },
      {
        heading: "4. How we share information",
        blocks: [
          {
            type: "p",
            parts: ["We do not sell your personal information."],
          },
          {
            type: "p",
            parts: ["We share data with service providers who help us run Mably, such as:"],
          },
          {
            type: "ul",
            items: [
              "Hosting and database (e.g. Supabase) — account and project data",
              "Payments (Polar) — subscription and checkout",
              "Analytics (e.g. PostHog) — usage events",
              "Email delivery — transactional emails (invites, auth codes)",
            ],
          },
          {
            type: "p",
            parts: [
              "These providers process data on our instructions and under their own terms and security measures.",
            ],
          },
          {
            type: "p",
            parts: [
              "We may also disclose information if required by law, to protect rights and safety, or in connection with a business transfer (e.g. acquisition), with notice where appropriate.",
            ],
          },
        ],
      },
      {
        heading: "5. Cookies and similar technologies",
        blocks: [
          {
            type: "p",
            parts: ["We use cookies and similar technologies for:"],
          },
          {
            type: "ul",
            items: [
              "Essential operation — sign-in sessions and security",
              "Analytics — understanding how the site and product are used",
            ],
          },
          {
            type: "p",
            parts: [
              "We do not use advertising cookies for third-party ad networks on Mably at this time.",
            ],
          },
          {
            type: "p",
            parts: [
              "You can limit some analytics via browser settings or extensions; essential cookies may still be required to use the app. See our ",
              { text: "Cookie Policy", href: "/legal/cookie-policy" },
              " for more detail.",
            ],
          },
        ],
      },
      {
        heading: "6. How long we keep data",
        blocks: [
          {
            type: "p",
            parts: [
              "We keep account and project data while your account is active and for a reasonable period afterward so you can export or restore work, unless you ask us to delete it sooner or we must keep it for legal reasons.",
            ],
          },
          {
            type: "p",
            parts: [
              "Backups and logs may persist for a limited time after deletion.",
            ],
          },
        ],
      },
      {
        heading: "7. Your rights",
        blocks: [
          {
            type: "p",
            parts: [
              "Depending on where you live, you may have rights to access, correct, delete, or restrict processing of your personal information, or to object to certain processing. Contact us at ",
              { text: "hello@mably.io", href: "mailto:hello@mably.io" },
              " and we will respond within a reasonable time.",
            ],
          },
          {
            type: "p",
            parts: [
              "If you are in the EU/UK or other regions with specific privacy laws, tell us your location in your request so we can apply the right process.",
            ],
          },
        ],
      },
      {
        heading: "8. Changes to this policy",
        blocks: [
          {
            type: "p",
            parts: [
              "We may update this policy from time to time. We will post the current version at ",
              { text: "mably.io/legal/privacy-policy", href: "/legal/privacy-policy" },
              ' with an updated "Last updated" date. Continued use of Mably after changes means you accept the updated policy, subject to applicable law.',
            ],
          },
        ],
      },
    ],
  },
  "refund-policy": {
    title: "Refund Policy",
    description:
      "How subscription billing, cancellations, and refunds work for Mably.",
    lastUpdated: "June 1, 2026",
    intro: [
      {
        type: "p",
        parts: [
          "This policy explains how subscription billing, cancellations, and refunds work for Mably.",
        ],
      },
    ],
    sections: [
      {
        heading: "Refund & cancellation policy",
        blocks: [
          {
            type: "p",
            parts: [
              "We want billing to feel fair and easy to understand. This policy describes how cancellations, refunds, and billing disputes work when you subscribe to ",
              { text: "Mably" },
              ".",
            ],
          },
        ],
      },
      {
        heading: "1. Who this applies to",
        blocks: [
          {
            type: "p",
            parts: [
              "This policy applies to ",
              { text: "subscription fees paid to Mably" },
              " for use of our software (for example, monthly or annual plans processed through our payment provider). It does ",
              { text: "not" },
              " govern money your clients pay you for freelance work—that stays between you and your clients outside Mably.",
            ],
          },
        ],
      },
      {
        heading: "2. Cancel anytime",
        blocks: [
          {
            type: "p",
            parts: [
              "You can ",
              { text: "cancel your subscription at any time" },
              ' from your account or billing portal (from your account Settings → Subscription or via the billing portal). When you cancel:',
            ],
          },
          {
            type: "ul",
            items: [
              "You typically keep access until the end of the period you already paid for, unless we state otherwise at checkout or in your plan terms.",
              "Your subscription will not renew after that period unless you subscribe again.",
            ],
          },
        ],
      },
      {
        heading: "3. Refunds for subscription charges",
        blocks: [
          {
            type: "p",
            parts: [
              {
                text: "General rule:",
              },
              " Subscription fees are ",
              { text: "non-refundable" },
              " except where required by law or as explicitly stated below.",
            ],
          },
          {
            type: "p",
            parts: [
              "We do not offer refunds for change of mind; see statutory rights below.",
            ],
          },
          {
            type: "p",
            parts: [
              {
                text: "Billing mistakes:",
              },
              " If you were charged ",
              { text: "incorrectly" },
              " (duplicate charge, wrong amount, or you canceled before renewal but were still charged), contact us and we'll ",
              { text: "investigate and correct" },
              " it, including a ",
              { text: "refund of the mistaken amount" },
              " where appropriate.",
            ],
          },
          {
            type: "p",
            parts: [
              {
                text: "Failed service / major outage:",
              },
              " If Mably is ",
              { text: "unavailable for an extended period" },
              " due to a fault on our side, we may offer ",
              { text: "account credit or a partial refund" },
              " for the affected period at our discretion. This does not apply to issues outside our control (your internet, third-party outages, etc.).",
            ],
          },
        ],
      },
      {
        heading: "4. Statutory rights",
        blocks: [
          {
            type: "p",
            parts: [
              "Nothing in this policy limits ",
              { text: "rights you have under applicable law" },
              " (for example, consumer cooling-off rules where they apply). If the law gives you a stronger remedy, ",
              { text: "that law applies" },
              ".",
            ],
          },
        ],
      },
      {
        heading: "5. How to request a refund or cancellation help",
        blocks: [
          {
            type: "p",
            parts: [
              "Email us at ",
              { text: "hello@mably.io", href: "mailto:hello@mably.io" },
              " with:",
            ],
          },
          {
            type: "ul",
            items: [
              "The email on your Mably account",
              "A short description of the charge (date and amount if you have it)",
              "What you're requesting (refund, cancellation confirmation, or billing correction)",
            ],
          },
          {
            type: "p",
            parts: ["We aim to reply within ", { text: "a few business days" }, "."],
          },
        ],
      },
      {
        heading: "6. Changes to this policy",
        blocks: [
          {
            type: "p",
            parts: [
              "We may update this policy as our product and billing evolve. The ",
              { text: "latest version" },
              " will always live at ",
              { text: "mably.io/legal/refund-policy", href: "/legal/refund-policy" },
              ".",
            ],
          },
        ],
      },
    ],
  },
  "cookie-policy": {
    title: "Cookie Policy",
    description:
      "How Mably uses cookies and similar technologies on mably.io and app.mably.io.",
    lastUpdated: "June 1, 2026",
    intro: [
      {
        type: "p",
        parts: [
          'This Cookie Policy explains how ',
          { text: "Mably" },
          ' ("Mably", "we", "us") uses cookies and similar technologies when you visit ',
          { text: "mably.io" },
          " (our marketing website) and ",
          { text: "app.mably.io" },
          " (our application).",
        ],
      },
      {
        type: "p",
        parts: [
          "For more detail on how we collect and use personal information, see our ",
          { text: "Privacy Policy", href: "/legal/privacy-policy" },
          ".",
        ],
      },
    ],
    sections: [
      {
        heading: "1. What are cookies?",
        blocks: [
          {
            type: "p",
            parts: [
              'Cookies are small text files stored on your device when you visit a website. We also use similar technologies such as local storage and pixels where needed for the same purposes. In this policy, we refer to all of these as "cookies."',
            ],
          },
        ],
      },
      {
        heading: "2. Why we use cookies",
        blocks: [
          {
            type: "p",
            parts: ["We use cookies to:"],
          },
          {
            type: "ul",
            items: [
              "run and secure the Service (sign-in, sessions, fraud prevention);",
              "remember settings needed for the app to work;",
              "understand how people use our website and product so we can improve Mably; and",
              "support billing and account flows where our payment provider uses cookies on their pages.",
            ],
          },
          {
            type: "p",
            parts: [
              "We ",
              { text: "do not" },
              " sell your personal information. We ",
              { text: "do not" },
              " use third-party advertising cookies to track you across other websites for targeted ads.",
            ],
          },
        ],
      },
      {
        heading: "3. Types of cookies we use",
        blocks: [
          {
            type: "h3",
            parts: [{ text: "Strictly necessary cookies" }],
          },
          {
            type: "p",
            parts: [
              "These cookies are required for Mably to function. They include, for example, cookies that keep you signed in, protect your account, and support secure access to client project portals.",
            ],
          },
          {
            type: "p",
            parts: [
              "You cannot turn these off while using the app without losing core functionality.",
            ],
          },
          {
            type: "h3",
            parts: [{ text: "Analytics cookies" }],
          },
          {
            type: "p",
            parts: [
              "We use analytics tools (such as ",
              { text: "PostHog" },
              ") to understand how visitors and signed-in users interact with our site and product—for example, which pages are viewed and which features are used. This helps us fix bugs, improve performance, and build a better experience.",
            ],
          },
          {
            type: "p",
            parts: [
              "Analytics data is used to operate and improve Mably, not to sell your data.",
            ],
          },
          {
            type: "h3",
            parts: [{ text: "Cookies on third-party pages" }],
          },
          {
            type: "p",
            parts: [
              "When you subscribe or manage billing, you may be redirected to our payment provider (",
              { text: "Polar" },
              "). Polar may set its own cookies on their checkout or customer portal pages. Those cookies are governed by Polar's policies, not this page.",
            ],
          },
          {
            type: "p",
            parts: [
              "Our marketing site may also use cookies from our website platform and analytics providers to operate the site and measure traffic.",
            ],
          },
        ],
      },
      {
        heading: "4. Who sets these cookies?",
        blocks: [
          {
            type: "p",
            parts: ["Cookies may be set by:"],
          },
          {
            type: "ul",
            items: [
              "Mably (first-party cookies for the app and site); and",
              "Service providers acting on our behalf, such as hosting and authentication (e.g. Supabase), analytics (e.g. PostHog), and payments (Polar).",
            ],
          },
          {
            type: "p",
            parts: [
              "These providers process information according to our instructions and their own privacy and security terms.",
            ],
          },
        ],
      },
      {
        heading: "5. How long cookies last",
        blocks: [
          {
            type: "ul",
            items: [
              "Session cookies expire when you close your browser.",
              "Persistent cookies remain for a set period—for example, to keep you signed in or to remember analytics preferences. This is typically from a few days up to about 12 months, depending on the purpose.",
            ],
          },
        ],
      },
      {
        heading: "6. Your choices",
        blocks: [
          {
            type: "p",
            parts: [{ text: "Browser settings" }],
          },
          {
            type: "p",
            parts: [
              "Most browsers let you block or delete cookies. If you block strictly necessary cookies, parts of Mably (including sign-in) may not work.",
            ],
          },
          {
            type: "p",
            parts: [{ text: "Analytics" }],
          },
          {
            type: "p",
            parts: [
              "You can limit some analytics through browser settings, privacy extensions, or device settings where available. Essential cookies may still be required to use the app.",
            ],
          },
          {
            type: "p",
            parts: [{ text: "Marketing emails" }],
          },
          {
            type: "p",
            parts: [
              "Cookie choices are separate from marketing email preferences. Contact us using the details below if you have questions about your personal data.",
            ],
          },
        ],
      },
      {
        heading: "7. Updates to this policy",
        blocks: [
          {
            type: "p",
            parts: [
              "We may update this Cookie Policy from time to time. The current version will always be available at:",
            ],
          },
          {
            type: "p",
            parts: [
              { text: "mably.io/legal/cookie-policy", href: "/legal/cookie-policy" },
            ],
          },
          {
            type: "p",
            parts: [
              'We will update the "Last updated" date when we make changes. Continued use of Mably after changes means you accept the updated policy, subject to applicable law.',
            ],
          },
        ],
      },
      {
        heading: "8. Contact us",
        blocks: [
          {
            type: "p",
            parts: [
              "Questions about this Cookie Policy or our use of cookies:",
            ],
          },
          {
            type: "p",
            parts: [
              { text: "Email:" },
              " ",
              { text: "hello@mably.io", href: "mailto:hello@mably.io" },
            ],
          },
          {
            type: "p",
            parts: [
              { text: "Mably — client portals for freelancers and small studios." },
            ],
          },
        ],
      },
    ],
  },
};

export const LEGAL_SLUGS = Object.keys(LEGAL_PAGES);

export const LEGAL_NAV = [
  { slug: "terms-conditions", label: "Terms & Conditions" },
  { slug: "privacy-policy", label: "Privacy Policy" },
  { slug: "refund-policy", label: "Refund Policy" },
  { slug: "cookie-policy", label: "Cookie Policy" },
];

/** @param {string} slug */
export function getLegalPage(slug) {
  return LEGAL_PAGES[slug] ?? null;
}
