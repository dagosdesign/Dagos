import { useEffect, useState } from 'react';
import { C, Card, Segmented, SubPage, Toggle } from '../../components/profile/ui';

interface NotificationSettings {
  dailyReminder: boolean;
  reminderTime: string;
  streakReminder: boolean;
  weeklySummary: boolean;
  productUpdates: boolean;
}

const KEY = 'lex_notification_settings';
const TIMES = ['08:00', '12:00', '18:00', '20:00', '22:00'];

function load(): NotificationSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as NotificationSettings;
  } catch {
    /* defaults */
  }
  return { dailyReminder: true, reminderTime: '20:00', streakReminder: true, weeklySummary: true, productUpdates: false };
}

export default function NotificationsPage({ onBack }: { onBack: () => void }) {
  const [s, setS] = useState<NotificationSettings>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }, [s]);

  const rows: { key: keyof NotificationSettings; title: string; subtitle: string }[] = [
    { key: 'dailyReminder', title: 'Daily learning reminder', subtitle: 'A reminder to keep your daily goal' },
    { key: 'streakReminder', title: 'Streak reminder', subtitle: 'Before your streak is about to end' },
    { key: 'weeklySummary', title: 'Weekly summary', subtitle: 'Your learning time and progress each week' },
    { key: 'productUpdates', title: 'Updates', subtitle: 'New games, words and features' },
  ];

  return (
    <SubPage title="Notifications" subtitle="Learning reminders and updates" onBack={onBack}>
      <Card className="divide-y divide-[#262626]">
        {rows.map(r => (
          <div key={r.key} className="flex items-center gap-3 px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium" style={{ color: C.text }}>
                {r.title}
              </p>
              <p className="text-[12.5px]" style={{ color: C.muted }}>
                {r.subtitle}
              </p>
            </div>
            <Toggle
              label={r.title}
              checked={Boolean(s[r.key])}
              onChange={v => setS(prev => ({ ...prev, [r.key]: v }))}
            />
          </div>
        ))}
      </Card>

      {s.dailyReminder && (
        <Card className="p-5 space-y-3">
          <p className="text-[16px] font-semibold" style={{ color: C.text }}>
            Reminder time
          </p>
          <Segmented options={TIMES.map(t => ({ value: t, label: t }))} value={s.reminderTime} onChange={v => setS(prev => ({ ...prev, reminderTime: v }))} />
        </Card>
      )}

      <p className="px-1 text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
        Your notification preferences are saved to this device.
      </p>
    </SubPage>
  );
}
