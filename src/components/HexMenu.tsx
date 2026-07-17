import { CATEGORIES } from '../data/staticQuestions';

interface HexMenuProps {
  onQuizCategory: (category: string) => void;
  onOpenGrammar: () => void;
  onOpenCards: () => void;
  onOpenProgress: () => void;
  onOpenQuizHub: () => void;
}

// Link endpoints (center is 380,460) for the 8 satellite nodes, same order as `topics`.
// Bottom row mirrors the top row for a balanced layout.
const links: [number, number][] = [
  [380, 143],
  [162, 243],
  [598, 243],
  [72, 411],
  [688, 411],
  [162, 677],
  [380, 777],
  [598, 677],
];

export default function HexMenu({ onQuizCategory, onOpenGrammar, onOpenCards, onOpenProgress, onOpenQuizHub }: HexMenuProps) {
  const topics = [
    { label: 'Grammar', className: 'een-n1', onClick: onOpenGrammar },
    { label: 'Phrasal Verbs', className: 'een-n2', onClick: () => onQuizCategory(CATEGORIES.PHRASAL_VERBS) },
    { label: 'Everyday Words', className: 'een-n3', onClick: () => onQuizCategory(CATEGORIES.EVERYDAY) },
    { label: 'Academic & IELTS', className: 'een-n4', onClick: () => onQuizCategory(CATEGORIES.ACADEMIC) },
    { label: 'Advanced & GRE/SAT', className: 'een-n5', onClick: () => onQuizCategory(CATEGORIES.ADVANCED) },
    { label: 'Business English', className: 'een-n8', onClick: () => onQuizCategory(CATEGORIES.BUSINESS) },
    { label: 'Kartlar', className: 'een-n9', onClick: onOpenCards },
    { label: 'İlerleme', className: 'een-n10', onClick: onOpenProgress },
  ];

  return (
    <section className="een" aria-label="Genel İngilizce konu ağı">
      <style>{`
        .een {
          --gold: #f4b82f;
          --gold-bright: #ffd66b;
          position: relative;
          width: 100%;
          overflow: hidden;
          background: transparent;
          color: #f7f7f7;
          isolation: isolate;
        }
        .een-field {
          position: relative;
          width: min(100%, 760px);
          height: 880px;
          margin: 0 auto;
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
          width: 142px;
          aspect-ratio: 1.12;
          padding: 18px;
          border: 0;
          clip-path: polygon(25% 2%, 75% 2%, 100% 50%, 75% 98%, 25% 98%, 0 50%);
          background: var(--gold);
          color: #f7f7f7;
          font: inherit;
          font-size: .88rem;
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
          line-height: 1.2;
        }
        .een-hex:hover {
          background: var(--gold-bright);
          filter: drop-shadow(0 0 22px rgba(244,184,47,.75));
        }
        .een-hex:focus-visible { outline: 3px solid #fff; outline-offset: 5px; }
        .een-center {
          left: calc(50% - 116px);
          top: 344px;
          width: 232px;
          animation: een-center-pulse 4s ease-in-out infinite;
        }
        .een-center span { font-size: 1.55rem; }
        .een-center strong { color: var(--gold); font-weight: 500; }
        .een-n1 { left: calc(50% - 71px); top: 80px; animation-delay: -.6s; }
        .een-n2 { left: 12%; top: 180px; animation-delay: -1.5s; }
        .een-n3 { right: 12%; top: 180px; animation-delay: -2.2s; }
        .een-n4 { left: 1%; top: 348px; animation-delay: -.9s; }
        .een-n5 { right: 1%; top: 348px; animation-delay: -2.8s; }
        .een-n8 { left: 12%; top: 614px; animation-delay: -2.5s; }
        .een-n9 { left: calc(50% - 71px); top: 714px; animation-delay: -1.1s; }
        .een-n10 { right: 12%; top: 614px; animation-delay: -3s; }
        @keyframes een-energy-flow { to { stroke-dashoffset: -72; } }
        @keyframes een-wave-flow { to { stroke-dashoffset: -120; } }
        @keyframes een-breathe {
          0%,100% { transform: translate3d(0,-3px,0) scale(.985); }
          50% { transform: translate3d(0,5px,0) scale(1.015); }
        }
        @keyframes een-center-pulse {
          0%,100% { transform: scale(.99); filter: drop-shadow(0 0 13px rgba(244,184,47,.4)); }
          50% { transform: scale(1.02); filter: drop-shadow(0 0 25px rgba(244,184,47,.68)); }
        }
        @media (max-width: 540px) {
          .een-field { height: 760px; }
          .een-hex { width: 104px; padding: 12px; font-size: .72rem; }
          .een-center { left: calc(50% - 86px); top: 318px; width: 172px; }
          .een-center span { font-size: 1.15rem; }
          .een-n1 { left: calc(50% - 52px); top: 66px; }
          .een-n2 { left: 5%; top: 158px; }
          .een-n3 { right: 5%; top: 158px; }
          .een-n4 { left: 0; top: 312px; }
          .een-n5 { right: 0; top: 312px; }
          .een-n8 { left: 5%; top: 539px; }
          .een-n9 { left: calc(50% - 52px); top: 631px; }
          .een-n10 { right: 5%; top: 539px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .een * { animation: none !important; }
        }
      `}</style>

      <div className="een-field">
        <svg className="een-waves" viewBox="0 0 760 880" preserveAspectRatio="none" aria-hidden="true">
          <path className="een-wave" d="M-30 80 C150 0 250 155 405 82 S650 10 810 100" />
          <path className="een-wave" d="M-40 105 C130 25 270 180 415 105 S650 40 800 125" />
          <path className="een-wave" d="M-30 785 C140 700 270 860 410 780 S650 720 805 810" />
        </svg>

        <svg className="een-lines" viewBox="0 0 760 880" preserveAspectRatio="none" aria-hidden="true">
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
          aria-label="Genel İngilizce"
        >
          <span><strong>GENEL</strong><br />İNGİLİZCE</span>
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
