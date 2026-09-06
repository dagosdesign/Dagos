import { PointerEvent as ReactPointerEvent, useCallback, useMemo, useRef, useState } from 'react';
import { ChevronLeft, BarChart3, GripVertical, RotateCcw, Check, X } from 'lucide-react';
import { FLASHCARDS } from '../data/flashcards';

/* GOLDEN MATCH — slide the English cards onto the Turkish rows. Nothing is
   marked right or wrong until CHECK ANSWERS is pressed. No timer, no lives. */

const PAIRS = 10;

interface Pair {
  id: string;
  turkish: string;
  english: string;
}

interface GoldenMatchScreenProps {
  onExit: () => void;
  recordQuizXp: (correctCount: number) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Ten unambiguous pairs: unique Turkish meanings, unique English words. */
function buildPairs(): Pair[] {
  const out: Pair[] = [];
  const seenTr = new Set<string>();
  const seenEn = new Set<string>();
  for (const card of shuffle(FLASHCARDS)) {
    if (out.length >= PAIRS) break;
    const en = card.word.trim();
    const tr = (card.turkishMeaning || '').split(',')[0].trim();
    if (!/^[a-zA-Z][a-zA-Z ]{2,13}$/.test(en)) continue;
    if (!tr || tr.length > 22) continue;
    const ek = en.toLowerCase();
    const tk = tr.toLowerCase();
    if (seenEn.has(ek) || seenTr.has(tk)) continue;
    seenEn.add(ek);
    seenTr.add(tk);
    out.push({ id: `${ek}-${out.length}`, turkish: tr, english: en });
  }
  return out;
}

export default function GoldenMatchScreen({ onExit, recordQuizXp }: GoldenMatchScreenProps) {
  const [round, setRound] = useState(0);
  const pairs = useMemo(() => buildPairs(), [round]);
  const [order, setOrder] = useState<string[]>(() => []);
  const [matches, setMatches] = useState<Record<string, string | null>>({});
  const [checked, setChecked] = useState(false);
  const [selected, setSelected] = useState<string | null>(null); // tap-to-place
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; w: number } | null>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);

  // (Re)build the shuffled English order whenever a new round starts.
  useMemo(() => {
    setOrder(shuffle(pairs.map(p => p.id)));
    setMatches({});
    setChecked(false);
    setSelected(null);
  }, [pairs]);

  const byId = useMemo(() => {
    const m: Record<string, Pair> = {};
    pairs.forEach(p => (m[p.id] = p));
    return m;
  }, [pairs]);

  const placedIds = new Set(Object.values(matches).filter(Boolean) as string[]);
  const pool = order.filter(id => !placedIds.has(id));
  const filled = pairs.filter(p => matches[p.id]).length;
  const allFilled = filled === pairs.length;

  /* ---- placement: a card lives in exactly one place ---- */
  const place = useCallback(
    (cardId: string, rowId: string) => {
      if (checked) return;
      setMatches(prev => {
        const next = { ...prev };
        for (const k of Object.keys(next)) if (next[k] === cardId) next[k] = null; // leave old row
        next[rowId] = cardId; // any previous occupant returns to the pool
        return next;
      });
      setSelected(null);
    },
    [checked]
  );

  const unplace = useCallback(
    (rowId: string) => {
      if (checked) return;
      setMatches(prev => ({ ...prev, [rowId]: null }));
    },
    [checked]
  );

  /* ---- pointer drag: one implementation for mouse and touch ---- */
  const onPointerDown = (e: ReactPointerEvent, cardId: string) => {
    if (checked) return;
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    dragRef.current = { id: cardId, dx: e.clientX - r.left, dy: e.clientY - r.top };
    el.setPointerCapture(e.pointerId);
    setDrag({ id: cardId, x: r.left, y: r.top, w: r.width });
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!dragRef.current) return;
    e.preventDefault();
    setDrag(d =>
      d ? { ...d, x: e.clientX - dragRef.current!.dx, y: e.clientY - dragRef.current!.dy } : d
    );
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    const info = dragRef.current;
    dragRef.current = null;
    setDrag(null);
    if (!info) return;
    const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const zone = target?.closest('[data-row]') as HTMLElement | null;
    if (zone?.dataset.row) place(info.id, zone.dataset.row);
    else {
      // dropped outside a row: send it back to the pool
      setMatches(prev => {
        const next = { ...prev };
        for (const k of Object.keys(next)) if (next[k] === info.id) next[k] = null;
        return next;
      });
    }
  };

  const check = () => {
    if (!allFilled || checked) return;
    setChecked(true);
    const correct = pairs.filter(p => matches[p.id] === p.id).length;
    recordQuizXp(correct);
  };

  const clearAll = () => {
    if (checked) return;
    setMatches({});
    setSelected(null);
  };

  const score = pairs.filter(p => matches[p.id] === p.id).length;

  return (
    <div className="space-y-4 pb-4 select-none">
      <TopBar onExit={onExit} />

      <div className="text-center space-y-1">
        <h1 className="text-3xl font-bold tracking-[0.1em]">
          <span className="text-[#e3b553]">GOLDEN</span> <span className="text-white">MATCH</span>
        </h1>
        <p className="text-[10px] tracking-[0.28em] text-white/45">MATCH THE WORDS</p>
      </div>

      {checked && (
        <div className="bg-white/[0.02] border border-[#e3b553]/30 rounded-2xl py-4 text-center">
          <p className="text-[10px] tracking-[0.2em] text-white/45">SCORE</p>
          <p className="text-3xl font-serif text-[#e3b553]">
            {score} / {pairs.length}
          </p>
        </div>
      )}

      {/* Column headers */}
      <div className="flex gap-2 px-1">
        <p className="flex-[1.75] text-[10px] tracking-[0.2em] text-white/40">TÜRKÇE</p>
        <p className="flex-1 text-[10px] tracking-[0.2em] text-white/40">ENGLISH</p>
      </div>

      <div className="flex gap-2 items-start">
        {/* Turkish rows with wide drop zones */}
        <div className="flex-[1.75] space-y-2">
          {pairs.map((p, i) => {
            const cardId = matches[p.id];
            const card = cardId ? byId[cardId] : undefined;
            const isCorrect = checked && cardId === p.id;
            const isWrong = checked && !!cardId && cardId !== p.id;
            return (
              <div key={p.id} className="flex items-stretch gap-1.5">
                <span className="w-5 shrink-0 pt-3 text-[11px] font-bold text-[#e3b553]/80 text-right">
                  {i + 1}
                </span>
                <span className="w-[38%] shrink-0 pt-3 text-[13px] text-white leading-tight break-words">
                  {p.turkish}
                </span>
                <div
                  data-row={p.id}
                  onClick={() => {
                    if (selected) place(selected, p.id);
                    else if (cardId) unplace(p.id);
                  }}
                  className={`flex-1 min-h-[44px] rounded-xl flex items-center justify-center px-2 text-[13px] font-medium transition-colors ${
                    card
                      ? isCorrect
                        ? 'border border-[#3fae72] bg-[#3fae72]/10 text-white'
                        : isWrong
                          ? 'border border-[#c2503f] bg-[#c2503f]/10 text-white'
                          : 'border border-[#e3b553] bg-[#e3b553]/[0.07] text-white cursor-pointer'
                      : 'border border-dashed border-[#e3b553]/40 bg-black/40 cursor-pointer'
                  }`}
                >
                  {card ? (
                    <span className="flex items-center gap-1 text-center break-words">
                      {isCorrect && <Check className="w-3.5 h-3.5 text-[#3fae72] shrink-0" />}
                      {isWrong && <X className="w-3.5 h-3.5 text-[#c2503f] shrink-0" />}
                      {card.english}
                    </span>
                  ) : (
                    ''
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* English card pool */}
        <div className="flex-1 space-y-2">
          {pool.map(id => {
            const p = byId[id];
            if (!p) return null;
            const isSel = selected === id;
            return (
              <button
                key={id}
                onPointerDown={e => onPointerDown(e, id)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onClick={() => setSelected(s => (s === id ? null : id))}
                disabled={checked}
                style={{ touchAction: 'none', opacity: drag?.id === id ? 0.35 : 1 }}
                className={`w-full min-h-[44px] rounded-xl border px-2 py-2 flex items-center justify-between gap-1 text-[13px] text-white ${
                  isSel ? 'border-[#e3b553] bg-[#e3b553]/15' : 'border-[#e3b553]/55 bg-[#0a0a0b]'
                } disabled:opacity-40 cursor-grab active:cursor-grabbing`}
              >
                <span className="text-left break-words leading-tight">{p.english}</span>
                <GripVertical className="w-3.5 h-3.5 text-[#e3b553]/60 shrink-0" />
              </button>
            );
          })}
          {pool.length === 0 && (
            <p className="text-center text-[11px] text-white/25 py-3">—</p>
          )}
        </div>
      </div>

      {/* Floating card while dragging */}
      {drag && byId[drag.id] && (
        <div
          className="fixed z-[60] pointer-events-none rounded-xl border border-[#e3b553] bg-[#0a0a0b] px-2 py-2 text-[13px] text-white shadow-lg"
          style={{ left: drag.x, top: drag.y, width: drag.w }}
        >
          {byId[drag.id].english}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={clearAll}
          disabled={checked}
          className="flex-1 flex items-center justify-center gap-1.5 border border-[#e3b553]/40 text-white rounded-2xl py-3 text-[10px] font-bold tracking-[0.1em] hover:bg-[#e3b553]/10 cursor-pointer disabled:opacity-40"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#e3b553]" /> CLEAR ALL
        </button>
        {checked ? (
          <button
            onClick={() => setRound(r => r + 1)}
            className="flex-[1.7] rounded-2xl py-3.5 text-[11px] font-bold tracking-[0.1em] bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] cursor-pointer"
          >
            NEW ROUND
          </button>
        ) : (
          <button
            onClick={check}
            disabled={!allFilled}
            className={`flex-[1.7] rounded-2xl py-3.5 text-[11px] font-bold tracking-[0.1em] ${
              allFilled
                ? 'bg-[#e3b553] hover:bg-[#d2a442] text-[#0a0a0b] cursor-pointer'
                : 'bg-white/[0.04] text-white/30 cursor-not-allowed'
            }`}
          >
            CHECK ANSWERS
          </button>
        )}
        <div className="flex-1 text-right">
          <p className="text-[10px] tracking-[0.14em] text-[#e3b553]">{pairs.length} PAIRS</p>
          <p className="text-[10px] tracking-[0.14em] text-white/40">SLIDE &amp; MATCH</p>
        </div>
      </div>
    </div>
  );
}

function TopBar({ onExit }: { onExit: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={onExit}
        aria-label="Back"
        className="p-2 bg-white/[0.03] text-[#e3b553] border border-[#e3b553]/25 rounded-xl cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <div className="text-center">
        <p className="text-[13px] tracking-[0.22em] font-medium">
          <span className="text-white">LEXISTENCE</span>
          <span className="text-[#e3b553]">HUB</span>
        </p>
        <p className="text-[10px] tracking-[0.14em] text-[#e3b553]/70 font-light">Beyond English.</p>
      </div>
      <div className="p-2 bg-white/[0.03] text-[#e3b553]/70 border border-[#e3b553]/20 rounded-xl">
        <BarChart3 className="w-5 h-5" />
      </div>
    </div>
  );
}
