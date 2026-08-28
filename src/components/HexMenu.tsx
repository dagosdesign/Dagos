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
          border-radius: 0;
          clip-path: polygon(100.00% 50.00%, 98.35% 52.11%, 99.81% 54.36%, 97.99% 56.32%, 99.24% 58.68%, 97.25% 60.48%, 98.30% 62.94%, 96.16% 64.55%, 96.98% 67.10%, 94.72% 68.52%, 95.32% 71.13%, 92.93% 72.35%, 93.30% 75.00%, 90.82% 76.01%, 90.96% 78.68%, 88.40% 79.46%, 88.30% 82.14%, 85.68% 82.70%, 85.36% 85.36%, 82.70% 85.68%, 82.14% 88.30%, 79.46% 88.40%, 78.68% 90.96%, 76.01% 90.82%, 75.00% 93.30%, 72.35% 92.93%, 71.13% 95.32%, 68.52% 94.72%, 67.10% 96.98%, 64.55% 96.16%, 62.94% 98.30%, 60.48% 97.25%, 58.68% 99.24%, 56.32% 97.99%, 54.36% 99.81%, 52.11% 98.35%, 50.00% 100.00%, 47.89% 98.35%, 45.64% 99.81%, 43.68% 97.99%, 41.32% 99.24%, 39.52% 97.25%, 37.06% 98.30%, 35.45% 96.16%, 32.90% 96.98%, 31.48% 94.72%, 28.87% 95.32%, 27.65% 92.93%, 25.00% 93.30%, 23.99% 90.82%, 21.32% 90.96%, 20.54% 88.40%, 17.86% 88.30%, 17.30% 85.68%, 14.64% 85.36%, 14.32% 82.70%, 11.70% 82.14%, 11.60% 79.46%, 9.04% 78.68%, 9.18% 76.01%, 6.70% 75.00%, 7.07% 72.35%, 4.68% 71.13%, 5.28% 68.52%, 3.02% 67.10%, 3.84% 64.55%, 1.70% 62.94%, 2.75% 60.48%, 0.76% 58.68%, 2.01% 56.32%, 0.19% 54.36%, 1.65% 52.11%, 0.00% 50.00%, 1.65% 47.89%, 0.19% 45.64%, 2.01% 43.68%, 0.76% 41.32%, 2.75% 39.52%, 1.70% 37.06%, 3.84% 35.45%, 3.02% 32.90%, 5.28% 31.48%, 4.68% 28.87%, 7.07% 27.65%, 6.70% 25.00%, 9.18% 23.99%, 9.04% 21.32%, 11.60% 20.54%, 11.70% 17.86%, 14.32% 17.30%, 14.64% 14.64%, 17.30% 14.32%, 17.86% 11.70%, 20.54% 11.60%, 21.32% 9.04%, 23.99% 9.18%, 25.00% 6.70%, 27.65% 7.07%, 28.87% 4.68%, 31.48% 5.28%, 32.90% 3.02%, 35.45% 3.84%, 37.06% 1.70%, 39.52% 2.75%, 41.32% 0.76%, 43.68% 2.01%, 45.64% 0.19%, 47.89% 1.65%, 50.00% 0.00%, 52.11% 1.65%, 54.36% 0.19%, 56.32% 2.01%, 58.68% 0.76%, 60.48% 2.75%, 62.94% 1.70%, 64.55% 3.84%, 67.10% 3.02%, 68.52% 5.28%, 71.13% 4.68%, 72.35% 7.07%, 75.00% 6.70%, 76.01% 9.18%, 78.68% 9.04%, 79.46% 11.60%, 82.14% 11.70%, 82.70% 14.32%, 85.36% 14.64%, 85.68% 17.30%, 88.30% 17.86%, 88.40% 20.54%, 90.96% 21.32%, 90.82% 23.99%, 93.30% 25.00%, 92.93% 27.65%, 95.32% 28.87%, 94.72% 31.48%, 96.98% 32.90%, 96.16% 35.45%, 98.30% 37.06%, 97.25% 39.52%, 99.24% 41.32%, 97.99% 43.68%, 99.81% 45.64%, 98.35% 47.89%);
          animation: een-center-pulse 4s ease-in-out infinite;
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
