import { ChevronRight, Crown } from 'lucide-react';
import { UserProfile } from '../../lib/userProfile';
import { C } from './ui';

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ profile, size }: { profile: UserProfile; size: number }) {
  return (
    <div
      className="rounded-full p-[3px] shrink-0"
      style={{
        width: size,
        height: size,
        background: C.gold,
        boxShadow: '0 0 26px rgba(245,184,46,0.35)',
      }}
    >
      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center" style={{ background: C.card2 }}>
        {profile.profileImage ? (
          <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-semibold" style={{ color: C.gold, fontSize: size * 0.3 }}>
            {initials(profile.name)}
          </span>
        )}
      </div>
    </div>
  );
}

export function PlanBadge({ plan }: { plan: UserProfile['membership'] }) {
  if (plan === 'premium') {
    return (
      <span
        className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[15px] font-medium"
        style={{ background: 'rgba(245,184,46,0.16)', color: C.gold }}
      >
        <Crown className="w-[17px] h-[17px]" color={C.gold} fill={C.gold} strokeWidth={1.5} />
        Premium
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center rounded-full px-4 py-1.5 text-[15px] font-medium border"
      style={{ borderColor: C.border, color: C.text, background: C.card2 }}
    >
      Free
    </span>
  );
}

/* Photo, name, username and membership badge. Tapping opens Personal Information. */
export default function StudentIdentityCard({ profile, onOpen }: { profile: UserProfile; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="w-full flex items-center gap-4 text-left cursor-pointer py-2">
      <Avatar profile={profile} size={112} />
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-[24px] font-semibold leading-tight break-words" style={{ color: C.text }}>
          {profile.name}
        </p>
        <p className="text-[16px] leading-tight truncate" style={{ color: C.muted }}>
          {profile.username}
        </p>
        <PlanBadge plan={profile.membership} />
      </div>
      <ChevronRight className="w-6 h-6 shrink-0" color={C.text} strokeWidth={1.8} />
    </button>
  );
}
