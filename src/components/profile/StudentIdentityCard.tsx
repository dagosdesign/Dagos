import { Crown, Pencil } from 'lucide-react';
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

/* Photo, name, username and membership, with Edit Profile - the way into
   Personal Information (name, username and profile photo). A quiet row: the
   photo in a thin gold ring with an edit badge, the name leading, and two
   matching chips for the plan and for editing. */
export default function StudentIdentityCard({ profile, onEdit }: { profile: UserProfile; onEdit: () => void }) {
  const premium = profile.membership === 'premium';
  return (
    <div className="w-full flex items-center gap-4 pt-1 pb-2">
      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit profile photo"
        className="relative shrink-0 cursor-pointer rounded-full"
      >
        <span
          className="block w-[80px] h-[80px] rounded-full p-[2px]"
          style={{
            background: `linear-gradient(145deg, ${C.gold}, rgba(245,184,46,0.25) 60%, ${C.gold})`,
            boxShadow: '0 0 18px rgba(245,184,46,0.14)',
          }}
        >
          <span
            className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
            style={{ background: C.card, border: `3px solid ${C.bg}` }}
          >
            {profile.profileImage ? (
              <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[24px] font-semibold tracking-[0.02em]" style={{ color: C.gold }}>
                {initials(profile.name)}
              </span>
            )}
          </span>
        </span>
        <span
          className="absolute bottom-0 right-0 w-[26px] h-[26px] rounded-full flex items-center justify-center"
          style={{ background: C.gold, border: `2px solid ${C.bg}` }}
        >
          <Pencil className="w-3.5 h-3.5" color="#0B0B0B" strokeWidth={2.2} />
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <p className="text-[22px] font-semibold leading-tight truncate" style={{ color: C.text }}>
          {profile.name}
        </p>
        <p className="text-[14px] leading-tight truncate mt-1" style={{ color: C.muted }}>
          {profile.username}
        </p>
        <div className="flex items-center gap-1.5 mt-2.5">
          <span
            className="inline-flex items-center gap-1 h-[26px] rounded-full px-2.5 text-[10.5px] font-semibold tracking-[0.08em] uppercase border whitespace-nowrap shrink-0"
            style={
              premium
                ? { color: C.gold, borderColor: 'rgba(245,184,46,0.45)', background: C.goldDim }
                : { color: C.muted, borderColor: C.border, background: C.card }
            }
          >
            {premium && <Crown className="w-3.5 h-3.5" color={C.gold} fill={C.gold} strokeWidth={1.5} />}
            {premium ? 'Premium' : 'Free Plan'}
          </span>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 h-[26px] rounded-full px-2.5 text-[10.5px] font-semibold tracking-[0.08em] uppercase border whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:border-[#F5B82E]"
            style={{ color: C.text, borderColor: C.border, background: C.card }}
          >
            <Pencil className="w-3 h-3" color={C.gold} strokeWidth={2} />
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}
