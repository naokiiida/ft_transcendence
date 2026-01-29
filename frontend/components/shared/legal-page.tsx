import type { ReactNode } from "react";

interface LegalPageProps {
  title: string;
  lead?: string;
  children: ReactNode;
}

export function LegalPage({ title, lead, children }: LegalPageProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {lead ? (
          <p className="mt-2 text-sm text-muted-foreground">{lead}</p>
        ) : null}
      </header>
      <div className="space-y-6 text-sm leading-7 text-foreground">
        {children}
      </div>
    </div>
  );
}
