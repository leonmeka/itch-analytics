import Link from 'next/link';
import { legalDocuments } from './legal-content.data';

export function LegalDocument({ document }: { document: keyof typeof legalDocuments }) {
  const content = legalDocuments[document];
  return (
    <main className="mx-auto min-h-svh max-w-[760px] px-6 py-10 sm:px-10 sm:py-16">
      <Link
        href="/"
        className="text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        ← Back to Scratch
      </Link>
      <article className="mt-12">
        <h1 className="text-[clamp(36px,6vw,58px)] font-semibold leading-[1.08] tracking-[-0.045em]">
          {content.title}
        </h1>
        <p className="mt-4 text-xs opacity-80">Last updated October 5, 2026</p>
        <p className="mt-8 text-lg leading-relaxed">{content.intro}</p>
        <div className="mt-12 space-y-9">
          {content.sections.map(([heading, body], index) => (
            <section key={heading}>
              <h2 className="text-xl font-semibold tracking-tight">
                {index + 1}. {heading}
              </h2>
              <p className="mt-3 text-[15px] leading-[1.8]">{body}</p>
            </section>
          ))}
        </div>
      </article>
      <nav aria-label="Legal" className="mt-16 flex gap-6 border-t border-cream/25 pt-6 text-sm">
        <Link href="/legal/terms" className="underline underline-offset-4">
          Terms and Conditions
        </Link>
        <Link href="/legal/privacy" className="underline underline-offset-4">
          Privacy Policy
        </Link>
      </nav>
    </main>
  );
}
