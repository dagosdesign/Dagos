import { Delete, CornerDownLeft, ArrowBigUp, ArrowBigUpDash } from 'lucide-react';

/* The one on-screen keyboard Lexistencehub uses wherever a word is typed:
   the Turkish Q layout, rounded-square gold keys, sized for a thumb — so a
   player never meets the phone's system keyboard inside a game.

   Answers are English words, and src/lib/answerText.ts folds the Turkish
   letters onto their English neighbours before comparing, so reaching for İ
   or Ş by habit never costs a correct answer. */

const ROWS = ['QWERTYUIOPĞÜ', 'ASDFGHJKLŞİ', 'ZXCVBNMÖÇ'].map(r => r.split(''));

/* The letters that cannot appear in an English word. WORDLOCK's letter mode
   greys them out rather than hiding them, so the layout never shifts. */
const TURKISH_ONLY = new Set(['Ğ', 'Ü', 'Ş', 'İ', 'Ö', 'Ç']);

export type KeyTone = 'idle' | 'correct' | 'wrong' | 'hint';

interface GameKeyboardProps {
  onKey: (ch: string) => void;
  /** Shown when set: DEL and the confirm key sit under the letters. */
  onDelete?: () => void;
  onEnter?: () => void;
  enterLabel?: string;
  /** Disables the confirm key without disabling the whole keyboard. */
  enterDisabled?: boolean;
  /** Per-letter colouring, e.g. WORDLOCK marking letters already tried. */
  toneOf?: (ch: string) => KeyTone;
  disabledKeys?: Set<string>;
  disabled?: boolean;
  /** Greys out the Turkish-only keys — for picking letters of an English word. */
  latinOnly?: boolean;
  /** Sentence typing (AI LEX): a punctuation row under the letters… */
  punctuation?: string[];
  /** …a space bar… */
  onSpace?: () => void;
  /** …and a case key: abc (lower case), Abc (next letter capital), ABC (caps lock). */
  onShift?: () => void;
  caseMode?: CaseMode;
  /** Letter keys show - and type - lower case. Games leave this off. */
  lowercase?: boolean;
  /** A smaller, quieter layout for chat (AI LEX); games use the full size. */
  compact?: boolean;
}

export type CaseMode = 'lower' | 'once' | 'caps';
const CASE_LABEL: Record<CaseMode, string> = { lower: 'abc', once: 'Abc', caps: 'ABC' };

const TONE: Record<KeyTone, string> = {
  correct: 'border-[#e3b553] text-[#e3b553] bg-[#e3b553]/12',
  wrong: 'border-white/8 text-white/20 bg-white/[0.02]',
  hint: 'border-[#e3b553]/30 text-[#e3b553]/60 bg-[#e3b553]/[0.05]',
  idle: 'border-[#e3b553]/40 text-white bg-[#0e0d0c] hover:border-[#e3b553] active:bg-[#e3b553]/10 cursor-pointer',
};

