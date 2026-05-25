/**
 * Embed pages: standalone, transparent, no auth, no shell.
 * Designed to be loaded inside an iframe on third-party sites (Framer, etc.).
 */
export const metadata = {
  robots: { index: false, follow: false },
};

export default function EmbedLayout({ children }) {
  return (
    <>
      {/* Force the html/body to be transparent so the parent overlay backdrop
          shows through around the dark card. Scoped to embed routes only. */}
      <style>
        {`html,body{background:transparent !important;color-scheme:dark}`}
      </style>
      <div className="m-0 min-h-screen w-full bg-transparent">{children}</div>
    </>
  );
}
