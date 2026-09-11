import { C, Card, SubPage } from '../../components/profile/ui';

type InfoKind = 'help' | 'privacy' | 'terms' | 'about';

interface Block {
  title: string;
  body: string;
}

const CONTENT: Record<InfoKind, { title: string; subtitle: string; blocks: Block[] }> = {
  help: {
    title: 'Help & Support',
    subtitle: 'Answers to common questions',
    blocks: [
      {
        title: 'How is my level decided?',
        body: 'Check Your Level is an adaptive grammar test. It moves up after strong answers and down after weak ones, and places you between A1 and C2. The result is saved to your profile.',
      },
      {
        title: 'What does the Free plan include?',
        body: 'Every day: 10 words, 3 games, 1 grammar activity and 1 listening activity, plus basic progress tracking and the daily challenge. Limits start over each day.',
      },
      {
        title: 'How is learning time counted?',
        body: 'Time is added while a learning screen - a game, practice session, grammar test, word cards or AI Lex - is open and visible.',
      },
      {
        title: 'How do streaks work?',
        body: 'Complete at least one activity every day. Missing a day starts the streak again.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'How your information is used',
    blocks: [
      {
        title: 'What is stored',
        body: 'Your name, username, profile photo, level, membership, learning time, activity history and game progress are stored on this device so the app can show your progress.',
      },
      {
        title: 'AI features',
        body: 'When you use AI Lex, the messages you send are processed by an AI service to create the replies. Do not share sensitive personal information in these conversations.',
      },
      {
        title: 'Your control',
        body: 'You can edit your personal information at any time, and reset your statistics or remove your profile data from this device in Account Settings.',
      },
    ],
  },
  terms: {
    title: 'Terms of Use',
    subtitle: 'The basics of using Lexistencehub',
    blocks: [
      {
        title: 'Personal learning',
        body: 'Lexistencehub is for personal English learning. Use the content for your own study and do not copy or redistribute it.',
      },
      {
        title: 'Membership',
        body: 'Free membership includes daily learning limits. Premium removes them and adds AI personalisation while it is active.',
      },
      {
        title: 'Assessments',
        body: 'Level results are an estimate to guide your learning. They are not an official certificate.',
      },
    ],
  },
  about: {
    title: 'About Lexistencehub',
    subtitle: 'Beyond English.',
    blocks: [
      {
        title: 'Lexistencehub',
        body: 'An English learning app for Turkish learners: vocabulary from everyday English to LGS, YDS, YDT, YÖKDİL and IELTS, grammar from A1 to C2, games and an AI coach - in one place.',
      },
      {
        title: 'Version',
        body: '1.0',
      },
    ],
  },
};

export default function InfoPage({ kind, onBack }: { kind: InfoKind; onBack: () => void }) {
  const page = CONTENT[kind];
  return (
    <SubPage title={page.title} subtitle={page.subtitle} onBack={onBack}>
      <Card className="divide-y divide-[#262626]">
        {page.blocks.map(b => (
          <div key={b.title} className="p-5 space-y-1.5">
            <p className="text-[16px] font-semibold" style={{ color: C.text }}>
              {b.title}
            </p>
            <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
              {b.body}
            </p>
          </div>
        ))}
      </Card>
    </SubPage>
  );
}
