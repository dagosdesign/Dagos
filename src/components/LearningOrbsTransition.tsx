import {
  Bot,
  BookOpen,
  ChevronLeft,
  Eye,
  Gamepad2,
  Headphones,
  MessagesSquare,
  Pencil,
} from 'lucide-react';

export type LearningMethodLabel =
  | 'Listening'
  | 'Writing'
  | 'Visual Learning'
  | 'Games'
  | 'Stories'
  | 'Conversations'
  | 'AI';

const learningMethods: { label: LearningMethodLabel; Icon: typeof Headphones; className: string }[] = [
  { label: 'Listening', Icon: Headphones, className: 'orb-1' },
  { label: 'Writing', Icon: Pencil, className: 'orb-2' },
  { label: 'Visual Learning', Icon: Eye, className: 'orb-3' },
  { label: 'Games', Icon: Gamepad2, className: 'orb-4' },
  { label: 'Stories', Icon: BookOpen, className: 'orb-5' },
  { label: 'Conversations', Icon: MessagesSquare, className: 'orb-6' },
  { label: 'AI', Icon: Bot, className: 'orb-7' },
];

interface LearningOrbsTransitionProps {
  categoryLabel: string;
  onSelect: (method: LearningMethodLabel) => void;
  onClose: () => void;
}

export default function LearningOrbsTransition({ categoryLabel, onSelect, onClose }: LearningOrbsTransitionProps) {
  return (
    <div className="fixed inset-0 z-50">
      <section className="learning-orbits" aria-labelledby="learning-orbits-title">
        <style>{`
          .learning-orbits {
            --gold: #f4b82f;
            position: relative;
            width: 100%;
            height: 100dvh;
            overflow: hidden;
            background: #000;
            color: #f7f7f7;
            isolation: isolate;
            display: flex;
            flex-direction: column;
          }

          .learning-orbits__heading {
            position: relative;
            z-index: 2;
            max-width: 520px;
            margin: 0 auto;
            padding: 42px 20px 8px;
            text-align: center;
            font-size: clamp(2rem, 6vw, 3.5rem);
            line-height: 1.08;
            font-weight: 600;
            letter-spacing: 0;
          }

          .learning-orbits__accent { color: var(--gold); }

          .learning-orbits__field {
            position: relative;
            width: min(100%, 720px);
            flex: 1;
            margin: 0 auto;
          }

          .learning-orbits__orb {
            position: absolute;
            display: grid;
            place-items: center;
            width: clamp(126px, 25vw, 174px);
            aspect-ratio: 1;
            padding: 0;
            border: 1px solid var(--gold);
            border-radius: 50%;
            background: #050403;
            color: #f7f7f7;
            font: inherit;
            cursor: pointer;
            box-shadow:
              0 0 20px rgba(244, 184, 47, 0.32),
              inset 0 0 18px rgba(244, 184, 47, 0.08);
            will-change: transform;
          }

          .learning-orbits__orb::after {
            content: "";
            position: absolute;
            top: 10%;
            right: 14%;
            width: 7px;
            aspect-ratio: 1;
            border-radius: 50%;
            background: var(--gold);
            box-shadow: 0 0 12px var(--gold);
          }

          .learning-orbits__orb:hover {
            border-color: #ffd76b;
            box-shadow:
              0 0 28px rgba(244, 184, 47, 0.48),
              inset 0 0 22px rgba(244, 184, 47, 0.12);
          }

          .learning-orbits__orb:focus-visible {
            outline: 3px solid #fff;
            outline-offset: 5px;
          }

          .learning-orbits__content {
            display: grid;
            justify-items: center;
            gap: 9px;
            padding: 16px;
            text-align: center;
            font-size: 1rem;
            font-weight: 500;
          }

          .learning-orbits__icon {
            width: 36px;
            height: 36px;
            color: var(--gold);
            stroke-width: 1.8;
          }

          .orb-1 { left: 4%; top: 5%; animation: drift-a 19s ease-in-out infinite alternate; }
          .orb-2 { right: 3%; top: 7%; animation: drift-b 22s ease-in-out -8s infinite alternate; }
          .orb-3 { left: 38%; top: 31%; animation: drift-c 18s ease-in-out -4s infinite alternate; }
          .orb-4 { left: 1%; top: 51%; animation: drift-b 21s ease-in-out -12s infinite alternate-reverse; }
          .orb-5 { right: 1%; top: 52%; animation: drift-a 24s ease-in-out -6s infinite alternate-reverse; }
          .orb-6 { left: 18%; top: 75%; animation: drift-c 22s ease-in-out -15s infinite alternate; }
          .orb-7 { right: 16%; top: 76%; animation: drift-b 20s ease-in-out -3s infinite alternate; }

          @keyframes drift-a {
            0% { transform: translate3d(-5px, 8px, 0) rotate(-1deg); }
            50% { transform: translate3d(14px, -10px, 0) rotate(1deg); }
            100% { transform: translate3d(-9px, -3px, 0); }
          }

          @keyframes drift-b {
            0% { transform: translate3d(8px, -4px, 0) rotate(1deg); }
            45% { transform: translate3d(-13px, 12px, 0) rotate(-1deg); }
            100% { transform: translate3d(7px, 5px, 0); }
          }

          @keyframes drift-c {
            0% { transform: translate3d(-7px, -8px, 0); }
            55% { transform: translate3d(10px, 9px, 0); }
            100% { transform: translate3d(-3px, 13px, 0); }
          }

          @media (max-width: 540px) {
            .learning-orbits__field { min-height: 560px; }
            .learning-orbits__orb { width: 122px; }
            .orb-3 { left: calc(50% - 61px); }
            .orb-6 { left: 9%; }
            .orb-7 { right: 9%; }
          }

          @media (prefers-reduced-motion: reduce) {
            .learning-orbits__orb { animation: none; }
          }
        `}</style>

        <button
          type="button"
          onClick={onClose}
          aria-label="Ana menüye dön"
          style={{
            position: 'absolute',
            top: 'max(16px, env(safe-area-inset-top))',
            left: 16,
            zIndex: 3,
            width: 42,
            height: 42,
            display: 'grid',
            placeItems: 'center',
            border: '1px solid rgba(244, 184, 47, 0.35)',
            borderRadius: '50%',
            color: '#f4b82f',
            background: '#0b0b0b',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={22} />
        </button>

        <h2 id="learning-orbits-title" className="learning-orbits__heading">
          How would you<br />like to learn<span className="learning-orbits__accent">?</span>
        </h2>
        <p
          style={{
            position: 'relative',
            zIndex: 2,
            margin: '6px auto 0',
            textAlign: 'center',
            fontSize: 12,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(244, 184, 47, 0.75)',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {categoryLabel}
        </p>

        <div className="learning-orbits__field">
          {learningMethods.map(({ label, Icon, className }) => (
            <button
              type="button"
              className={`learning-orbits__orb ${className}`}
              key={label}
              onClick={() => onSelect(label)}
              aria-label={`${label} seçeneğini aç`}
            >
              <span className="learning-orbits__content">
                <Icon className="learning-orbits__icon" aria-hidden="true" />
                <span>{label}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
