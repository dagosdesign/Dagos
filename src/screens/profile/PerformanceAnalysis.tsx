import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { SubPage } from "../../components/profile/ui";
import { useLearningRecord } from "../../lib/learningRecord";
import {
  analyzePerformance,
  MIN_EVIDENCE,
  SKILL_FILTERS,
} from "../../lib/performanceAnalysis";
import type {
  PerformanceAnalysis as Analysis,
  SkillFilter,
  TopicPerformance,
} from "../../lib/performanceAnalysis";
import { apiFetch } from "../../lib/api";

/* PERFORMANCE ANALYSIS - what the student does well, what to develop and what
   to practise next, from the student's real answers only. Black, white and gold:
   status is carried by percentages, labels and bar length, never by red/green. */

const P = {
  card: "#0B0B0B",
  text: "#FFFFFF",
  muted: "#A2A2A2",
  gold: "#E8B63F",
  bright: "#F4C542",
  warm: "#D9A62E",
  track: "#1E1E1E",
  border: "rgba(232,182,63,0.14)",
};

const pct = (x: number) => Math.round(x * 100);

function usePerformance(filter: SkillFilter): Analysis {
  const events = useLearningRecord();
  return useMemo(() => analyzePerformance(events, filter), [events, filter]);
}

/* ---------------- AI Recommendation ---------------- */

interface StoredRecommendation {
  basedOn: number;
  at: number;
  text: string;
}
const REC_KEY = "lex_performance_recommendation";
const inFlight = new Set<string>();

function readRecommendations(): Record<string, StoredRecommendation> {
  try {
    return JSON.parse(localStorage.getItem(REC_KEY) || "{}");
  } catch {
    return {};
  }
}

/* The facts the recommendation is written from. */
function recommendationData(a: Analysis, filter: SkillFilter) {
  const topic = (t: TopicPerformance) => ({
    topic: t.topic,
    accuracyPercent: pct(t.weightedAccuracy),
    answers: t.answers,
    band: t.band,
    recentMistakes: t.recentMistakes,
    trendPoints: t.trend,
    subtopicsCausingErrors: t.subtopics.map(
      (s) => `${s.name} (${pct(s.accuracy)}%)`,
    ),
    commonErrors: t.commonErrors.map(
      (e) => `chose "${e.given}" instead of "${e.expected}" ${e.count} times`,
    ),
    wordsMissedRepeatedly: t.missedItems.map((m) => m.item),
  });
  return {
    skill: filter,
    overallAccuracyPercent: a.overall == null ? null : pct(a.overall),
    changeFromLastMonthPoints: a.change,
    answers: a.answers,
    strengths: a.strengths.slice(0, 3).map(topic),
    areasToDevelop: a.develop.slice(0, 3).map(topic),
  };
}

/* A plain, data-only sentence when the AI text is not available. */
function fallbackRecommendation(a: Analysis): string {
  const parts: string[] = [];
  if (a.strengths[0])
    parts.push(
      `Your strongest topic is ${a.strengths[0].topic} at ${pct(a.strengths[0].weightedAccuracy)}%.`,
    );
  if (a.develop.length) {
    const names = a.develop
      .slice(0, 2)
      .map((t) => `${t.topic} (${pct(t.weightedAccuracy)}%)`);
    parts.push(`Focus next on ${names.join(" and ")}.`);
    const sub = a.develop[0].subtopics[0];
    if (sub)
      parts.push(
        `In ${a.develop[0].topic}, ${sub.name} causes the most errors.`,
      );
  } else if (a.strengths.length) {
    parts.push("No topic currently needs focused practice.");
  }
  return parts.join(" ");
}

