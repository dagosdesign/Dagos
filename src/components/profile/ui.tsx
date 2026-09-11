import { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* The Profile colour system. Nothing else is used on these screens: no green,
   blue, purple or red, gold only where it carries meaning. */
export const C = {
  bg: '#050505',
  card: '#0B0B0B',
  card2: '#101010',
  text: '#FFFFFF',
  muted: '#A5A5A5',
  border: '#262626',
  gold: '#F5B82E',
  goldDim: 'rgba(245,184,46,0.12)',
  goldGlow: '0 0 22px rgba(245,184,46,0.10)',
} as const;

export function Card({
  children,
  className = '',
  glow = false,
  secondary = false,
  gold = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  secondary?: boolean;
  gold?: boolean;
}) {
  return (
    <div
      className={`rounded-[22px] border ${className}`}
      style={{
        background: secondary ? C.card2 : C.card,
        borderColor: gold ? 'rgba(245,184,46,0.55)' : C.border,
        boxShadow: glow ? C.goldGlow : undefined,
      }}
    >
      {children}
    </div>
  );
}

/* Main section title (20-22 px) with an optional secondary line. */
export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-1 space-y-1">
      <h2 className="text-[21px] font-semibold leading-tight" style={{ color: C.text }}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-[13px]" style={{ color: C.muted }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* One card holding a list of rows separated by thin dark dividers. */
export function MenuList({ children }: { children: ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="divide-y divide-[#262626]">{children}</div>
    </Card>
  );
}

export function ProfileMenuItem({
  icon: Icon,
  title,
  subtitle,
  onClick,
  trailing,
}: {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left cursor-pointer transition-colors hover:bg-white/[0.02] border-[#262626]"
    >
      {Icon && (
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
          style={{ background: C.card2, borderColor: C.border }}
        >
          <Icon className="w-[18px] h-[18px]" strokeWidth={1.7} color={C.gold} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium leading-snug break-words" style={{ color: C.text }}>
          {title}
        </span>
        {subtitle && (
          <span className="block text-[12.5px] leading-snug mt-0.5 break-words" style={{ color: C.muted }}>
            {subtitle}
          </span>
        )}
      </span>
      {trailing ?? <ChevronRight className="w-[18px] h-[18px] shrink-0" color={C.muted} strokeWidth={1.8} />}
    </button>
  );
}

/* The frame every Profile sub-page uses: back button, title, content. */
export function SubPage({
  title,
  subtitle,
  onBack,
  children,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-10 h-10 rounded-full border flex items-center justify-center cursor-pointer shrink-0"
          style={{ background: C.card, borderColor: C.border }}
        >
          <ChevronLeft className="w-5 h-5" color={C.text} />
        </button>
        <div className="min-w-0">
          <h1 className="text-[21px] font-semibold leading-tight truncate" style={{ color: C.text }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-[13px] truncate" style={{ color: C.muted }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

export function GoldButton({
  children,
  onClick,
  disabled,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-2xl py-3 text-[14px] font-semibold transition-opacity cursor-pointer disabled:cursor-default disabled:opacity-60 ${className}`}
      style={{ background: C.gold, color: '#0B0B0B' }}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  disabled,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-2xl py-3 text-[14px] font-medium border transition-colors cursor-pointer disabled:cursor-default ${className}`}
      style={{ background: 'transparent', borderColor: C.border, color: disabled ? C.muted : C.text }}
    >
      {children}
    </button>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full border transition-colors cursor-pointer shrink-0"
      style={{ background: checked ? C.gold : C.card2, borderColor: checked ? C.gold : C.border }}
    >
      <span
        className="absolute top-[2px] w-[18px] h-[18px] rounded-full transition-all"
        style={{ left: checked ? 22 : 3, background: checked ? '#0B0B0B' : C.muted }}
      />
    </button>
  );
}

/* A compact option chooser (segmented). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="px-3.5 py-2 rounded-full border text-[13px] cursor-pointer transition-colors"
            style={{
              background: on ? C.goldDim : C.card2,
              borderColor: on ? 'rgba(245,184,46,0.55)' : C.border,
              color: on ? C.gold : C.text,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
