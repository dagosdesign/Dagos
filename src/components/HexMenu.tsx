import { FLASHCARD_CATEGORIES } from '../data/flashcards';

interface HexMenuProps {
  // Opens the learning-method (orbs) screen with the given word pool + display label.
  onPractice: (category: string, label: string) => void;
  onOpenGrammar: () => void;
  onOpenQuizHub: () => void;
}

// Satellite node centers as fractions of the field (also drives the SVG link endpoints
// so lines always connect to hex centers). Order matches `topics` / een-n1..n10.
const NODES: [number, number][] = [
  [0.50, 0.15], // LGS
  [0.20, 0.27], // YDT
  [0.80, 0.27], // YÖK-DİL
  [0.11, 0.46], // IELTS
  [0.89, 0.46], // YDS
  [0.13, 0.66], // GRAMMAR
  [0.87, 0.66], // ADJECTIVES
  [0.25, 0.85], // NOUNS
  [0.50, 0.92], // ADVERBS
  [0.75, 0.85], // IRREGULAR VERBS
];

const VB_W = 760;
const VB_H = 920;
const links = NODES.map(([fx, fy]) => [Math.round(fx * VB_W), Math.round(fy * VB_H)] as [number, number]);

export default function HexMenu({ onPractice, onOpenGrammar, onOpenQuizHub }: HexMenuProps) {
  const topics = [
    { label: 'LGS', className: 'een-n1', onClick: () => onPractice(FLASHCARD_CATEGORIES.EVERYDAY, 'LGS') },
    { label: 'YDT', className: 'een-n2', onClick: () => onPractice(FLASHCARD_CATEGORIES.ADVANCED, 'YDT') },
    { label: 'YÖK-DİL', className: 'een-n3', onClick: () => onPractice(FLASHCARD_CATEGORIES.ACADEMIC, 'YÖK-DİL') },
    { label: 'IELTS', className: 'een-n4', onClick: () => onPractice(FLASHCARD_CATEGORIES.ACADEMIC, 'IELTS') },
    { label: 'YDS', className: 'een-n5', onClick: () => onPractice(FLASHCARD_CATEGORIES.PHRASAL_VERBS, 'YDS') },
    { label: 'GRAMMAR', className: 'een-n6', onClick: onOpenGrammar },
    { label: 'ADJECTIVES', className: 'een-n7', onClick: () => onPractice(FLASHCARD_CATEGORIES.ADJECTIVES, 'Adjectives') },
    { label: 'NOUNS', className: 'een-n8', onClick: () => onPractice(FLASHCARD_CATEGORIES.NOUNS, 'Nouns') },
    { label: 'ADVERBS', className: 'een-n9', onClick: () => onPractice(FLASHCARD_CATEGORIES.ADVERBS, 'Adverbs') },
    { label: 'IRREGULAR VERBS', className: 'een-n10', onClick: () => onPractice(FLASHCARD_CATEGORIES.IRREGULAR_VERBS, 'Irregular Verbs') },
  ];

  return (
    <section className="een" aria-label="Genel İngilizce konu ağı">
      <style>{`
        .een {
          --gold: #f4b82f;
          --gold-bright: #ffd66b;
          position: relative;
          width: 100%;
          height: 100%;
          max-width: 760px;
          margin: 0 auto;
          background: transparent;
          color: #f7f7f7;
          isolation: isolate;
        }
        .een-field {
          position: relative;
          width: 100%;
          height: 100%;
        }
        .een-lines, .een-waves {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        .een-waves { opacity: .55; }
        .een-wave {
          fill: none;
          stroke: var(--gold);
          stroke-width: .8;
          stroke-dasharray: 3 12;
          animation: een-wave-flow 14s linear infinite;
        }
        .een-wave:nth-child(2) { opacity: .55; animation-duration: 18s; }
        .een-wave:nth-child(3) { opacity: .3; animation-duration: 22s; }
        .een-link {
          stroke: var(--gold);
          stroke-width: 2;
          opacity: .72;
          stroke-dasharray: 10 8;
          animation: een-energy-flow 5s linear infinite;
        }
        .een-dot {
          fill: var(--gold-bright);
          filter: drop-shadow(0 0 7px var(--gold));
        }
        .een-hex {
          position: absolute;
          display: grid;
          place-items: center;
          width: clamp(96px, 25vw, 150px);
          aspect-ratio: 1.12;
          padding: 14px;
          border: 0;
          transform: translate(-50%, -50%);
          clip-path: polygon(25% 2%, 75% 2%, 100% 50%, 75% 98%, 25% 98%, 0 50%);
          background: var(--gold);
          color: #f7f7f7;
          font: inherit;
          font-size: clamp(0.72rem, 3vw, 0.92rem);
          cursor: pointer;
          filter: drop-shadow(0 0 12px rgba(244,184,47,.38));
          animation: een-breathe 4.8s ease-in-out infinite;
        }
        .een-hex::before {
          content: "";
          position: absolute;
          inset: 3px;
          clip-path: inherit;
          background: #050403;
          z-index: -1;
        }
        .een-hex span {
          max-width: 100%;
          text-align: center;
          font-weight: 500;
          line-height: 1.15;
        }
        .een-hex:hover {
          background: var(--gold-bright);
          filter: drop-shadow(0 0 22px rgba(244,184,47,.75));
        }
        .een-hex:focus-visible { outline: 3px solid #fff; outline-offset: 5px; }

        .een-center {
          left: 50%;
          top: 50%;
          width: clamp(150px, 42vw, 236px);
          animation: een-center-pulse 4s ease-in-out infinite;
        }
        .een-center span { font-size: clamp(1.15rem, 5.5vw, 1.55rem); }
        .een-center strong { color: var(--gold); font-weight: 500; }

        .een-n1  { left: 50%;  top: 15%; animation-delay: -.6s; }
        .een-n2  { left: 20%;  top: 27%; animation-delay: -1.5s; }
        .een-n3  { left: 80%;  top: 27%; animation-delay: -2.2s; }
        .een-n4  { left: 11%;  top: 46%; animation-delay: -.9s; }
        .een-n5  { left: 89%;  top: 46%; animation-delay: -2.8s; }
        .een-n6  { left: 13%;  top: 66%; animation-delay: -1.8s; }
        .een-n7  { left: 87%;  top: 66%; animation-delay: -3.4s; }
        .een-n8  { left: 25%;  top: 85%; animation-delay: -2.5s; }
        .een-n9  { left: 50%;  top: 92%; animation-delay: -1.1s; }
        .een-n10 { left: 75%;  top: 85%; animation-delay: -3s; }

        @keyframes een-energy-flow { to { stroke-dashoffset: -72; } }
        @keyframes een-wave-flow { to { stroke-dashoffset: -120; } }
        @keyframes een-breathe {
          0%,100% { transform: translate(-50%, calc(-50% - 3px)) scale(.985); }
          50%     { transform: translate(-50%, calc(-50% + 5px)) scale(1.015); }
        }
        @keyframes een-center-pulse {
          0%,100% { transform: translate(-50%,-50%) scale(.99); filter: drop-shadow(0 0 13px rgba(244,184,47,.4)); }
          50%     { transform: translate(-50%,-50%) scale(1.02); filter: drop-shadow(0 0 25px rgba(244,184,47,.68)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .een-hex { animation: none; transform: translate(-50%, -50%); }
          .een-center { animation: none; transform: translate(-50%, -50%); }
          .een-wave, .een-link, .een-dot { animation: none; }
        }
      `}</style>

      <div className="een-field">
        <svg className="een-waves" viewBox="0 0 760 920" preserveAspectRatio="none" aria-hidden="true">
          <path className="een-wave" d="M-30 80 C150 0 250 155 405 82 S650 10 810 100" />
          <path className="een-wave" d="M-40 105 C130 25 270 180 415 105 S650 40 800 125" />
          <path className="een-wave" d="M-30 825 C140 740 270 900 410 820 S650 760 805 850" />
        </svg>

        <svg className="een-lines" viewBox="0 0 760 920" preserveAspectRatio="none" aria-hidden="true">
          {links.map(([x, y], index) => (
            <g key={`${x}-${y}`}>
              <line className="een-link" x1="380" y1="460" x2={x} y2={y} />
              <circle className="een-dot" r="5">
                <animateMotion
                  dur={`${4.8 + (index % 5) * 0.35}s`}
                  begin={`-${index * 0.45}s`}
                  repeatCount="indefinite"
                  path={`M380 460 L${x} ${y}`}
                />
              </circle>
            </g>
          ))}
        </svg>

        <button
          type="button"
          className="een-hex een-center"
          onClick={onOpenQuizHub}
          aria-label="General English"
        >
          <span><strong>GENERAL</strong><br />ENGLISH</span>
        </button>

        {topics.map((topic) => (
          <button
            type="button"
            key={topic.label}
            className={`een-hex ${topic.className}`}
            onClick={topic.onClick}
            aria-label={topic.label}
          >
            <span>{topic.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
