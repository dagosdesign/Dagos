import type { ReactNode } from 'react';
import { Settings, Bell } from 'lucide-react';
import { C } from './ui';

/* Lexistencehub wordmark with the settings and notifications buttons. */
export default function ProfileHeader({
  onSettings,
  onNotifications,
  hasUpdate,
}: {
  onSettings: () => void;
  onNotifications: () => void;
  hasUpdate: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-[max(4px,env(safe-area-inset-top))]">
      <p className="text-[27px] font-bold tracking-[-0.02em] leading-none select-none">
        <span style={{ color: C.text }}>Lexistence</span>
        <span style={{ color: C.gold }}>hub</span>
      </p>
      <div className="flex items-center gap-3">
        <RoundIcon label="Settings" onClick={onSettings}>
          <Settings className="w-[20px] h-[20px]" color={C.text} strokeWidth={1.8} />
        </RoundIcon>
        <RoundIcon label="Notifications" onClick={onNotifications}>
          <Bell className="w-[20px] h-[20px]" color={C.gold} fill={C.gold} strokeWidth={1.6} />
          {hasUpdate && (
            <span
              className="absolute top-[3px] right-[3px] w-[9px] h-[9px] rounded-full"
              style={{ background: C.gold, boxShadow: `0 0 0 2px ${C.bg}` }}
            />
          )}
        </RoundIcon>
      </div>
    </div>
  );
}

function RoundIcon({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="relative w-11 h-11 rounded-full border flex items-center justify-center cursor-pointer"
      style={{ background: C.card, borderColor: C.border }}
    >
      {children}
    </button>
  );
}
