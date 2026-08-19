/**
 * Mably blog posts — content-as-data.
 * Each post has a `slug`, metadata, and a `content` array of typed blocks
 * rendered by the BlogPostBody component.
 *
 * Block types:
 *   { type: "p",       text: string }
 *   { type: "h2",      text: string }
 *   { type: "h3",      text: string }
 *   { type: "ul",      items: string[] }
 *   { type: "ol",      items: string[] }
 *   { type: "callout", text: string }        — highlighted tip / key takeaway box
 *   { type: "cta",     headline: string, sub: string, cta: string }  — inline conversion nudge
 *   { type: "faq",     items: { q: string; a: string }[] }
 *
 * Each post also has `related: string[]` — an array of slugs for the "Read next" section.
 */

export const BLOG_POSTS = [
  {
    slug: "client-portal-for-freelancers",
    title: "Client Portal for Freelancers: Why You Need One (and How to Set It Up)",
    description:
      "Still sending files over email and chasing approvals in WhatsApp threads? Here's why a dedicated client portal changes everything — and how freelancers can set one up in minutes.",
    category: "Guides",
    publishedAt: "2026-08-19",
    readingTime: "8 min read",
    coverImage: "/images/blog/Client Portal for Freelancers Why You Need One (and How to Set It Up).webp",
    related: [
      "freelance-client-onboarding-process",
      "how-to-manage-freelance-clients",
      "best-tools-for-freelancers",
    ],
    author: {
      name: "Mably Team",
      avatar: null,
    },
    content: [
      {
        type: "p",
        text: "You just delivered the first round of designs. The client replies: \u201cLooks great! I\u2019ll pass it to my team.\u201d Two days later, you get three separate emails \u2014 from three different people \u2014 each with contradictory feedback, two of which have attached an old version of the brief.",
      },
      {
        type: "p",
        text: "Sound familiar? This is the default workflow for most freelancers. And it's not your fault — it's what happens when client collaboration is spread across email, WhatsApp, Dropbox, Google Drive, and three different chat threads.",
      },
      {
        type: "p",
        text: "A client portal fixes this. Not by adding another tool to the pile — but by replacing all of that with one branded link you share with every client.",
      },

      {
        type: "h2",
        text: "What Is a Client Portal?",
      },
      {
        type: "p",
        text: "A client portal is a private, shared workspace between you and your client. Instead of your project living across scattered platforms, everything — files, feedback, revisions, approvals, and communication — lives in one place.",
      },
      {
        type: "p",
        text: "Your client gets a single link (usually branded with your business name). They click it, see their project, leave feedback, approve deliverables, and download final files. No login required on their end. No learning curve.",
      },
      {
        type: "p",
        text: "You get one organized view per project. No inbox archaeology to find that approval from three weeks ago.",
      },

      {
        type: "h2",
        text: "Why Email + WhatsApp Doesn't Scale",
      },
      {
        type: "p",
        text: "Email and messaging apps are general-purpose tools. They weren't built for creative project delivery. Here's what that costs you:",
      },
      {
        type: "ul",
        items: [
          "Feedback gets buried in long threads — you lose track of what's been addressed",
          "Files get overwritten or sent multiple times with confusing names (final_v3_ACTUAL_FINAL.pdf)",
          "Approvals are verbal or implied — never documented",
          "Clients loop in new stakeholders mid-project with no context",
          "You spend 20–40 minutes every week just organizing project-related messages",
        ],
      },
      {
        type: "p",
        text: "For a freelancer with one or two clients, this is manageable. But when you're juggling four or five projects, the overhead compounds fast.",
      },

      {
        type: "h2",
        text: "What a Good Client Portal Does for Freelancers",
      },
      {
        type: "h3",
        text: "1. Centralizes all project files",
      },
      {
        type: "p",
        text: "Upload deliverables, reference files, and assets to the portal. Your client always sees the latest version — and can download finals without emailing you for a re-send.",
      },
      {
        type: "h3",
        text: "2. Collects structured feedback",
      },
      {
        type: "p",
        text: "Instead of \u201cI showed it to my team and they had some thoughts,\u201d clients leave specific, trackable comments tied to specific deliverables. You know exactly what needs to change and who asked for it.",
      },
      {
        type: "h3",
        text: "3. Captures formal approvals",
      },
      {
        type: "p",
        text: "When a client clicks Approve on a deliverable, it's logged with a timestamp. This protects you when scope creep happens — and it happens to every freelancer eventually.",
      },
      {
        type: "h3",
        text: "4. Gives you a professional image",
      },
      {
        type: "p",
        text: "A branded portal signals that you're an established professional, not someone cobbling together free tools. Clients who see a polished handoff experience refer more often and push back on pricing less.",
      },
      {
        type: "h3",
        text: "5. Reduces back-and-forth",
      },
      {
        type: "p",
        text: "When clients can see project status, access files, and leave feedback on their own time, your inbox quiets down significantly. Less \u201cCan you resend that?\u201d and \u201cWhere are we on the timeline?\u201d",
      },

      {
        type: "callout",
        text: "Freelancers who use a dedicated client portal report spending 30–60% less time on project admin — time that goes back into billable work or simply a better work-life balance.",
      },

      {
        type: "h2",
        text: "What to Look for in a Freelancer Client Portal",
      },
      {
        type: "p",
        text: "Not all client portals are built with freelancers in mind. Some are enterprise project management tools with a portal tacked on. Others require your client to create an account — which kills adoption immediately.",
      },
      {
        type: "p",
        text: "Here's what actually matters for freelancers:",
      },
      {
        type: "ul",
        items: [
          "No-login client access — your client clicks a link, not a signup form",
          "Custom branding — your logo, your colors, your domain (not the tool's)",
          "File sharing + approvals — deliverables and sign-off in one place",
          "Feedback collection — structured comments, not another email thread",
          "Simple setup — you should be live in under 10 minutes",
          "Affordable — most freelancers don't need enterprise pricing",
        ],
      },

      {
        type: "h2",
        text: "How to Set Up a Client Portal with Mably",
      },
      {
        type: "p",
        text: "**[Mably](https://www.mably.io)** is a client portal built specifically for freelancers. Here\u2019s how to go from zero to live in about five minutes:",
      },
      {
        type: "ol",
        items: [
          "Create a free account at **[mably.io](https://www.mably.io)** \u2014 no credit card required to start",
          "Set up your workspace: add your name or business name, logo, and brand color",
          "Create a new project and give it a name (e.g. \u201cWebsite Redesign \u2014 Acme Co.\u201d)",
          "Upload your first deliverable or create a file section",
          "Copy your portal link and send it to your client",
        ],
      },
      {
        type: "p",
        text: "Your client gets a clean, branded link with their project. They can view files, leave feedback, and approve deliverables without creating any kind of account.",
      },
      {
        type: "p",
        text: "On your end, you see everything: what's been viewed, what's been approved, and what still needs a response.",
      },
      {
        type: "cta",
        headline: "Set up your first client portal in 5 minutes",
        sub: "Mably gives every freelancer a branded workspace for files, feedback, and approvals — from $2.25/mo during early pricing.",
        cta: "Get started free",
      },

      {
        type: "h2",
        text: "Who Benefits Most from a Client Portal?",
      },
      {
        type: "p",
        text: "Any freelancer who delivers work to external clients will benefit. But the impact is especially clear for:",
      },
      {
        type: "ul",
        items: [
          "Designers — managing revisions, version control, and approval sign-off",
          "Web designers — sharing mockups and staging links before build begins",
          "Video editors — collecting feedback on cuts without cluttered email chains",
          "Photographers — sending galleries and tracking selects",
          "Consultants — handing off strategy docs and reports professionally",
          "Agencies — running a branded portal for each client engagement",
        ],
      },

      {
        type: "h2",
        text: "Frequently Asked Questions",
      },
      {
        type: "faq",
        items: [
          {
            q: "Do my clients need to create an account to use a client portal?",
            a: "With Mably, no. Clients access their portal via a single link — no signup, no password, no friction. They click the link and see their project immediately.",
          },
          {
            q: "How is a client portal different from Google Drive or Dropbox?",
            a: "Google Drive and Dropbox are file storage tools. A client portal is built for project delivery — it includes structured feedback, approval tracking, project status, and a branded experience. It's the difference between a folder and a workspace.",
          },
          {
            q: "Can I use a client portal for multiple clients at once?",
            a: "Yes. With Mably you create a separate project (and portal link) for each client. Each client only sees their own project — never another client's work.",
          },
          {
            q: "How much does a client portal cost?",
            a: "Mably starts at $9/month and includes everything a freelancer needs to run professional client projects. There's no per-seat fee for clients.",
          },
          {
            q: "What happens when a project is finished?",
            a: "You can archive the project in Mably. Clients retain access to download final files for as long as you keep the portal active — no rushed last-minute file dumps.",
          },
        ],
      },

      {
        type: "h2",
        text: "The Bottom Line",
      },
      {
        type: "p",
        text: "A client portal isn't a luxury for established agencies. It's one of the highest-leverage tools a freelancer can adopt — because it doesn't just make you look more professional, it removes the actual friction that slows projects down.",
      },
      {
        type: "p",
        text: "Less back-and-forth. Fewer misunderstandings. Faster approvals. More repeat business.",
      },
      {
        type: "p",
        text: "If you've been running client projects over email and want to level up in the next 10 minutes, Mably is the fastest way to start.",
      },
    ],
  },

  // ─────────────────────────────────────────────
  // POST 2
  // ─────────────────────────────────────────────
  {
    slug: "how-to-get-clients-as-a-freelancer",
    title: "How to Get Clients as a Freelancer: 9 Strategies That Actually Work",
    description:
      "Finding freelance clients is a skill you can learn. Here are 9 proven strategies — from cold outreach to referral systems — that bring in consistent, well-paying work.",
    category: "Guides",
    publishedAt: "2026-08-19",
    readingTime: "9 min read",
    coverImage: "/images/blog/How to Get Clients as a Freelancer 9 Strategies That Actually Work.webp",
    related: [
      "client-portal-for-freelancers",
      "freelance-client-onboarding-process",
      "how-to-manage-freelance-clients",
    ],
    author: {
      name: "Mably Team",
      avatar: null,
    },
    content: [
      {
        type: "p",
        text: "Every freelancer hits the same wall: you\u2019re good at the work, but finding clients who pay well and respect your process feels like a second full-time job. The difference between freelancers who thrive and those who stay stuck is almost always the same thing \u2014 a system for bringing in clients, rather than hoping they find you.",
      },
      {
        type: "p",
        text: "Here are nine strategies that actually work in 2026, ordered roughly by how fast they produce results.",
      },
      {
        type: "h2",
        text: "1. Ask your existing clients for referrals",
      },
      {
        type: "p",
        text: "Referrals convert at 3\u20135x the rate of cold leads because there\u2019s built-in trust. The problem is most freelancers wait for referrals to happen organically instead of asking directly.",
      },
      {
        type: "p",
        text: "After every successful project, send a short message: \u201cI\u2019m opening up a couple of slots next month. If you know anyone who could use [what you do], I\u2019d love an introduction.\u201d That\u2019s it. Most happy clients are glad to help \u2014 they just needed the nudge.",
      },
      {
        type: "h2",
        text: "2. Optimize your LinkedIn profile for inbound",
      },
      {
        type: "p",
        text: "LinkedIn is the highest-converting platform for B2B freelancers. But most profiles read like a resume, not a sales page.",
      },
      {
        type: "p",
        text: "Your headline should say exactly who you help and what outcome you deliver. Not \u201cFreelance Designer\u201d \u2014 but \u201cI design SaaS landing pages that convert for early-stage startups.\u201d Your About section should address the client\u2019s pain, not your career journey.",
      },
      {
        type: "h2",
        text: "3. Publish one piece of content per week",
      },
      {
        type: "p",
        text: "You don\u2019t need a blog or a newsletter to start (though both help long-term). Even one LinkedIn post or tweet per week on your area of expertise builds visibility over time. Clients hire people they\u2019ve seen think out loud in their domain. It builds trust before a conversation even starts.",
      },
      {
        type: "h2",
        text: "4. Cold outreach to your ideal client profile",
      },
      {
        type: "p",
        text: "Cold outreach has a bad reputation because most people do it badly. The key is specificity. Find 20 businesses that look exactly like your best clients and send each a short, personalized note (3\u20134 sentences) that references something specific about them and names one concrete way you could help.",
      },
      {
        type: "p",
        text: "Response rates of 10\u201320% are achievable when the message is specific and offers genuine value. The goal isn\u2019t to close in the first message \u2014 it\u2019s to start a conversation.",
      },
      {
        type: "h2",
        text: "5. List yourself on freelance marketplaces \u2014 strategically",
      },
      {
        type: "p",
        text: "Platforms like **[Toptal](https://www.toptal.com)**, **[Contra](https://contra.com)**, **[Dribbble](https://dribbble.com)**, and **[Behance](https://www.behance.net)** can drive inbound leads, but you need to treat your profile as a landing page. One niche, clear positioning, strong case studies with results (not just visuals). Broad generalist profiles get ignored. Specific specialist profiles get bookmarked.",
      },
      {
        type: "h2",
        text: "6. Partner with adjacent freelancers",
      },
      {
        type: "p",
        text: "If you\u2019re a copywriter, befriend a designer. If you\u2019re a web designer, know a developer. These cross-referral relationships are incredibly powerful because neither of you is competing for the same work \u2014 you\u2019re solving different parts of the same client\u2019s problem.",
      },
      {
        type: "h2",
        text: "7. Follow up with every lead, always",
      },
      {
        type: "p",
        text: "Most freelancers send a proposal and never follow up if they don\u2019t hear back. The reality is most client decisions are delayed by internal things that have nothing to do with you. A single follow-up email one week later \u2014 \u201cJust checking in on this \u2014 still happy to chat if timing is right\u201d \u2014 closes a surprising number of opportunities.",
      },
      {
        type: "h2",
        text: "8. Make your client experience remarkable",
      },
      {
        type: "p",
        text: "The best client acquisition strategy is a great client experience \u2014 because it generates referrals and repeat business automatically. Every client who gets a confusing, disorganized experience will not refer you. Every client who gets a polished, professional experience \u2014 a branded portal, clear communication, easy approvals \u2014 will talk about you to their network.",
      },
      {
        type: "callout",
        text: "A professional client portal (like **[Mably](https://www.mably.io)**) is one of the highest-leverage things a freelancer can add \u2014 not just for doing better work, but for getting more work through referrals and word of mouth.",
      },
      {
        type: "cta",
        headline: "Give clients an experience worth talking about",
        sub: "Mably is a branded client portal for files, feedback, and approvals. Takes 5 minutes to set up. Early pricing from $2.25/mo.",
        cta: "Try Mably free",
      },

      {
        type: "h2",
        text: "9. Show your process, not just your outcomes",
      },
      {
        type: "p",
        text: "Most freelancers show a portfolio of finished work. The ones who stand out show their thinking \u2014 the brief, the problem they were solving, the decisions they made along the way. Clients aren\u2019t just buying a deliverable; they\u2019re betting on a process. Show them yours.",
      },
      {
        type: "h2",
        text: "Frequently Asked Questions",
      },
      {
        type: "faq",
        items: [
          {
            q: "How do I get my first freelance client with no experience?",
            a: "Start with your immediate network. Tell everyone you know what you\u2019re doing. Offer a discounted or free first project to a small business in exchange for a testimonial and case study. Use that social proof to build from.",
          },
          {
            q: "Should I be on multiple freelance platforms at once?",
            a: "Focus on one or two to start. It\u2019s better to have an excellent profile on two platforms than a mediocre presence across six. Once you\u2019ve optimized and are getting leads, you can expand.",
          },
          {
            q: "How often should I do cold outreach?",
            a: "Consistency beats volume. 10 highly personalized messages per week beats 100 generic ones. Set aside a few hours per week and treat it like a pipeline, not a one-time sprint.",
          },
          {
            q: "What should I charge as a new freelancer?",
            a: "Research market rates for your skill in your region, then start at the lower end of mid-range \u2014 not the bottom. Charging too low attracts difficult clients and signals low quality. You can raise rates as you build a portfolio.",
          },
        ],
      },
      {
        type: "h2",
        text: "The Bottom Line",
      },
      {
        type: "p",
        text: "There\u2019s no single magic channel for freelance clients. The freelancers who build consistent pipelines combine a few of these strategies and do them consistently. Pick two or three that fit your personality and work style, and commit to them for 90 days. That\u2019s enough time to see real results.",
      },
    ],
  },

  // ─────────────────────────────────────────────
  // POST 3
  // ─────────────────────────────────────────────
  {
    slug: "how-to-manage-freelance-clients",
    title: "How to Manage Freelance Clients: A No-Nonsense Guide",
    description:
      "Scope creep, slow approvals, and MIA clients derail more freelance projects than bad design ever will. Here's the practical system that keeps every project on track.",
    category: "Guides",
    publishedAt: "2026-08-19",
    readingTime: "8 min read",
    coverImage: "/images/blog/How to Manage Freelance Clients A No-Nonsense Guide.webp",
    related: [
      "client-portal-for-freelancers",
      "freelance-client-onboarding-process",
      "best-tools-for-freelancers",
    ],
    author: {
      name: "Mably Team",
      avatar: null,
    },
    content: [
      {
        type: "p",
        text: "The technical part of freelancing \u2014 the design, the writing, the code \u2014 is usually not what kills a project. What kills projects is the client management around it: unclear expectations, feedback that arrives in waves from five different people, approvals that never happen, and scope that quietly doubles.",
      },
      {
        type: "p",
        text: "Good client management is learnable. Here\u2019s the system that solves most of it.",
      },
      {
        type: "h2",
        text: "Set expectations before work begins, not after",
      },
      {
        type: "p",
        text: "Most client management problems are onboarding problems. Before you start any project, make sure both sides agree on: what\u2019s being delivered, what\u2019s not included, how revisions work, how feedback should be given, what the timeline looks like, and what a final approval means.",
      },
      {
        type: "p",
        text: "This doesn\u2019t require a 10-page contract (though a written agreement helps). It just requires one aligned conversation and a written summary of what you agreed.",
      },
      {
        type: "h2",
        text: "Create a single source of truth for every project",
      },
      {
        type: "p",
        text: "When files live in email, feedback lives in WhatsApp, and approvals happen verbally, you don\u2019t have a project \u2014 you have a mess. Every project should have one place where everything lives.",
      },
      {
        type: "p",
        text: "This is what a client portal like Mably solves. One link per project. Files, feedback, approvals, and communication all in one place. Your client doesn\u2019t have to hunt for anything, and neither do you.",
      },
      {
        type: "cta",
        headline: "One link. Every project. Zero inbox chaos.",
        sub: "Mably gives freelancers a branded client portal that replaces scattered email threads. From $2.25/mo during early pricing.",
        cta: "Get started free",
      },

      {
        type: "h2",
        text: "Handle scope creep immediately, not politely later",
      },
      {
        type: "p",
        text: "Scope creep is when a client adds to the project after the brief is agreed. The first request is usually small. The second is bigger. By the time you\u2019ve absorbed five \u201csmall\u201d additions, you\u2019ve done 40% more work for the same fee.",
      },
      {
        type: "p",
        text: "The fix is simple but requires nerve: acknowledge the request, note that it\u2019s outside the original scope, and give a price for adding it. Most clients accept this without drama. Those who don\u2019t are signaling how the rest of the project will go.",
      },
      {
        type: "callout",
        text: "Script: \u201cHappy to add that \u2014 it\u2019s a bit outside our original scope, so I\u2019d quote it as a $X add-on. Want me to include it?\u201d Clean, professional, and the client decides.",
      },
      {
        type: "h2",
        text: "Centralize feedback and make it specific",
      },
      {
        type: "p",
        text: "Vague feedback is one of the biggest time sinks in freelancing. \u201cIt doesn\u2019t feel right\u201d gives you nothing to work with. \u201cThe headline font feels too formal \u2014 can we try something warmer?\u201d gives you everything.",
      },
      {
        type: "p",
        text: "When you send a deliverable, ask specific questions alongside it: \u201cDoes the tone match your brand? Is the structure what you had in mind?\u201d Guided questions produce useful answers. Open-ended prompts produce stream of consciousness.",
      },
      {
        type: "h2",
        text: "Define what \u2018approved\u2019 actually means",
      },
      {
        type: "p",
        text: "Verbal approvals evaporate. \u201cYeah looks good\u201d in a WhatsApp chat is not an approval \u2014 it\u2019s a statement of mood in that moment. Three weeks later when the client has second thoughts, you have no record of it.",
      },
      {
        type: "p",
        text: "Get written approvals for every milestone. A client portal with a formal approve button solves this automatically \u2014 each approval is timestamped and attributed to the person who clicked it.",
      },
      {
        type: "h2",
        text: "Communicate proactively, not reactively",
      },
      {
        type: "p",
        text: "The clients who send the most anxious check-in messages are the ones who aren\u2019t hearing from you. A 2-sentence weekly update \u2014 \u201cWorking on the second section now, on track for Thursday\u201d \u2014 prevents the need for the client to ask.",
      },
      {
        type: "p",
        text: "Silence is interpreted as problems. Short, consistent updates build trust and keep clients calm.",
      },
      {
        type: "h2",
        text: "Know how to handle a difficult client",
      },
      {
        type: "p",
        text: "Some clients will cross lines regardless of your process. Moving goalposts, disrespectful communication, endless revisions beyond what was agreed. When this happens, you have three options: reset expectations explicitly, renegotiate terms, or exit the project. Sometimes the right call is to finish the project professionally and not take their business again.",
      },
      {
        type: "h2",
        text: "Frequently Asked Questions",
      },
      {
        type: "faq",
        items: [
          {
            q: "How many revisions should I offer freelance clients?",
            a: "Two to three rounds is standard for most creative work. Define this in your contract or proposal \u2014 \u201cthis project includes up to two revision rounds; additional rounds are billed at $X/hour.\u201d",
          },
          {
            q: "What\u2019s the best way to get slow clients to give feedback?",
            a: "Set a review deadline when you send deliverables (\u201cI\u2019ll take no feedback by [date] as approval to proceed\u201d). This creates urgency without confrontation. Also reduce friction: a portal where they click directly on a deliverable to leave feedback gets faster responses than an email attachment.",
          },
          {
            q: "How do I handle a client who keeps changing their mind?",
            a: "Scope it as a change request. Once you\u2019ve applied the framework of \u201cthis is outside original scope,\u201d most clients self-regulate. The ones who don\u2019t reveal that the brief was never stable \u2014 a deeper conversation about goals is needed.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // POST 4
  // ─────────────────────────────────────────────
  {
    slug: "freelance-client-onboarding-process",
    title: "The Freelance Client Onboarding Process That Sets Every Project Up for Success",
    coverImage: "/images/blog/The Freelance Client Onboarding Process That Sets Every Project Up for Success.webp",
    related: [
      "client-portal-for-freelancers",
      "how-to-manage-freelance-clients",
      "how-to-get-clients-as-a-freelancer",
    ],
    description:
      "A smooth onboarding process makes clients feel confident, reduces back-and-forth, and prevents 90% of scope creep. Here\u2019s the exact framework to steal.",
    category: "Guides",
    publishedAt: "2026-08-19",
    readingTime: "7 min read",
    author: {
      name: "Mably Team",
      avatar: null,
    },
    content: [
      {
        type: "p",
        text: "The first week of a client relationship sets the tone for everything that follows. If it\u2019s disorganized and unclear, the client\u2019s anxiety will compound as the project goes on. If it\u2019s confident and structured, they\u2019ll trust you to lead \u2014 which makes the rest of the project dramatically easier.",
      },
      {
        type: "p",
        text: "Here\u2019s the client onboarding framework that works for freelancers across every discipline.",
      },
      {
        type: "h2",
        text: "Step 1: Send a welcome message immediately after signing",
      },
      {
        type: "p",
        text: "The moment a client signs or pays their deposit, send a short, warm welcome email. Confirm what you\u2019re building together, outline the next steps, and give them a timeline for when they\u2019ll hear from you next.",
      },
      {
        type: "p",
        text: "This one message eliminates the new-client anxiety spike that happens right after they commit. They\u2019ve just spent money \u2014 tell them immediately that they made the right call.",
      },
      {
        type: "h2",
        text: "Step 2: Send a focused onboarding questionnaire",
      },
      {
        type: "p",
        text: "Before you can do great work, you need the right information. A structured questionnaire is far more effective than a discovery call for most projects \u2014 clients think more carefully when they write, and you have the answers in writing to reference later.",
      },
      {
        type: "p",
        text: "Keep it focused. 5\u20138 questions maximum. Ask about goals, audience, tone, examples they love, constraints, and the one thing that would make this project a failure in their eyes.",
      },
      {
        type: "h2",
        text: "Step 3: Set up their project portal",
      },
      {
        type: "p",
        text: "Give your client a single place for the whole project before work begins. This means: uploading any reference materials or existing assets they\u2019ve sent, creating the project structure (deliverables, milestones), and sharing the portal link with a short note explaining what it is and how they\u2019ll use it.",
      },
      {
        type: "p",
        text: "When a client clicks their portal link and sees an organized project already set up for them, it builds immediate confidence. This is the moment they realize they hired a professional.",
      },
      {
        type: "callout",
        text: "**[Mably](https://www.mably.io)** lets you set up a branded client portal in under 5 minutes. Your client gets one link \u2014 no account required \u2014 that becomes the home for the entire project.",
      },
      {
        type: "h2",
        text: "Step 4: Align on communication norms",
      },
      {
        type: "p",
        text: "Tell your client explicitly how you communicate: where you receive feedback (in the portal, not WhatsApp), how fast you typically respond to messages, and what hours you\u2019re reachable. This sounds formal but clients appreciate it \u2014 it removes their uncertainty about whether they\u2019re bothering you.",
      },
      {
        type: "h2",
        text: "Step 5: Confirm the scope and timeline in writing",
      },
      {
        type: "p",
        text: "Send a written project summary before work starts. It doesn\u2019t need to be a legal contract \u2014 a clear email or a shared doc works. Cover: what\u2019s included, what\u2019s explicitly not included, number of revision rounds, key milestone dates, and what a final sign-off looks like.",
      },
      {
        type: "p",
        text: "Ask the client to reply confirming they\u2019ve read it. That single reply creates accountability on both sides.",
      },
      {
        type: "h2",
        text: "Step 6: Deliver a small quick win early",
      },
      {
        type: "p",
        text: "If the project has a long timeline, find something small you can deliver in the first few days \u2014 a mood board, a rough structure, a short strategy doc. This proves momentum and reinforces their decision to hire you. It also opens the feedback loop early, while there\u2019s still time to course-correct.",
      },
      {
        type: "h2",
        text: "What a great onboarding checklist looks like",
      },
      {
        type: "ol",
        items: [
          "Send welcome email within 1 hour of signing",
          "Share onboarding questionnaire within 24 hours",
          "Review questionnaire responses before kickoff call",
          "Set up project portal with initial structure",
          "Share portal link with short orientation note",
          "Confirm scope, timeline, and revision terms in writing",
          "Deliver first progress update or early deliverable",
        ],
      },
      {
        type: "h2",
        text: "Frequently Asked Questions",
      },
      {
        type: "faq",
        items: [
          {
            q: "How long should a freelance client onboarding take?",
            a: "The onboarding process itself should take 2\u20133 days max. You want to be in execution mode quickly. A bloated onboarding that drags on for two weeks loses client momentum and enthusiasm.",
          },
          {
            q: "Should I have a kickoff call or can I onboard async?",
            a: "Depends on project complexity. For smaller projects, async onboarding (questionnaire + written scope) is often faster and better documented than a call. For larger projects, a 30-minute kickoff call is worth it for rapport and alignment \u2014 just follow it up with a written summary.",
          },
          {
            q: "Do I need a formal contract for every freelance project?",
            a: "A written agreement of some kind, yes. It doesn\u2019t need to be a solicitor-drafted document. A clear email confirming scope, price, timeline, and revision terms is legally significant in most jurisdictions and practically very effective.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // POST 5
  // ─────────────────────────────────────────────
  {
    slug: "best-tools-for-freelancers",
    title: "The Best Tools for Freelancers in 2026 (By Category)",
    coverImage: "/images/blog/The Best Tools for Freelancers in 2026 (By Category).webp",
    related: [
      "client-portal-for-freelancers",
      "freelance-client-onboarding-process",
      "how-to-manage-freelance-clients",
    ],
    description:
      "From client management to invoicing to project delivery, here\u2019s the freelance tech stack that actually makes you more productive \u2014 without turning into a full-time tool-manager.",
    category: "Resources",
    publishedAt: "2026-08-19",
    readingTime: "9 min read",
    author: {
      name: "Mably Team",
      avatar: null,
    },
    content: [
      {
        type: "p",
        text: "The freelance tool market has exploded. There are now hundreds of apps competing for your workflow, most of them solving 80% of the same problems. This guide cuts through it: here\u2019s what actually matters, by category, and why.",
      },
      {
        type: "h2",
        text: "Client Portal & Project Delivery",
      },
      {
        type: "p",
        text: "This is the most important category and the most commonly overlooked. A client portal is the workspace you share with each client \u2014 files, feedback, approvals, communication, all in one branded link.",
      },
      {
        type: "p",
        text: "Without a dedicated portal, your projects live across email threads, Dropbox folders, WhatsApp, and Notion docs that your client never checks. The result: constant \u201cCan you resend that?\u201d messages and informal approvals that evaporate.",
      },
      {
        type: "ul",
        items: [
          "**[Mably](https://www.mably.io)** \u2014 purpose-built for freelancers. One branded portal per project. Client accesses via link (no login). Covers files, feedback, approvals, and chat. From $9/month.",
          "**[HoneyBook](https://www.honeybook.com)** \u2014 more all-in-one (contracts, invoices, CRM) but heavier and more expensive. Better for agencies or studios with complex workflows.",
          "**[Notion](https://www.notion.so)** \u2014 highly flexible but requires setup and your client has to navigate a Notion workspace, which feels generic.",
        ],
      },
      {
        type: "h2",
        text: "Contracts & Proposals",
      },
      {
        type: "p",
        text: "You need a way to send professional proposals and get contracts signed quickly. The faster a client can sign, the faster you start (and get paid).",
      },
      {
        type: "ul",
        items: [
          "**[Bonsai](https://www.hellobonsai.com)** \u2014 freelancer-specific contracts, proposals, and e-signing. Templates are well-written and legally sound for most freelance contexts.",
          "**[DocuSign](https://www.docusign.com)** \u2014 the industry standard for e-signatures. No proposal features, but universally accepted.",
          "**[AND CO](https://www.and.co)** \u2014 free tier available. Good for simple contracts and basic invoicing.",
        ],
      },
      {
        type: "h2",
        text: "Invoicing & Payments",
      },
      {
        type: "p",
        text: "Getting paid on time is partly a systems problem. An invoicing tool that sends automatic reminders removes the awkward \u201cjust following up on payment\u201d emails.",
      },
      {
        type: "ul",
        items: [
          "**[Wave](https://www.waveapps.com)** \u2014 completely free invoicing with credit card and bank transfer payments. Best for early-stage freelancers.",
          "**[Stripe](https://www.stripe.com)** \u2014 the most powerful payment infrastructure. Requires slightly more setup but gives you full control over payment flows.",
          "**[FreshBooks](https://www.freshbooks.com)** \u2014 great for time tracking + invoicing combined. Good if you bill by the hour.",
        ],
      },
      {
        type: "h2",
        text: "Time Tracking",
      },
      {
        type: "p",
        text: "Even if you don\u2019t bill hourly, tracking time gives you real data on your effective hourly rate \u2014 which is how you price future projects correctly.",
      },
      {
        type: "ul",
        items: [
          "**[Toggl Track](https://toggl.com/track)** \u2014 the simplest time tracker. One click to start, organized by project and client.",
          "**[Harvest](https://www.getharvest.com)** \u2014 time tracking with invoicing integration. Good if you bill hourly to clients.",
          "**[Clockify](https://clockify.me)** \u2014 generous free tier. Good for freelancers who just want the data without cost.",
        ],
      },
      {
        type: "h2",
        text: "Communication",
      },
      {
        type: "p",
        text: "The goal with client communication tools is to keep it structured and async. Real-time chat is fine, but \u201calways-on\u201d expectations destroy deep work.",
      },
      {
        type: "ul",
        items: [
          "**[Mably](https://www.mably.io)** \u2014 keeps client conversations in context, not buried in general email.",
          "**[Loom](https://www.loom.com)** \u2014 async video messaging. Game-changing for walkthroughs and presenting work without a call.",
          "**[Cal.com](https://cal.com)** or **[Calendly](https://calendly.com)** \u2014 for scheduling calls without the back-and-forth. Share a link, client picks a time.",
        ],
      },
      {
        type: "h2",
        text: "File Storage & Organization",
      },
      {
        type: "ul",
        items: [
          "**[Google Drive](https://drive.google.com)** \u2014 free and universal. Fine for internal file storage; less good as a client-facing delivery tool.",
          "**[Dropbox](https://www.dropbox.com)** \u2014 better for large files (video, high-res images). Dropbox Transfer is useful for one-time delivery.",
          "**[Figma](https://www.figma.com)** \u2014 if you\u2019re a designer, Figma is your source of truth. Pair with a client portal for feedback and approvals.",
        ],
      },
      {
        type: "callout",
        text: "The best freelance stack is the smallest one that covers all your needs. Start with: a client portal, an invoicing tool, and a contract solution. Everything else can wait until you have a real problem that needs solving.",
      },
      {
        type: "h2",
        text: "Frequently Asked Questions",
      },
      {
        type: "faq",
        items: [
          {
            q: "What tools do most successful freelancers use?",
            a: "There\u2019s no single answer, but most established freelancers use: a client portal for project delivery, an invoicing tool, and some form of contract solution. The specific brands vary, but those three categories are nearly universal.",
          },
          {
            q: "Do I need all-in-one freelance software or separate tools?",
            a: "All-in-one tools (HoneyBook, Dubsado) are convenient but can feel bloated if you don\u2019t use every feature. Separate best-in-class tools often outperform all-in-ones in each category. The right answer depends on how much you value simplicity vs. optimization.",
          },
          {
            q: "What\u2019s the most important tool for a new freelancer?",
            a: "A client portal. It\u2019s the biggest upgrade in professionalism for the smallest investment \u2014 and it directly affects whether clients refer you.",
          },
        ],
      },
    ],
  },
];

/** Find a post by slug. Returns undefined if not found. */
export function getBlogPost(slug) {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

/** All published posts sorted newest first. */
export function getAllBlogPosts() {
  return [...BLOG_POSTS].sort(
    (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
  );
}

/** Format "2026-08-19" → "August 19, 2026" */
export function formatBlogDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
