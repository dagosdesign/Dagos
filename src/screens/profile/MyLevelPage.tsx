import { C, Card, GhostButton, GoldButton, SubPage } from '../../components/profile/ui';
import { featuresFor } from '../../lib/plan';
import { CEFR_LEVELS, CEFRLevel, LEVEL_NAMES, useUserProfile } from '../../lib/userProfile';

const CAN_DO: Record<CEFRLevel, string> = {
  A1: 'You understand and use familiar everyday expressions and very basic phrases, and can introduce yourself.',
  A2: 'You handle simple, routine exchanges and describe your background, your surroundings and immediate needs.',
  B1: 'You deal with most everyday situations, describe experiences and plans, and give short reasons and opinions.',
  B2: 'You interact with fluency and spontaneity, and write clear, detailed text on a wide range of subjects.',
  C1: 'You express ideas fluently and precisely, and use language flexibly for social, academic and professional purposes.',
  C2: 'You understand virtually everything you read or hear and express yourself with precision in complex situations.',
};

const GRAMMAR_FOCUS: Record<CEFRLevel, string> = {
  A1: 'be and have, present simple, articles, pronouns, there is / there are',
  A2: 'past simple, comparatives, going to and will, countable and uncountable nouns',
  B1: 'present perfect, conditionals, the passive, relative clauses, reported speech',
  B2: 'third and mixed conditionals, modals of deduction, wish, advanced passives',
  C1: 'inversion, cleft sentences, participle clauses, the subjunctive',
  C2: 'formal inversion, fronting, nuanced modality and complex clause structures',
};

export default function MyLevelPage({ onBack, onCheckLevel }: { onBack: () => void; onCheckLevel: () => void }) {
  const profile = useUserProfile();
  const canRetake = featuresFor(profile.membership).placementRetakes;

  if (!profile.placementTestCompleted) {
    return (
      <SubPage title="My Level" subtitle="Not assessed yet" onBack={onBack}>
        <Card className="p-6 text-center space-y-3">
          <p className="text-[18px] font-semibold" style={{ color: C.text }}>
            Find your English level
          </p>
          <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
            Take the grammar level assessment to place yourself between A1 and C2. Your level is saved here and in Your Level.
          </p>
          <GoldButton onClick={onCheckLevel}>Check Your Level</GoldButton>
        </Card>
      </SubPage>
    );
  }

  const idx = CEFR_LEVELS.indexOf(profile.level);
  const next = CEFR_LEVELS[idx + 1];

  return (
    <SubPage title="My Level" subtitle={`${profile.level} • ${profile.levelName}`} onBack={onBack}>
      <Card gold glow className="p-6 space-y-4">
        <div className="flex items-end gap-4">
          <p className="text-[56px] font-bold leading-none" style={{ color: C.gold }}>
            {profile.level}
          </p>
          <div className="pb-1.5">
            <p className="text-[18px] font-semibold" style={{ color: C.text }}>
              {profile.levelName}
            </p>
            <p className="text-[13px]" style={{ color: C.muted }}>
              CEFR level
            </p>
          </div>
        </div>
        <div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1C1C1C' }}>
            <div className="h-full rounded-full" style={{ width: `${profile.levelProgress}%`, background: C.gold }} />
          </div>
          <p className="text-[13px] mt-2" style={{ color: C.muted }}>
            {next ? `${profile.levelProgress}% of the way to ${next} • ${LEVEL_NAMES[next]}` : 'Top of the CEFR scale'}
          </p>
        </div>
      </Card>

      <Card className="p-5 space-y-2">
        <p className="text-[17px] font-semibold" style={{ color: C.text }}>
          What {profile.level} means
        </p>
        <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
          {CAN_DO[profile.level]}
        </p>
      </Card>

      {next && (
        <Card className="p-5 space-y-2">
          <p className="text-[17px] font-semibold" style={{ color: C.text }}>
            Grammar to reach {next}
          </p>
          <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
            {GRAMMAR_FOCUS[next]}
          </p>
        </Card>
      )}

      <Card className="grid grid-cols-6 p-3 gap-1">
        {CEFR_LEVELS.map((l, i) => (
          <div key={l} className="text-center py-2 rounded-xl" style={{ background: i === idx ? C.goldDim : 'transparent' }}>
            <p className="text-[15px] font-semibold" style={{ color: i === idx ? C.gold : i < idx ? C.text : C.muted }}>
              {l}
            </p>
          </div>
        ))}
      </Card>

      {canRetake ? (
        <GoldButton onClick={onCheckLevel}>Retake Check Your Level</GoldButton>
      ) : (
        <GhostButton onClick={onCheckLevel}>Retake Check Your Level • Premium</GhostButton>
      )}
    </SubPage>
  );
}