function useRecommendation(a: Analysis, filter: SkillFilter) {
  const [store, setStore] =
    useState<Record<string, StoredRecommendation>>(readRecommendations);
  const [loading, setLoading] = useState(false);
  const saved = store[filter];
  const ready =
    a.overall != null && (a.strengths.length > 0 || a.develop.length > 0);
  const stale =
    ready &&
    (!saved ||
      a.answers - saved.basedOn >= 5 ||
      (a.answers !== saved.basedOn && Date.now() - saved.at > 2 * 86_400_000));

  useEffect(() => {
    if (!stale || inFlight.has(filter)) return;
    inFlight.add(filter);
    setLoading(true);
    apiFetch("/api/performance-recommendation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: recommendationData(a, filter) }),
    })
      .then((r) => r.json().then((body) => ({ ok: r.ok, body })))
      .then(({ ok, body }) => {
        if (!ok || !body.recommendation) throw new Error("no recommendation");
        const next = {
          ...readRecommendations(),
          [filter]: {
            basedOn: a.answers,
            at: Date.now(),
            text: body.recommendation,
          },
        };
        localStorage.setItem(REC_KEY, JSON.stringify(next));
        setStore(next);
      })
      .catch(() => {})
      .finally(() => {
        inFlight.delete(filter);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, stale]);

  return {
    text: ready ? (saved?.text ?? fallbackRecommendation(a)) : null,
    loading,
  };
}

/* ---------------- the section ---------------- */

export function PerformanceAnalysisSection({
  onStartPractice,
  heading = true,
}: {
  onStartPractice: (conceptKeys: string[]) => void;
  heading?: boolean;
}) {
  const [filter, setFilter] = useState<SkillFilter>("all");
  const analysis = usePerformance(filter);
  const { text, loading } = useRecommendation(analysis, filter);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const empty = analysis.overall == null;

  return (
    <section className="space-y-4">
      {heading && (
        <div className="px-1 space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="w-1 h-4 rounded-full"
              style={{ background: P.gold }}
            />
            <h2
              className="text-[20px] font-semibold leading-tight"
              style={{ color: P.text }}
            >
              Performance Analysis
            </h2>
          </div>
          <p className="text-[13px]" style={{ color: P.muted }}>
            A clear overview of your strengths and areas to develop.
          </p>
        </div>
      )}

      {/* Category filter */}
      <div className="-mx-1 px-1 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {SKILL_FILTERS.map((f) => {
          const on = f.id === filter;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setFilter(f.id);
                setOpenKey(null);
              }}
              className="shrink-0 rounded-full border px-4 py-2 text-[12px] font-semibold tracking-[0.08em] uppercase cursor-pointer transition-colors"
              style={
                on
                  ? {
                      background: P.gold,
                      borderColor: P.gold,
                      color: "#000000",
                    }
                  : {
                      background: "#050505",
                      borderColor: "#262626",
                      color: "#D8D8D8",
                    }
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {empty ? (
        <Panel>
          <div className="py-4 text-center space-y-2">
            <p
              className="text-[11px] font-semibold tracking-[0.18em] uppercase"
              style={{ color: P.gold }}
            >
              Analysis in progress
            </p>
            <p className="text-[16px] font-semibold" style={{ color: P.text }}>
              Not enough learning data yet.
            </p>
            <p
              className="text-[13.5px] leading-relaxed max-w-xs mx-auto"
              style={{ color: P.muted }}
            >
              Complete more learning activities to unlock your personalized
              performance analysis.
              {analysis.answers > 0 &&
                ` ${analysis.answers} of ${MIN_EVIDENCE} answers recorded${filter === "all" ? "" : " in this category"}.`}
            </p>
          </div>
        </Panel>
      ) : (
        <div className="space-y-3 transition-opacity duration-200">
          {/* Overall performance */}
          <Panel>
            <div className="flex items-center gap-5">
              <Ring value={analysis.overall!} />
              <div className="min-w-0 space-y-1">
                <p className="text-[13px]" style={{ color: P.muted }}>
                  Overall Performance
                </p>
                <p
                  className="text-[32px] font-bold leading-none"
                  style={{ color: P.text }}
                >
                  {pct(analysis.overall!)}%
                </p>
                <p
                  className="text-[12.5px]"
                  style={{ color: analysis.change == null ? P.muted : P.gold }}
                >
                  {analysis.change == null
                    ? "Not enough comparison data"
                    : `${analysis.change > 0 ? "+" : ""}${analysis.change}% from last month`}
                </p>
                <p className="text-[11.5px]" style={{ color: P.muted }}>
                  {analysis.answers} answered questions
                </p>
              </div>
            </div>
          </Panel>

          {/* Strengths */}
          <Panel>
            <CardHead
              title="Your Strengths"
              subtitle="You’re performing well in these topics."
            />
            {analysis.strengths.length === 0 ? (
              <Note>
                No topic has reached 80% with at least {MIN_EVIDENCE} answers
                yet.
              </Note>
            ) : (
              <TopicList
                topics={analysis.strengths}
                openKey={openKey}
                onToggle={setOpenKey}
                onPractice={(k) => onStartPractice([k])}
              />
            )}
          </Panel>

          {/* Areas to develop */}
          <Panel>
            <CardHead
              title="Areas to Develop"
              subtitle="These are the topics to focus on."
            />
            {analysis.develop.length === 0 ? (
              <Note>
                No topic with enough answers needs focused practice right now.
              </Note>
            ) : (
              <TopicList
                topics={analysis.develop}
                openKey={openKey}
                onToggle={setOpenKey}
                onPractice={(k) => onStartPractice([k])}
              />
            )}
            {analysis.insufficient > 0 && (
              <p className="text-[11.5px] pt-1" style={{ color: P.muted }}>
                {analysis.insufficient}{" "}
                {analysis.insufficient === 1 ? "topic has" : "topics have"}{" "}
                fewer than {MIN_EVIDENCE} answers - insufficient data.
              </p>
            )}
          </Panel>

          {/* AI Recommendation */}
          <Panel>
            <CardHead
              title="AI Recommendation"
              subtitle="Based on your performance."
            />
            <p
              className="text-[14.5px] leading-relaxed"
              style={{ color: P.text }}
            >
              {text ?? "Complete more activities to receive a recommendation."}
            </p>
            {loading && (
              <p className="text-[11.5px]" style={{ color: P.muted }}>
                Updating…
              </p>
            )}
            {analysis.develop.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  onStartPractice(
                    analysis.develop.slice(0, 3).map((t) => t.key),
                  )
                }
                className="w-full rounded-2xl py-3.5 text-[13px] font-bold tracking-[0.12em] uppercase cursor-pointer transition-opacity hover:opacity-90"
                style={{ background: P.gold, color: "#000000" }}
              >
                Start Practice
              </button>
            )}
          </Panel>

          {/* Learning path */}
          {analysis.develop.length > 0 && (
            <Panel>
              <CardHead
                title="Your Learning Path"
                subtitle="Focus on these areas to strengthen your performance."
              />
              <ol className="space-y-2.5">
                {analysis.develop.map((t, i) => (
                  <li key={t.key} className="flex items-center gap-3">
                    <span
                      className="w-7 h-7 rounded-full border flex items-center justify-center text-[12px] font-bold shrink-0"
                      style={{
                        borderColor: i === 0 ? P.gold : "#2A2A2A",
                        color: i === 0 ? "#000000" : P.gold,
                        background: i === 0 ? P.gold : "transparent",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      className="flex-1 min-w-0 text-[14.5px] truncate"
                      style={{ color: P.text }}
                    >
                      {t.topic}
                    </span>
                    <span
                      className="text-[11.5px] shrink-0"
                      style={{ color: P.muted }}
                    >
                      {t.band}
                    </span>
                  </li>
                ))}
              </ol>
            </Panel>
          )}
        </div>
      )}
    </section>
  );
}

