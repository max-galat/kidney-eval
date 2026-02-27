import { PredictionResult } from '@/types';

const colorForSurvival = (pct: number) => {
  if (pct >= 90) return { ring: 'border-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (pct >= 80) return { ring: 'border-amber-400', text: 'text-amber-600', bg: 'bg-amber-50' };
  return { ring: 'border-red-400', text: 'text-red-600', bg: 'bg-red-50' };
};

const colorForKdpi = (risk: string) => {
  if (risk === 'low') return { ring: 'border-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Low Risk' };
  if (risk === 'moderate') return { ring: 'border-amber-400', text: 'text-amber-600', bg: 'bg-amber-50', label: 'Moderate Risk' };
  return { ring: 'border-red-400', text: 'text-red-600', bg: 'bg-red-50', label: 'High Risk' };
};

export default function SurvivalHero({ result }: { result: PredictionResult }) {
  const pct = Math.round(result.predicted_1yr_survival * 100);
  const s = colorForSurvival(pct);
  const k = colorForKdpi(result.kdpi_implied_risk);

  return (
    <div className="space-y-4">
      {/* Side-by-side cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Our model */}
        <div className={`rounded-xl border-2 ${s.ring} ${s.bg} p-6 text-center`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Our Model</p>
          <p className={`text-5xl font-bold ${s.text}`}>{pct}%</p>
          <p className="text-sm text-gray-600 mt-1">1-Year Graft Survival</p>
          <p className={`mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-medium ${s.text} ${s.bg}`}>
            {result.model_assessment}
          </p>
        </div>

        {/* KDPI */}
        <div className={`rounded-xl border-2 ${k.ring} ${k.bg} p-6 text-center`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">KDPI Score</p>
          <p className={`text-5xl font-bold ${k.text}`}>{result.kdpi_score}</p>
          <p className="text-sm text-gray-600 mt-1">Percentile (0-100)</p>
          <p className={`mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-medium ${k.text} ${k.bg}`}>
            {k.label}
          </p>
        </div>
      </div>

      {/* Divergence explanation */}
      <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Analysis</p>
        <p className="text-sm text-gray-700 leading-relaxed">{result.divergence_explanation}</p>
      </div>
    </div>
  );
}
