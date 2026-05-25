import "./embed.css";

/**
 * Embed pages: standalone, transparent, no auth, no shell.
 * Designed to be loaded inside an iframe on third-party sites (Framer, etc.).
 *
 * The root <body> in the app layout has `bg-background` from globals.css.
 * To make the iframe truly transparent we (a) tag <html> with `mably-embed`
 * for the CSS in `./embed.css`, (b) emit a universal inline <style> as a
 * cascade backstop, and (c) the wrapper itself is `bg-transparent`.
 */
export const metadata = {
  robots: { index: false, follow: false },
};

export default function EmbedLayout({ children }) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html:
            "html,body{background:transparent !important;background-color:transparent !important;color-scheme:dark}",
        }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.classList.add("mably-embed");`,
        }}
      />
      <div className="m-0 min-h-screen w-full bg-transparent">{children}</div>
    </>
  );
}
