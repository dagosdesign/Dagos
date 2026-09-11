import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { C, Card, SubPage } from '../../components/profile/ui';

type AppLanguage = 'en' | 'tr';
const KEY = 'lex_app_language';

function load(): AppLanguage {
  try {
    return localStorage.getItem(KEY) === 'tr' ? 'tr' : 'en';
  } catch {
    return 'en';
  }
}

export default function LanguagePage({ onBack, notify }: { onBack: () => void; notify: (msg: string) => void }) {
  const [lang, setLang] = useState<AppLanguage>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const options: { value: AppLanguage; title: string; subtitle: string }[] = [
    { value: 'en', title: 'English', subtitle: 'Interface in English' },
    { value: 'tr', title: 'Türkçe', subtitle: 'Arayüz Türkçe' },
  ];

  return (
    <SubPage title="Language" subtitle="English / Türkçe" onBack={onBack}>
      <Card className="divide-y divide-[#262626]">
        {options.map(o => {
          const on = o.value === lang;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                setLang(o.value);
                notify(o.value === 'tr' ? 'Dil tercihi kaydedildi' : 'Language preference saved');
              }}
              className="w-full flex items-center gap-3 px-4 py-4 text-left cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium" style={{ color: on ? C.gold : C.text }}>
                  {o.title}
                </p>
                <p className="text-[12.5px]" style={{ color: C.muted }}>
                  {o.subtitle}
                </p>
              </div>
              {on && <Check className="w-5 h-5 shrink-0" color={C.gold} strokeWidth={2.4} />}
            </button>
          );
        })}
      </Card>
      <p className="px-1 text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
        Your language preference is saved to your profile on this device.
      </p>
    </SubPage>
  );
}
