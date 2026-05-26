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
            // Popup mode: body matches the card colour so any iframe area
            // not covered by content still reads as the card.
            // Inline mode: body stays transparent so the host page (Framer)
            // shows through any space around the widget.
            "html,body{background:#050508 !important;background-color:#050508 !important;color-scheme:dark}" +
            "html.mably-embed-inline,html.mably-embed-inline body{background:transparent !important;background-color:transparent !important}",
        }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html:
            "document.documentElement.classList.add('mably-embed');" +
            "try{if(new URLSearchParams(location.search).get('mode')==='inline')document.documentElement.classList.add('mably-embed-inline');}catch(e){}",
        }}
      />
      <div className="m-0 min-h-screen w-full bg-transparent">{children}</div>
    </>
  );
}
