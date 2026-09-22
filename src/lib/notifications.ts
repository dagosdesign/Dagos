import { LocalNotifications, type LocalNotificationSchema } from '@capacitor/local-notifications';
import { FLASHCARDS } from '../data/flashcards';
import { isNative } from './runtime';

/* NOTIFICATIONS on the phone: the reminders the student switches on in Settings.
   Everything is scheduled on the device itself (no server needed):
   - daily learning reminder at the chosen time;
   - Word Drop: one new word a day at 13:00, planned two weeks ahead;
   - streak reminder at 21:00;
   - weekly summary on Sunday at 19:00.
   On the web nothing is scheduled - the settings are only saved. */

export interface NotificationPrefs {
  dailyReminder: boolean;
  wordDrop: boolean;
  reminderTime: string; // "HH:MM"
  streakReminder: boolean;
  weeklySummary: boolean;
}

const ID = { daily: 1, streak: 2, weekly: 3, wordDrop: 100 }; // word drops: 100 + day

const REMINDERS = [
  'Ten minutes of English today keeps your streak alive.',
  'A few new words are waiting for you.',
  'Time for a quick game? Your daily goal is close.',
  'Grammar, words or a story - pick one and keep going.',
];

/* The same word for everyone on a given day, so it feels like a daily drop. */
function wordOfDay(d: Date) {
  const pool = FLASHCARDS.filter(f => /^[a-z]+$/i.test(f.word) && f.turkishMeaning.length <= 40);
  const dayNumber = Math.floor(d.getTime() / 86_400_000);
  return pool[(dayNumber * 7919) % pool.length];
}

export async function notificationsAllowed(): Promise<boolean> {
  if (!isNative) return false;
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') return true;
    const asked = await LocalNotifications.requestPermissions();
    return asked.display === 'granted';
  } catch {
    return false;
  }
}

export async function applyNotificationPrefs(p: NotificationPrefs): Promise<void> {
  if (!isNative) return;
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });

    const wants = p.dailyReminder || p.wordDrop || p.streakReminder || p.weeklySummary;
    if (!wants || !(await notificationsAllowed())) return;

    const list: LocalNotificationSchema[] = [];
    const [hour, minute] = p.reminderTime.split(':').map(Number);

    if (p.dailyReminder && Number.isFinite(hour)) {
      list.push({
        id: ID.daily,
        title: 'Lexistencehub',
        body: REMINDERS[new Date().getDate() % REMINDERS.length],
        schedule: { on: { hour, minute: minute || 0 }, allowWhileIdle: true },
      });
    }
    if (p.streakReminder) {
      list.push({
        id: ID.streak,
        title: 'Keep your streak',
        body: 'You have not practised today yet - one activity keeps the streak going.',
        schedule: { on: { hour: 21, minute: 0 }, allowWhileIdle: true },
      });
    }
    if (p.weeklySummary) {
      list.push({
        id: ID.weekly,
        title: 'Your week in English',
        body: 'Open My Progress to see your learning time, streak and performance this week.',
        schedule: { on: { weekday: 1, hour: 19, minute: 0 }, allowWhileIdle: true },
      });
    }
    if (p.wordDrop) {
      const now = new Date();
      for (let i = 0; i < 14; i++) {
        const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 13, 0, 0);
        if (at <= now) continue;
        const w = wordOfDay(at);
        list.push({
          id: ID.wordDrop + i,
          title: `Word Drop: ${w.word}`,
          body: `${w.turkishMeaning} - "${w.exampleSentence}"`,
          schedule: { at, allowWhileIdle: true },
        });
      }
    }
    if (list.length) await LocalNotifications.schedule({ notifications: list });
  } catch (err) {
    console.warn('[notifications] could not schedule', err);
  }
}

/* At every start the saved preferences are applied again (word drops roll forward). */
export function bootNotifications() {
  if (!isNative) return;
  try {
    const raw = localStorage.getItem('lex_notification_settings');
    if (raw) void applyNotificationPrefs(JSON.parse(raw));
  } catch {
    /* ignore */
  }
}
