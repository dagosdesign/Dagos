import { FLASHCARD_CATEGORIES } from '../data/flashcards';

interface HexMenuProps {
  // Opens the learning-method (orbs) screen with the given word pool + display label.
  onPractice: (category: string, label: string) => void;
  onOpenGrammar: () => void;
  onOpenQuizHub: () => void;
  onOpenLgs: () => void;
  onOpenConnectors: () => void;
}

// Satellite node centers as fractions of the field (also drives the SVG link endpoints
// so lines always connect to hex centers). Order matches `topics` / een-n1..n12 (saat düzeni).
const NODES: [number, number][] = [
  [0.50, 0.145],  // LGS (saat 12)
  [0.735, 0.21], // YÖK-DİL
  [0.855, 0.355], // YDS
  [0.88, 0.51],  // ADJECTIVES
  [0.855, 0.665], // IRREGULAR VERBS
  [0.735, 0.81], // PHRASAL VERBS
  [0.50, 0.875],  // ADVERBS (saat 6)
  [0.265, 0.81], // NOUNS
  [0.145, 0.665], // GRAMMAR
  [0.12, 0.51],  // CONNECTORS
  [0.145, 0.355], // YDT
  [0.265, 0.21], // IELTS
];

const VB_W = 760;
const VB_H = 920;
const links = NODES.map(([fx, fy]) => [Math.round(fx * VB_W), Math.round(fy * VB_H)] as [number, number]);

