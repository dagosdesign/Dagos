import { Gamepad2, KeyRound, Timer, HelpCircle } from 'lucide-react';

interface GamesScreenProps {
  onPlayWordLock: () => void;
  onPlayAtoZ: () => void;
  onPlayWhatAmI: () => void;
}

export default function GamesScreen({ onPlayWordLock, onPlayAtoZ, onPlayWhatAmI }: GamesScreenProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-[#e3b553]/10 text-[#e3b553] border border-[#e3b553]/25 rounded-2xl">
          <Gamepad2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-serif italic text-white">Games</h1>
          <p className="text-[11px] text-white/40 font-mono">Oyna, öğren, puan kazan.</p>
        </div>
      </div>

      {/* Game list — more games land here later. */}
      <div className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-white/35 font-medium px-1">
          Oyunlar
        </p>

        <button
          onClick={onPlayWordLock}
          className="w-full text-left bg-white/[0.02] border border-[#e3b553]/25 rounded-3xl p-5 hover:border-[#e3b553]/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#e3b553]/10 text-[#e3b553] border border-[#e3b553]/20 rounded-2xl shrink-0">
              <KeyRound className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold tracking-[0.12em] text-[#e3b553]">WORDLOCK</p>
              <p className="text-xs text-white/50 font-light leading-relaxed">
                Harfleri bul, ipuçlarının kilidini aç, kelimeyi tahmin et.
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={onPlayAtoZ}
          className="w-full text-left bg-white/[0.02] border border-[#e3b553]/25 rounded-3xl p-5 hover:border-[#e3b553]/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#e3b553]/10 text-[#e3b553] border border-[#e3b553]/20 rounded-2xl shrink-0">
              <Timer className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold tracking-[0.12em] text-[#e3b553]">THE A–Z</p>
              <p className="text-xs text-white/50 font-light leading-relaxed">
                Her harf için 20 saniye; pas geçtiklerin sonda elemeli turda karşına çıkar.
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={onPlayWhatAmI}
          className="w-full text-left bg-white/[0.02] border border-[#e3b553]/25 rounded-3xl p-5 hover:border-[#e3b553]/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#e3b553]/10 text-[#e3b553] border border-[#e3b553]/20 rounded-2xl shrink-0">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold tracking-[0.12em] text-[#e3b553]">WHAT AM I?</p>
              <p className="text-xs text-white/50 font-light leading-relaxed">
                Üç ipucu ve harf sayısı; ilk 15 saniyede bilirsen çift puan.
              </p>
            </div>
          </div>
        </button>

        <div className="bg-white/[0.015] border border-white/[0.06] rounded-3xl p-5 text-center">
          <p className="text-sm text-white/45 font-light">Yeni oyunlar çok yakında burada.</p>
        </div>
      </div>
    </div>
  );
}
