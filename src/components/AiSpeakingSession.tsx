import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, X } from 'lucide-react';
import { LiveConversation, LiveStatus, startLiveConversation } from '../lib/liveConversation';

/* AI SPEAKING - a live voice call with AI LEX in English, like Gemini's own
   voice chat: talk naturally, AI LEX answers in a natural voice, and speaking
   over it interrupts it. Captions show what both sides said, and every finished
   turn is also added to the AI LEX chat. */

interface Line {
  who: 'student' | 'tutor';
  text: string;
}

export default function AiSpeakingSession({
  onClose,
  onTurn,
}: {
  onClose: () => void;
  onTurn: (role: 'user' | 'assistant', text: string) => void;
}) {
  const [status, setStatus] = useState<LiveStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [live, setLive] = useState<Line | null>(null); // the caption being spoken right now
  const [seconds, setSeconds] = useState(0);
  const orbRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<LiveConversation | null>(null);
  const captionsRef = useRef<HTMLDivElement>(null);
  const onTurnRef = useRef(onTurn);
  onTurnRef.current = onTurn;

  const begin = () => {
    setError(null);
    setLines([]);
    setLive(null);
    setSeconds(0);
    setMuted(false);
    callRef.current?.stop();
    callRef.current = startLiveConversation({
      onStatus: setStatus,
      onStudentText: (text, done) => {
        if (done) {
          setLines(l => [...l, { who: 'student', text }]);
          setLive(null);
          onTurnRef.current('user', text);
        } else setLive({ who: 'student', text });
      },
      onTutorText: (text, done) => {
        if (done) {
          setLines(l => [...l, { who: 'tutor', text }]);
          setLive(null);
          onTurnRef.current('assistant', text);
        } else setLive({ who: 'tutor', text });
      },
      onLevels: (mic, voice) => {
        // Drawn straight onto the orb: no re-render thirty times a second.
        const orb = orbRef.current;
        if (!orb) return;
        const level = Math.min(1, Math.max(mic * 1.6, voice * 2.2));
        orb.style.transform = `scale(${1 + level * 0.22})`;
        orb.style.boxShadow = `0 0 ${30 + level * 70}px rgba(245,184,46,${0.18 + level * 0.4})`;
      },
      onError: setError,
    });
  };

  // The call starts with the tap that opened this screen and ends when it closes.
  // A layout effect still runs inside that tap, which phones require before audio can play.
  useLayoutEffect(() => {
    begin();
    return () => callRef.current?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status !== 'listening' && status !== 'speaking') return;
    const id = window.setInterval(() => setSeconds(s => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [status]);

  useEffect(() => {
    captionsRef.current?.scrollTo({ top: captionsRef.current.scrollHeight, behavior: 'smooth' });
  }, [lines, live]);

  const end = () => {
    callRef.current?.stop();
    onClose();
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    callRef.current?.setMuted(next);
  };

  const active = status === 'listening' || status === 'speaking';
  const label =
    status === 'connecting'
      ? 'Connecting…'
      : status === 'speaking'
        ? 'AI LEX is speaking'
        : status === 'listening'
          ? muted
            ? 'Microphone is off'
            : 'Listening… just talk'
          : status === 'ended'
            ? 'Call ended'
            : 'Could not connect';
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))]"
      style={{ background: '#050505' }}
      role="dialog"
      aria-label="AI Speaking"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[18px] font-semibold text-white">AI Speaking</p>
          <p className="text-[12px] text-[#A5A5A5]">{active ? clock : 'Live English conversation'}</p>
        </div>
        <button
          onClick={end}
          aria-label="Close"
          className="w-10 h-10 rounded-full border border-[#262626] bg-[#0B0B0B] flex items-center justify-center text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* The orb breathes with whoever is talking */}
      <div className="flex flex-col items-center justify-center pt-10 pb-6 gap-6 shrink-0">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <div
            ref={orbRef}
            className="absolute inset-0 rounded-full transition-[transform,box-shadow] duration-100 ease-out"
            style={{
              background:
                status === 'speaking'
                  ? 'radial-gradient(circle at 35% 30%, #FFD98A 0%, #F5B82E 45%, #8A5E26 100%)'
                  : 'radial-gradient(circle at 35% 30%, #2A2418 0%, #14110C 60%, #0B0B0B 100%)',
              border: `2px solid ${active ? '#F5B82E' : '#262626'}`,
            }}
          />
          {status === 'connecting' && (
            <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#F5B82E] animate-spin" />
          )}
        </div>
        <p className="text-[15px] font-medium text-white text-center">{label}</p>
        {error && <p className="text-[13px] text-[#A5A5A5] text-center max-w-sm leading-relaxed">{error}</p>}
      </div>

      {/* Captions */}
      <div ref={captionsRef} className="flex-1 min-h-0 overflow-y-auto space-y-2.5 w-full max-w-md mx-auto">
        {[...lines, ...(live ? [live] : [])].map((line, i) => (
          <div key={i} className={`flex ${line.who === 'student' ? 'justify-end' : 'justify-start'}`}>
            <p
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-snug ${
                line.who === 'student'
                  ? 'bg-[#101010] border border-[#262626] text-white rounded-br-md'
                  : 'bg-[#0B0B0B] border border-[#F5B82E]/30 text-white rounded-bl-md'
              } ${line === live ? 'opacity-70' : ''}`}
            >
              {line.text}
            </p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 pt-4 shrink-0">
        {status === 'error' || status === 'ended' ? (
          <button
            onClick={begin}
            className="px-6 py-3.5 rounded-2xl bg-[#F5B82E] text-[#0B0B0B] text-[15px] font-semibold cursor-pointer"
          >
            Start again
          </button>
        ) : (
          <button
            onClick={toggleMute}
            aria-label={muted ? 'Turn microphone on' : 'Turn microphone off'}
            className={`w-14 h-14 rounded-full border flex items-center justify-center cursor-pointer ${
              muted ? 'border-white bg-white text-[#0B0B0B]' : 'border-[#262626] bg-[#101010] text-white'
            }`}
          >
            {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
        )}
        <button
          onClick={end}
          aria-label="End call"
          className="w-14 h-14 rounded-full border border-[#262626] bg-[#101010] text-white flex items-center justify-center cursor-pointer"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