export default function HexMenu({ onPractice, onOpenGrammar, onOpenQuizHub, onOpenLgs, onOpenConnectors }: HexMenuProps) {
  const topics = [
    { label: 'LGS', className: 'een-n1', onClick: onOpenLgs },
    { label: 'YÖK-DİL', className: 'een-n2', onClick: () => onPractice(FLASHCARD_CATEGORIES.ACADEMIC, 'YÖK-DİL') },
    { label: 'YDS', className: 'een-n3', onClick: () => onPractice(FLASHCARD_CATEGORIES.YDS, 'YDS') },
    { label: 'ADJECTIVES', className: 'een-n4', onClick: () => onPractice(FLASHCARD_CATEGORIES.ADJECTIVES, 'Adjectives') },
    { label: 'IRREGULAR VERBS', className: 'een-n5', onClick: () => onPractice(FLASHCARD_CATEGORIES.IRREGULAR_VERBS, 'Irregular Verbs') },
    { label: 'PHRASAL VERBS', className: 'een-n6', onClick: () => onPractice(FLASHCARD_CATEGORIES.PHRASAL_VERBS, 'Phrasal Verbs') },
    { label: 'ADVERBS', className: 'een-n7', onClick: () => onPractice(FLASHCARD_CATEGORIES.ADVERBS, 'Adverbs') },
    { label: 'NOUNS', className: 'een-n8', onClick: () => onPractice(FLASHCARD_CATEGORIES.NOUNS, 'Nouns') },
    { label: 'GRAMMAR', className: 'een-n9', onClick: onOpenGrammar },
    { label: 'CONNECTORS', className: 'een-n10', onClick: onOpenConnectors },
    { label: 'YDT', className: 'een-n11', onClick: () => onPractice(FLASHCARD_CATEGORIES.YDT, 'YDT') },
    { label: 'IELTS', className: 'een-n12', onClick: () => onPractice(FLASHCARD_CATEGORIES.ACADEMIC, 'IELTS') },
  ];

  return (
    <section className="een" aria-label="Genel İngilizce konu ağı">
      <style>{`
        .een {
          --gold: #f5a516;
          --gold-bright: #ffce4f;
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
          stroke: url(#een-link-grad);
          stroke-width: 6;
          stroke-linecap: round;
          opacity: .95;
          filter: drop-shadow(0 0 4px rgba(245,157,10,.6));
        }
        .een-joint {
          fill: #fff7df;
          filter: drop-shadow(0 0 6px var(--gold-bright)) drop-shadow(0 0 14px var(--gold));
        }
        .een-dot {
          fill: var(--gold-bright);
          filter: drop-shadow(0 0 7px var(--gold));
        }
        .een-hex {
          position: absolute;
          display: grid;
          place-items: center;
          width: clamp(74px, 19.5vw, 130px);
          aspect-ratio: 1;
          padding: 12px;
          border: 0;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          background:
            linear-gradient(135deg, #ffe27a 0%, #ffc63c 22%, #f59d0a 50%, #d97b00 74%, #8a4d00 100%);
          color: #f7f7f7;
          font: inherit;
          font-size: clamp(0.62rem, 2.6vw, 0.86rem);
          cursor: pointer;
          box-shadow:
            0 0 14px rgba(255,176,32,.55),
            0 0 34px rgba(245,157,10,.3),
            inset 0 0 6px rgba(255,220,120,.8);
          animation: een-breathe 4.8s ease-in-out infinite;
        }
        .een-hex::before {
          content: "";
          position: absolute;
          inset: clamp(3px, 0.8vw, 4.5px);
          border-radius: 50%;
          background: radial-gradient(circle at 50% 38%, #16120a 0%, #050403 68%);
          box-shadow:
            inset 0 0 10px rgba(244,184,47,.35),
            0 0 4px rgba(255,198,60,.8);
          z-index: 0;
        }
        .een-hex > span { position: relative; z-index: 1; }
        .een-hex--tight { font-size: clamp(0.54rem, 2.35vw, 0.78rem); letter-spacing: -0.02em; }
        .een-hex span {
          max-width: 100%;
          text-align: center;
          font-weight: 500;
          line-height: 1.15;
        }
        .een-hex:hover {
          box-shadow:
            0 0 20px rgba(255,214,107,.8),
            0 0 48px rgba(244,184,47,.45),
            inset 0 0 8px rgba(255,244,200,1);
        }
        .een-hex:focus-visible { outline: 3px solid #fff; outline-offset: 5px; }

        .een-center {
          left: 50%;
          top: 50%;
          width: clamp(140px, 38vw, 220px);
          animation: een-center-pulse 4s ease-in-out infinite;
        }
        .een-center {
          border-radius: 50%;
          background:
            radial-gradient(circle, #e29812 55%, #d17f06 66%, #bd6a01 80%, #954e00 92%, #6b3a00 100%);
          box-shadow:
            0 0 18px rgba(209,127,6,.65),
            0 0 46px rgba(189,106,1,.42),
            0 0 90px rgba(189,106,1,.22),
            inset 0 0 8px rgba(226,152,18,.75);
        }
        .een-center::before {
          inset: clamp(7px, 1.9vw, 10px);
        }
        .een-center span { font-size: clamp(1.15rem, 5.5vw, 1.55rem); }
        .een-center strong { color: var(--gold); font-weight: 500; }

        .een-n1  { left: 50%;   top: 14.5%;   animation-delay: -.6s; }
        .een-n2  { left: 73.5%; top: 21%; animation-delay: -1.5s; }
        .een-n3  { left: 85.5%; top: 35.5%;   animation-delay: -2.2s; }
        .een-n4  { left: 88%;   top: 51%;   animation-delay: -.9s; }
        .een-n5  { left: 85.5%; top: 66.5%;   animation-delay: -2.8s; }
        .een-n6  { left: 73.5%; top: 81%; animation-delay: -1.8s; }
        .een-n7  { left: 50%;   top: 87.5%;   animation-delay: -3.4s; }
        .een-n8  { left: 26.5%; top: 81%; animation-delay: -2.5s; }
        .een-n9  { left: 14.5%; top: 66.5%;   animation-delay: -1.1s; }
        .een-n10 { left: 12%;   top: 51%;   animation-delay: -3s; }
        .een-n11 { left: 14.5%; top: 35.5%;   animation-delay: -2s; }
        .een-n12 { left: 26.5%; top: 21%; animation-delay: -.3s; }

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
          <defs>
            <linearGradient id="een-link-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="760" y2="920">
              <stop offset="0" stopColor="#ffd24d" />
              <stop offset="1" stopColor="#c96f00" />
            </linearGradient>
          </defs>
          {links.map(([x, y], index) => {
            // Bright joints sit where the line meets each circle's rim.
            const dx = x - 380, dy = y - 460;
            const len = Math.hypot(dx, dy);
            const cR = 108, nR = 55; // approx center / node radii in viewBox units
            const jc: [number, number] = [380 + (dx / len) * cR, 460 + (dy / len) * cR];
            const jn: [number, number] = [x - (dx / len) * nR, y - (dy / len) * nR];
            return (
              <g key={`${x}-${y}`}>
                <line className="een-link" x1="380" y1="460" x2={x} y2={y} />
                <circle className="een-joint" cx={jc[0]} cy={jc[1]} r="6" />
                <circle className="een-joint" cx={jn[0]} cy={jn[1]} r="5" />
                <circle className="een-dot" r="5">
                  <animateMotion
                    dur={`${4.8 + (index % 5) * 0.35}s`}
                    begin={`-${index * 0.45}s`}
                    repeatCount="indefinite"
                    path={`M380 460 L${x} ${y}`}
                  />
                </circle>
              </g>
            );
          })}
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
            className={`een-hex ${topic.className}${Math.max(...topic.label.split(' ').map(w => w.length)) >= 10 ? ' een-hex--tight' : ''}`}
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
