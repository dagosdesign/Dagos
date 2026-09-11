import { useEffect, useState, type ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { C, Card, GhostButton, GoldButton } from '../../components/profile/ui';
import PlanLimitCard from '../../components/PlanLimitCard';
import { answerPlacement, BLOCK_SIZE, PlacementState, placementReady, SEEN_KEY, startPlacement } from '../../lib/placement';
import { markSeen } from '../../lib/seenHistory';
import { featuresFor } from '../../lib/plan';
import { LEVEL_NAMES, savePlacementResult, useUserProfile, CEFR_LEVELS } from '../../lib/userProfile';
import { logActivity } from '../../lib/activityLog';

/* CHECK YOUR LEVEL. Free members take the first test; retakes are Premium. */
export default function PlacementTestScreen({ onClose, isOnboarding = false }: { onClose: () => void; isOnboarding?: boolean }) {
  const profile = useUserProfile();
  const features = featuresFor(profile.membership);
  const [phase, setPhase] = useState<'intro' | 'test' | 'result'>('intro');
  const [state, setState] = useState<PlacementState | null>(null);
  const [choice, setChoice] = useState<number | null>(null);

  const current = state && !state.finished ? state.block[state.index] : null;

  // A question counts as seen the moment it is shown, so a retake brings new ones.
  useEffect(() => {
    if (phase === 'test' && current) markSeen(SEEN_KEY, current.id, current.band);
  }, [phase, current]);

  const locked = phase === 'intro' && profile.placementTestCompleted && !features.placementRetakes;

  const start = () => {
    setState(startPlacement());
    setChoice(null);
    setPhase('test');
  };

  const next = () => {
    if (!state || !current || choice === null) return;
    const s = answerPlacement(state, choice === current.correct);
    setChoice(null);
    setState(s);
    if (s.finished && s.level) {
      savePlacementResult(s.level, s.progress ?? 0);
      logActivity('placement', 'Check Your Level', `${s.level} • ${LEVEL_NAMES[s.level]}`);
      setPhase('result');
    }
  };

  const shell = (children: ReactNode, title = 'Check Your Level') => (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: C.bg }}>
      <div className="max-w-xl mx-auto px-5 pt-[max(20px,env(safe-area-inset-top))] pb-[max(28px,env(safe-area-inset-bottom))] space-y-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 rounded-full border flex items-center justify-center cursor-pointer shrink-0"
            style={{ background: C.card, borderColor: C.border }}
          >
            <ChevronLeft className="w-5 h-5" color={C.text} />
          </button>
          <div className="min-w-0">
            <h1 className="text-[21px] font-semibold leading-tight" style={{ color: C.text }}>
              {title}
            </h1>
            <p className="text-[13px]" style={{ color: C.muted }}>
              Grammar Level Assessment • A1–C2
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );

  if (locked) {
    return shell(
      <div className="space-y-4">
        <Card className="p-5">
          <p className="text-[13px]" style={{ color: C.muted }}>
            Your current level
          </p>
          <p className="text-[32px] font-bold leading-tight" style={{ color: C.gold }}>
            {profile.level}
          </p>
          <p className="text-[15px]" style={{ color: C.text }}>
            {profile.levelName}
          </p>
        </Card>
        <PlanLimitCard kind="retake" onBack={onClose} />
      </div>
    );
  }

  if (!placementReady()) {
    return shell(
      <Card className="p-6 text-center space-y-3">
        <p className="text-[17px] font-semibold" style={{ color: C.text }}>
          The level test is being prepared
        </p>
        <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
          Its questions are still being reviewed. Please check back soon.
        </p>
        <GhostButton onClick={onClose}>Back</GhostButton>
      </Card>
    );
  }

  if (phase === 'intro') {
    return shell(
      <div className="space-y-4">
        <Card className="p-5 space-y-3">
          <p className="text-[18px] font-semibold" style={{ color: C.text }}>
            {isOnboarding ? 'Welcome to Lexistencehub' : profile.placementTestCompleted ? 'Check your level again' : 'Find your English level'}
          </p>
          <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
            A short grammar test places you on the CEFR scale from A1 to C2, so your learning starts at the right level. It
            adapts to your answers: questions get harder when you answer well and easier when they are too hard.
          </p>
          <ul className="space-y-1.5 text-[14px]" style={{ color: C.text }}>
            <li>• {BLOCK_SIZE * 2}–{BLOCK_SIZE * CEFR_LEVELS.length} questions, about 10 minutes</li>
            <li>• Choose the option that completes each sentence correctly</li>
            <li>• Your level is saved to your profile when you finish</li>
          </ul>
        </Card>
        <GoldButton onClick={start}>Start the Test</GoldButton>
        <GhostButton onClick={onClose}>{isOnboarding ? 'Later' : 'Back'}</GhostButton>
      </div>
    );
  }

  if (phase === 'result' && state?.level) {
    const nextLevel = CEFR_LEVELS[CEFR_LEVELS.indexOf(state.level) + 1];
    return shell(
      <div className="space-y-4">
        <Card gold glow className="p-6 text-center space-y-2">
          <p className="text-[13px] tracking-[0.12em] uppercase" style={{ color: C.muted }}>
            Your level
          </p>
          <p className="text-[56px] font-bold leading-none" style={{ color: C.gold }}>
            {state.level}
          </p>
          <p className="text-[17px]" style={{ color: C.text }}>
            {LEVEL_NAMES[state.level]}
          </p>
          <div className="pt-3">
            <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1C1C1C' }}>
              <div className="h-full rounded-full" style={{ width: `${state.progress ?? 0}%`, background: C.gold }} />
            </div>
            <p className="text-[13px] mt-2" style={{ color: C.muted }}>
              {nextLevel ? `${state.progress ?? 0}% of the way to ${nextLevel}` : 'Top of the CEFR scale'}
            </p>
          </div>
        </Card>
        <Card className="divide-y divide-[#262626]">
          {state.results.map(r => (
            <div key={r.band} className="flex items-center justify-between px-4 py-3">
              <span className="text-[15px]" style={{ color: C.text }}>
                {r.band} questions
              </span>
              <span className="text-[15px] font-semibold" style={{ color: r.correct >= 4 ? C.gold : C.muted }}>
                {r.correct} / {BLOCK_SIZE}
              </span>
            </div>
          ))}
        </Card>
        <GoldButton onClick={onClose}>Continue</GoldButton>
      </div>,
      'Test Complete'
    );
  }

  if (!current || !state) return null;
  const [before, after] = current.question.split('_____');
  return shell(
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[14px]" style={{ color: C.muted }}>
          Question <span style={{ color: C.text }}>{state.answered + 1}</span>
        </p>
        <p className="text-[13px]" style={{ color: C.muted }}>
          Block {state.results.length + 1} • {state.index + 1} / {BLOCK_SIZE}
        </p>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1C1C1C' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${((state.index + 1) / BLOCK_SIZE) * 100}%`, background: C.gold }} />
      </div>
      <Card className="p-5">
        <p className="text-[18px] leading-relaxed break-words" style={{ color: C.text }}>
          {before}
          <span
            className="inline-block min-w-[72px] mx-1 border-b-2 text-center"
            style={{ borderColor: C.gold, color: C.gold }}
          >
            {choice !== null ? current.options[choice] : ' '}
          </span>
          {after}
        </p>
      </Card>
      <div className="grid grid-cols-1 gap-2.5">
        {current.options.map((o, i) => {
          const on = choice === i;
          return (
            <button
              key={`${current.id}-${i}`}
              type="button"
              onClick={() => setChoice(i)}
              className="w-full text-left rounded-2xl border px-4 py-3.5 text-[15px] cursor-pointer transition-colors break-words"
              style={{
                background: on ? C.goldDim : C.card,
                borderColor: on ? 'rgba(245,184,46,0.6)' : C.border,
                color: on ? C.gold : C.text,
              }}
            >
              {o}
            </button>
          );
        })}
      </div>
      <GoldButton onClick={next} disabled={choice === null}>
        Next
      </GoldButton>
    </div>
  );
}
