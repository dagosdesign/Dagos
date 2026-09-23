import { useEffect, useState } from 'react';
import { C, Card, Segmented, SubPage, Toggle } from '../../components/profile/ui';
import { applyNotificationPrefs } from '../../lib/notifications';
import { useUserProfile } from '../../lib/userProfile';

interface NotificationSettings {
  dailyReminder: boolean;
  wordDrop: boolean;
  reminderTime: string;
  streakReminder: boolean;
  weeklySummary: boolean;
  productUpdates: boolean;
}

const KEY = 'lex_notification_settings';
const TIMES = ['08:00', '12:00', '18:00', '20:00', '22:00'];
const CUSTOM = 'custom';

function load(): NotificationSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { wordDrop: true, ...(JSON.parse(raw) as Partial<NotificationSettings>) } as NotificationSettings;
  } catch {
    /* defaults */
  }
  return { dailyReminder: true, wordDrop: true, reminderTime: '20:00', streakReminder: true, weeklySummary: true, productUpdates: false };
}

export default function NotificationsPage({ onBack }: { onBack: () => void }) {
  const [s, setS] = useState<NotificationSettings>(load);
  // A time outside the presets is a custom time.
  const [custom, setCustom] = useState(() => !TIMES.includes(load().reminderTime));

  useEffect(() => {
    void applyNotificationPrefs(s); // the phone's own reminders follow the settings
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }, [s]);

  const premium = useUserProfile().membership === 'premium';
  const [wordrobeNote, setWordrobeNote] = useState(false);

  const rows: { key: keyof NotificationSettings; title: string; subtitle: string; premiumOnly?: boolean }[] = [
    { key: 'dailyReminder', title: 'Daily learning reminder', subtitle: 'A reminder to keep your daily goal' },
    { key: 'wordDrop', title: 'Wordrobe', subtitle: 'A new word every day, with its meaning and an example', premiumOnly: true },
    { key: 'streakReminder', title: 'Streak reminder', subtitle: 'Before your streak is about to end' },
    { key: 'weeklySummary', title: 'Weekly summary', subtitle: 'Your learning time and progress each week' },
    { key: 'productUpdates', title: 'Updates', subtitle: 'New games, words and features' },
  ];

  return (
    <SubPage title="Notifications" subtitle="Learning reminders and updates" onBack={onBack}>
      <Card className="divide-y divide-[#262626]">
        {rows.map(r => {
          const locked = r.premiumOnly && !premium;
          return (
            <div key={r.key} className="flex items-center gap-3 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium flex items-center gap-2" style={{ color: C.text }}>
                  {r.title}
                  {r.premiumOnly && (
                    <span
                      className="text-[9.5px] font-bold tracking-[0.12em] rounded-full px-2 py-0.5"
                      style={{ background: C.goldDim, color: C.gold, border: '1px solid rgba(245,184,46,0.45)' }}
                    >
                      PREMIUM
                    </span>
                  )}
                </p>
                <p className="text-[12.5px]" style={{ color: C.muted }}>
                  {r.subtitle}
                </p>
              </div>
              <Toggle
                label={r.title}
                checked={locked ? false : Boolean(s[r.key])}
                onChange={v => (locked ? setWordrobeNote(true) : setS(prev => ({ ...prev, [r.key]: v })))}
              />
            </div>
          );
        })}
      </Card>

      {wordrobeNote && !premium && (
        <Card gold className="p-4">
          <p className="text-[14px] leading-relaxed" style={{ color: C.text }}>
            Wordrobe is part of Premium: a new word every day, with its meaning and an example. Upgrade in Profile → Membership Plan.
          </p>
        </Card>
      )}

      {s.dailyReminder && (
        <Card className="p-5 space-y-3">
          <p className="text-[16px] font-semibold" style={{ color: C.text }}>
            Reminder time
          </p>
          <Segmented
            options={[...TIMES.map(t => ({ value: t, label: t })), { value: CUSTOM, label: 'Custom' }]}
            value={custom ? CUSTOM : s.reminderTime}
            onChange={v => {
              if (v === CUSTOM) setCustom(true);
              else {
                setCustom(false);
                setS(prev => ({ ...prev, reminderTime: v }));
              }
            }}
          />
          {custom && (
            <label className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3" style={{ background: C.card2, borderColor: C.border }}>
              <span className="text-[14px]" style={{ color: C.muted }}>
                Your time
              </span>
              <input
                type="time"
                value={s.reminderTime}
                onChange={e => e.target.value && setS(prev => ({ ...prev, reminderTime: e.target.value }))}
                className="bg-transparent text-[18px] font-semibold outline-none [color-scheme:dark]"
                style={{ color: C.gold }}
              />
            </label>
          )}
        </Card>
      )}

      <p className="px-1 text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
        Your notification preferences are saved to this device.
      </p>
    </SubPage>
  );
}
