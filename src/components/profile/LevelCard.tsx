import { BarChart3, ChevronRight } from 'lucide-react';
import { CEFR_LEVELS, UserProfile } from '../../lib/userProfile';
import { C, Card } from './ui';

/* Your Level: progress ring, CEFR level and its place on the A1-C2 track. */
export default function LevelCard({
  profile,
  onDetails,
  onCheckLevel,
}: {
  profile: UserProfile;
  onDetails: () => void;
  onCheckLevel: () => void;
}) {
  const assessed = profile.placementTestCompleted;
  const progress = assessed ? profile.levelProgress : 0;
  const levelIdx = CEFR_LEVELS.indexOf(profile.level);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6" color={C.gold} strokeWidth={2.4} />
          <h3 className="text-[18px] font-semibold" style={{ color: C.text }}>
            Your Level
          </h3>
        </div>
        <button
          type="button"
          onClick={assessed ? onDetails : onCheckLevel}
          className="flex items-center gap-1 text-[14px] cursor-pointer"
          style={{ color: C.gold }}
        >
          {assessed ? 'See Details' : 'Check Level'} <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-5 flex items-center gap-4 sm:gap-6">
        <ProgressRing percent={progress} label={assessed ? `${progress}%` : '—'} />
        <div className="w-px self-stretch" style={{ background: C.border }} />
        <div className="min-w-0 flex-1">
          {assessed ? (
            <>
              <p className="text-[46px] font-bold leading-none" style={{ color: C.gold }}>
                {profile.level}
              </p>
              <p className="text-[15px] mt-2" style={{ color: C.muted }}>
                {profile.levelName}
              </p>
            </>
          ) : (
            <>
              <p className="text-[17px] font-semibold leading-snug" style={{ color: C.text }}>
                Not assessed yet
              </p>
              <button
                type="button"
                onClick={onCheckLevel}
                className="mt-2 text-[13px] font-semibold rounded-full px-3.5 py-1.5 cursor-pointer"
                style={{ background: C.gold, color: '#0B0B0B' }}
              >
                Check Your Level
              </button>
            </>
          )}
          <LevelTrack current={assessed ? levelIdx : -1} />
        </div>
      </div>
    </Card>
  );
}

function ProgressRing({ percent, label }: { percent: number; label: string }) {
  const size = 132;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, percent)) / 100) * circ;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1C1C1C" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.gold}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ filter: 'drop-shadow(0 0 6px rgba(245,184,46,0.35))', transition: 'stroke-dasharray 600ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[30px] font-bold leading-none" style={{ color: C.text }}>
          {label}
        </span>
        <span className="text-[14px] mt-1" style={{ color: C.muted }}>
          Progress
        </span>
      </div>
    </div>
  );
}

function LevelTrack({ current }: { current: number }) {
  return (
    <div className="mt-4">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-[6px] right-[6px] h-[3px] rounded-full" style={{ background: '#2A2A2A' }} />
        {current > 0 && (
          <div
            className="absolute left-[6px] h-[3px] rounded-full"
            style={{
              width: `calc(${(current / (CEFR_LEVELS.length - 1)) * 100}% - 12px)`,
              background: `linear-gradient(90deg, rgba(245,184,46,0.35), ${C.gold})`,
            }}
          />
        )}
        {CEFR_LEVELS.map((l, i) => (
          <span
            key={l}
            className="relative rounded-full"
            style={
              i === current
                ? { width: 14, height: 14, background: C.gold, boxShadow: '0 0 10px rgba(245,184,46,0.6)' }
                : { width: 12, height: 12, background: '#3A3A3A' }
            }
          />
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {CEFR_LEVELS.map((l, i) => (
          <span key={l} className="text-[12.5px] w-6 text-center" style={{ color: i === current ? C.gold : C.muted }}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