export default function GameKeyboard({
  onKey,
  onDelete,
  onEnter,
  enterLabel = 'ENTER',
  enterDisabled = false,
  toneOf,
  disabledKeys,
  disabled = false,
  latinOnly = false,
  punctuation,
  onSpace,
  onShift,
  caseMode = 'lower',
  lowercase = false,
  compact = false,
}: GameKeyboardProps) {
  const controls = !!onDelete || !!onEnter || !!onSpace || !!onShift;

  /* Compact: a small, quiet keyboard for chat screens. Three letter rows, then
     one bottom row - case key, punctuation, SPACE in the middle, DEL on the right. */
  if (compact) {
    const marks = punctuation ?? [];
    const half = Math.ceil(marks.length / 2);
    const key = 'min-w-0 h-[34px] rounded-lg border border-white/[0.09] bg-white/[0.03] text-white text-[13px] font-medium transition-colors hover:border-[#e3b553]/50 active:bg-[#e3b553]/15 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';
    const mark = (p: string) => (
      <button key={p} type="button" onClick={() => onKey(p)} disabled={disabled} aria-label={p} className={`flex-1 max-w-[34px] text-[15px] ${key}`}>
        {p}
      </button>
    );
    return (
      <div className="space-y-1">
        {ROWS.map((row, r) => (
          <div key={r} className="flex justify-center gap-[3px]">
            {row.map(ch => {
              const label = lowercase ? ch.toLocaleLowerCase('tr') : ch;
              return (
                <button key={ch} type="button" onClick={() => onKey(label)} disabled={disabled} className={`flex-1 max-w-[34px] ${key}`}>
                  {label}
                </button>
              );
            })}
          </div>
        ))}
        <div className="flex justify-center gap-[3px]">
          {onShift && (
            <button
              type="button"
              onClick={onShift}
              disabled={disabled}
              aria-label={`Letter case: ${CASE_LABEL[caseMode]}`}
              aria-pressed={caseMode !== 'lower'}
              className={`flex-[1.4] ${key} text-[11px] font-semibold ${
                caseMode === 'caps'
                  ? '!border-[#e3b553] !bg-[#e3b553] !text-[#0a0a0b]'
                  : caseMode === 'once'
                    ? '!border-[#e3b553]/70 !text-[#e3b553]'
                    : '!text-white/70'
              }`}
            >
              {CASE_LABEL[caseMode]}
            </button>
          )}
          {marks.slice(0, half).map(mark)}
          {onSpace && (
            <button type="button" onClick={onSpace} disabled={disabled} aria-label="Space" className={`flex-[4] ${key} text-[10px] tracking-[0.2em] !text-white/45`}>
              SPACE
            </button>
          )}
          {marks.slice(half).map(mark)}
          {onDelete && (
            <button type="button" onClick={onDelete} disabled={disabled} aria-label="Delete" className={`flex-[1.4] flex items-center justify-center ${key} !text-white/70`}>
              <Delete className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="space-y-1.5">
        {ROWS.map((row, r) => (
          <div key={r} className="flex justify-center gap-1">
            {row.map(ch => {
              const blocked = latinOnly && TURKISH_ONLY.has(ch);
              const tone = !blocked && toneOf ? toneOf(ch) : 'idle';
              const off = disabled || blocked || disabledKeys?.has(ch) || tone === 'wrong';
              // Turkish Q in lower case: I -> ı and İ -> i, as on a Turkish keyboard.
              const label = lowercase ? ch.toLocaleLowerCase('tr') : ch;
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => onKey(label)}
                  disabled={off}
                  className={`flex-1 min-w-0 max-w-[44px] h-[46px] sm:h-[50px] rounded-xl border text-[15px] sm:text-base font-bold transition-all ${
                    off && tone === 'idle' ? 'border-white/10 text-white/25 bg-white/[0.02]' : TONE[tone]
                  }`}
                  style={tone === 'correct' ? { boxShadow: '0 0 10px rgba(227,181,83,0.35)' } : undefined}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ))}
        {punctuation && punctuation.length > 0 && (
          <div className="flex justify-center gap-1">
            {punctuation.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => onKey(p)}
                disabled={disabled}
                aria-label={p}
                className={`flex-1 min-w-0 max-w-[44px] h-[46px] sm:h-[50px] rounded-xl border text-[17px] font-bold transition-all disabled:opacity-40 ${TONE.idle}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {controls && (
        <div className="flex gap-2">
          {onShift && (
            <button
              type="button"
              onClick={onShift}
              disabled={disabled}
              aria-label={`Letter case: ${CASE_LABEL[caseMode]}`}
              aria-pressed={caseMode !== 'lower'}
              className={`flex-[1.3] flex items-center justify-center gap-1 rounded-2xl py-3 border text-[12px] font-bold tracking-[0.04em] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                caseMode === 'caps'
                  ? 'border-[#e3b553] bg-[#e3b553] text-[#0a0a0b]'
                  : caseMode === 'once'
                    ? 'border-[#e3b553] bg-[#e3b553]/15 text-[#e3b553]'
                    : 'border-[#e3b553]/40 text-[#e3b553] hover:bg-[#e3b553]/10'
              }`}
            >
              {caseMode === 'caps' ? <ArrowBigUpDash className="w-4 h-4" /> : <ArrowBigUp className="w-4 h-4" />}
              {CASE_LABEL[caseMode]}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={disabled}
              className="flex-1 flex items-center justify-center gap-1.5 border border-[#e3b553]/40 text-[#e3b553] rounded-2xl py-3 text-[11px] font-bold tracking-[0.1em] hover:bg-[#e3b553]/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Delete className="w-4 h-4" /> DEL
            </button>
          )}
          {onSpace && (
            <button
              type="button"
              onClick={onSpace}
              disabled={disabled}
              className="flex-[2.4] flex items-center justify-center border border-[#e3b553]/40 text-white bg-[#0e0d0c] rounded-2xl py-3 text-[11px] font-bold tracking-[0.18em] hover:border-[#e3b553] active:bg-[#e3b553]/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              SPACE
            </button>
          )}
          {onEnter && (
            <button
              type="button"
              onClick={onEnter}
              disabled={disabled || enterDisabled}
              className="flex-[1.8] flex items-center justify-center gap-1.5 bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] rounded-2xl py-3 text-[11px] font-bold tracking-[0.1em] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CornerDownLeft className="w-4 h-4" /> {enterLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* The typed answer, shown above the keyboard in place of a text input. */
export function AnswerDisplay({
  value,
  placeholder = 'Use the keyboard below',
}: {
  value: string;
  placeholder?: string;
}) {
  return (
    <div className="bg-white/[0.03] border border-[#e3b553]/35 rounded-2xl px-4 py-3 min-h-[52px] flex items-center justify-center">
      {value ? (
        <span className="text-xl font-bold tracking-[0.22em] text-white uppercase break-all text-center">
          {value}
        </span>
      ) : (
        <span className="text-xs tracking-[0.1em] text-white/25">{placeholder}</span>
      )}
    </div>
  );
}