export function PerformanceAnalysisPage({
  onBack,
  onStartPractice,
}: {
  onBack: () => void;
  onStartPractice: (conceptKeys: string[]) => void;
}) {
  return (
    <SubPage
      title="Performance Analysis"
      subtitle="A clear overview of your strengths and areas to develop."
      onBack={onBack}
    >
      <PerformanceAnalysisSection
        onStartPractice={onStartPractice}
        heading={false}
      />
    </SubPage>
  );
}

/* ---------------- parts ---------------- */

function Panel({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-[22px] border p-5 space-y-4"
      style={{ background: P.card, borderColor: P.border }}
    >
      {children}
    </div>
  );
}

function CardHead({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[17px] font-semibold" style={{ color: P.text }}>
        {title}
      </p>
      <p className="text-[12.5px]" style={{ color: P.muted }}>
        {subtitle}
      </p>
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return (
    <p className="text-[13.5px] leading-relaxed" style={{ color: P.muted }}>
      {children}
    </p>
  );
}

function TopicList({
  topics,
  openKey,
  onToggle,
  onPractice,
}: {
  topics: TopicPerformance[];
  openKey: string | null;
  onToggle: (key: string | null) => void;
  onPractice: (key: string) => void;
}) {
  return (
    <div className="space-y-1">
      {topics.map((t) => {
        const open = openKey === t.key;
        const value = pct(t.weightedAccuracy);
        return (
          <div key={t.key}>
            <button
              type="button"
              onClick={() => onToggle(open ? null : t.key)}
              aria-expanded={open}
              className="w-full text-left py-2 cursor-pointer space-y-1.5"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex-1 min-w-0 text-[14.5px] truncate"
                  style={{ color: P.text }}
                >
                  {t.topic}
                </span>
                <span
                  className="text-[14.5px] font-semibold tabular-nums"
                  style={{ color: P.text }}
                >
                  {value}%
                </span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                  color={P.muted}
                />
              </div>
              <div
                className="h-[5px] rounded-full overflow-hidden"
                style={{ background: P.track }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${value}%`,
                    background:
                      value >= 90 ? P.bright : value >= 70 ? P.gold : P.warm,
                  }}
                />
              </div>
            </button>
            {open && (
              <TopicDetail topic={t} onPractice={() => onPractice(t.key)} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function TopicDetail({
  topic: t,
  onPractice,
}: {
  topic: TopicPerformance;
  onPractice: () => void;
}) {
  return (
    <div
      className="rounded-2xl border p-4 mt-1 mb-2 space-y-3"
      style={{ borderColor: "#222222", background: "#070707" }}
    >
      <div className="grid grid-cols-3 gap-2 text-center">
        <Mini label="Answered" value={String(t.answers)} />
        <Mini label="Correct" value={String(t.correct)} />
        <Mini label="Incorrect" value={String(t.incorrect)} />
      </div>
      <p className="text-[12.5px] leading-relaxed" style={{ color: P.muted }}>
        <span style={{ color: P.gold }}>{t.band}</span>
        {t.trend != null &&
          ` · ${t.trend > 0 ? "+" : ""}${t.trend} points over the last month`}
        {t.recentMistakes > 0 &&
          ` · ${t.recentMistakes} mistakes in the last two weeks`}
        {` · last practised ${new Date(t.lastAt).toLocaleDateString()}`}
      </p>
      {t.subtopics.length > 0 && (
        <div className="space-y-1">
          <p
            className="text-[11.5px] tracking-[0.1em] uppercase"
            style={{ color: P.muted }}
          >
            Detected difficulty
          </p>
          {t.subtopics.map((s) => (
            <p key={s.name} className="text-[13.5px]" style={{ color: P.text }}>
              {s.name}{" "}
              <span style={{ color: P.muted }}>
                · {pct(s.accuracy)}% in {s.answers} answers
              </span>
            </p>
          ))}
        </div>
      )}
      {t.commonErrors.length > 0 && (
        <div className="space-y-1">
          <p
            className="text-[11.5px] tracking-[0.1em] uppercase"
            style={{ color: P.muted }}
          >
            Common error
          </p>
          {t.commonErrors.map((e, i) => (
            <p key={i} className="text-[13.5px]" style={{ color: P.text }}>
              “{e.given}” instead of{" "}
              <span style={{ color: P.gold }}>“{e.expected}”</span>
              <span style={{ color: P.muted }}> · {e.count}×</span>
            </p>
          ))}
        </div>
      )}
      {t.missedItems.length > 0 && (
        <p className="text-[13px] leading-relaxed" style={{ color: P.muted }}>
          Missed more than once:{" "}
          <span style={{ color: P.text }}>
            {t.missedItems.map((m) => m.item).join(", ")}
          </span>
        </p>
      )}
      <button
        type="button"
        onClick={onPractice}
        className="w-full rounded-xl border py-2.5 text-[12.5px] font-semibold tracking-[0.08em] uppercase cursor-pointer"
        style={{ borderColor: "rgba(232,182,63,0.45)", color: P.gold }}
      >
        Practice this topic
      </button>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        className="text-[17px] font-semibold leading-none"
        style={{ color: P.text }}
      >
        {value}
      </p>
      <p className="text-[11px] mt-1" style={{ color: P.muted }}>
        {label}
      </p>
    </div>
  );
}

function Ring({ value }: { value: number }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 84 84" className="w-[84px] h-[84px] shrink-0 -rotate-90">
      <circle
        cx="42"
        cy="42"
        r={r}
        fill="none"
        stroke={P.track}
        strokeWidth="7"
      />
      <circle
        cx="42"
        cy="42"
        r={r}
        fill="none"
        stroke={P.gold}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - value)}
        style={{ transition: "stroke-dashoffset 300ms ease" }}
      />
    </svg>
  );
}
