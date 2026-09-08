import { Delete, CornerDownLeft } from 'lucide-react';

/* The one on-screen keyboard Lexistencehub uses wherever an English word is
   typed. QWERTY layout, rounded-square gold keys, sized for a thumb — so a
   player never meets the phone's system keyboard inside a game. */

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map(r => r.split(''));

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
}

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
}: GameKeyboardProps) {
  const controls = !!onDelete || !!onEnter;
  return (
    <div className="space-y-2.5">
      <div className="space-y-1.5">
        {ROWS.map((row, r) => (
          <div key={r} className="flex justify-center gap-1.5">
            {row.map(ch => {
              const tone = toneOf ? toneOf(ch) : 'idle';
              const off = disabled || disabledKeys?.has(ch) || tone === 'wrong';
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => onKey(ch)}
                  disabled={off}
                  className={`flex-1 min-w-0 max-w-[46px] h-[46px] sm:h-[50px] rounded-xl border text-[15px] sm:text-base font-bold transition-all ${
                    off && tone === 'idle' ? 'border-white/10 text-white/30 bg-white/[0.02]' : TONE[tone]
                  }`}
                  style={tone === 'correct' ? { boxShadow: '0 0 10px rgba(227,181,83,0.35)' } : undefined}
                >
                  {ch}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {controls && (
        <div className="flex gap-2">
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
