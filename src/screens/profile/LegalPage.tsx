import { Fragment, type ReactNode } from 'react';
import { C, Card, SubPage } from '../../components/profile/ui';
import { PRIVACY_EMAIL, PRIVACY_EN, PRIVACY_TR } from '../../data/privacyPolicy';
import type { PolicyDocument } from '../../data/privacyPolicy';
import { TERMS_EN, TERMS_TR } from '../../data/termsOfUse';

/* PRIVACY POLICY and TERMS OF USE: the Turkish text first, the English text under it. */

// The contact address is a link wherever it appears.
function withEmail(text: string): ReactNode {
  const parts = text.split(PRIVACY_EMAIL);
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 && (
        <a href={`mailto:${PRIVACY_EMAIL}`} className="underline underline-offset-2" style={{ color: C.gold }}>
          {PRIVACY_EMAIL}
        </a>
      )}
    </Fragment>
  ));
}

function Policy({ doc, lang }: { doc: PolicyDocument; lang: string }) {
  return (
    <article lang={lang} className="space-y-3">
      <div className="px-1 space-y-1">
        <h2 className="text-[21px] font-semibold leading-tight" style={{ color: C.text }}>
          {doc.heading}
        </h2>
        <p className="text-[12.5px] tracking-[0.04em]" style={{ color: C.gold }}>
          {doc.updated}
        </p>
      </div>

      <Card className="p-5 space-y-3">
        {doc.intro.map((p, i) => (
          <p key={i} className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
            {p}
          </p>
        ))}
      </Card>

      <Card className="divide-y divide-[#262626]">
        {doc.sections.map(s => (
          <section key={s.title} className="p-5 space-y-2.5">
            <h3 className="text-[16px] font-semibold" style={{ color: C.text }}>
              {s.title}
            </h3>
            {s.parts.map((part, i) =>
              Array.isArray(part) ? (
                <ul key={i} className="space-y-1.5">
                  {part.map(item => (
                    <li key={item} className="flex gap-2.5 text-[14px] leading-relaxed" style={{ color: C.muted }}>
                      <span className="mt-[9px] w-1 h-1 rounded-full shrink-0" style={{ background: C.gold }} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p key={i} className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
                  {withEmail(part)}
                </p>
              )
            )}
          </section>
        ))}
      </Card>

      <div className="pt-3 pb-1 text-center space-y-0.5">
        <p className="text-[13px] font-semibold tracking-[0.08em]" style={{ color: C.text }}>
          Lexistencehub
        </p>
        <p className="text-[12px]" style={{ color: C.muted }}>
          Beyond English
        </p>
      </div>
    </article>
  );
}

const DOCUMENTS = {
  privacy: { title: 'Privacy Policy', subtitle: 'Gizlilik Politikası · Türkçe & English', tr: PRIVACY_TR, en: PRIVACY_EN },
  terms: { title: 'Terms of Use', subtitle: 'Kullanım Koşulları · Türkçe & English', tr: TERMS_TR, en: TERMS_EN },
};

export default function LegalPage({ kind, onBack }: { kind: keyof typeof DOCUMENTS; onBack: () => void }) {
  const doc = DOCUMENTS[kind];
  return (
    <SubPage title={doc.title} subtitle={doc.subtitle} onBack={onBack}>
      <Policy doc={doc.tr} lang="tr" />
      <div className="h-px my-2" style={{ background: C.border }} />
      <Policy doc={doc.en} lang="en" />
    </SubPage>
  );
}
