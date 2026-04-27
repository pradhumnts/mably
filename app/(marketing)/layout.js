/**
 * Marketing pages: no main app shell, no auth — safe to expose publicly.
 */
export default function MarketingLayout({ children }) {
  return <>{children}</>;
}
