import { PredictionResult } from '@/types';

const colorForSurvival = (pct: number) => {
  if (pct >= 90) return { ring: 'border-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (pct >= 80) return { ring: 'border-amber-400', text: 'text-amber-600', bg: 'bg-amber-50' };
  return { ring: 'border-red-400', text: 'text-red-600', bg: 'bg-red-50' };
};

/** Prediction cards only — badge and analysis text are rendered separately in page.tsx */
export default function SurvivalHero({ result }: { result: PredictionResult }) {
  const modelPct = Math.round(result.predicted_1yr_survival * 100);
  const kdpiPct = Math.round(result.kdpi_implied_survival * 100);
  const s = colorForSurvival(modelPct);
  const k = colorForSurvival(kdpiPct);

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Our model */}
      <div className={`rounded-xl border-2 ${s.ring} ${s.bg} p-6 text-center`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Our Model</p>
        <p className={`text-5xl font-bold ${s.text}`}>{modelPct}%</p>
        <p className="text-sm text-gray-600 mt-1">1-Year Graft Survival</p>
        <p className={`mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-medium ${s.text} ${s.bg}`}>
          {result.model_assessment}
        </p>
      </div>

      {/* KDPI — converted to same unit */}
      <div className={`rounded-xl border-2 ${k.ring} ${k.bg} p-6 text-center`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">KDPI Estimate</p>
        <p className={`text-5xl font-bold ${k.text}`}>{kdpiPct}%</p>
        <p className="text-sm text-gray-600 mt-1">1-Year Graft Survival</p>
        <p className="mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-medium text-gray-500 bg-gray-100">
          KDPI {result.kdpi_score} percentile
        </p>
      </div>
    </div>
  );
}
