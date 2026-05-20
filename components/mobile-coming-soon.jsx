export function MobileComingSoon() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background px-8 py-12 text-center">
      <img
        src="/images/Logo-SVG.svg"
        alt="Mably"
        className="h-8 w-auto"
        draggable={false}
      />
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-foreground">Mobile coming soon</h1>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
          This page isn&apos;t available on mobile yet. Head to Projects, Clients, or Settings,
          or use your laptop for the full experience.
        </p>
      </div>
      <a
        href="/projects"
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow transition-opacity hover:opacity-90"
      >
        Go to Projects
      </a>
    </div>
  );
}
