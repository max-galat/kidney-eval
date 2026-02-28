import { PredictionResult } from '@/types';
import { getNonUseRisk } from '@/data/mock';

const colorForSurvival = (pct: number) => {
  if (pct >= 90) return { ring: 'border-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (pct >= 80) return { ring: 'border-amber-400', text: 'text-amber-600', bg: 'bg-amber-50' };
  return { ring: 'border-red-400', text: 'text-red-600', bg: 'bg-red-50' };
};

const nonUseColors = {
  green: { badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' },
  yellow: { badge: 'bg-yellow-100 text-yellow-800 border-yellow-300', dot: 'bg-yellow-500' },
  orange: { badge: 'bg-orange-100 text-orange-800 border-orange-300', dot: 'bg-orange-500' },
  red: { badge: 'bg-red-100 text-red-800 border-red-300', dot: 'bg-red-500' },
};

function NonUseBadge({ kdpi, dcd, donorAge }: { kdpi: number; dcd: boolean; donorAge: number }) {
  const { rate, label, color } = getNonUseRisk(kdpi, dcd, donorAge);
  const cls = nonUseColors[color];
  return (
    <div className="flex flex-col items-start gap-1">
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${cls.badge}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cls.dot}`} />
        {label}
      </span>
      <span className="text-xs text-gray-400 pl-1">
        {rate}% of similar kidneys were recovered but never transplanted (SRTR 2020–2024)
      </span>
    </div>
  );
}

function CIBar({ center, halfWidth }: { center: number; halfWidth: number }) {
  const lo = Math.max(0, center - halfWidth);
  const hi = Math.min(100, center + halfWidth);
  return (
    <div className="relative h-1.5 w-full rounded-full bg-gray-200 mt-2">
      <div
        className="absolute h-1.5 rounded-full bg-current opacity-30"
        style={{ left: `${lo}%`, width: `${hi - lo}%` }}
      />
      <div
        className="absolute w-1 h-3 -top-0.5 rounded-full bg-current"
        style={{ left: `calc(${center}% - 2px)` }}
      />
    </div>
  );
}

/** Prediction cards only — badge and analysis text are rendered separately in page.tsx */
export default function SurvivalHero({ result }: { result: PredictionResult }) {
  const modelPct = Math.round(result.predicted_1yr_survival * 100);
  const kdpiPct = Math.round(result.kdpi_implied_survival * 100);
  const s = colorForSurvival(modelPct);
  const k = colorForSurvival(kdpiPct);
  const isBasic = result.prediction_confidence === 'basic';

  return (
    <div className="space-y-3">
      {/* Non-use risk badge */}
      <NonUseBadge kdpi={result.kdpi_score} dcd={result.donor_dcd} donorAge={result.donor_age} />

      <div className={`grid gap-4 ${isBasic ? 'grid-cols-1 max-w-sm mx-auto' : 'grid-cols-2'}`}>
        {/* Our model — only shown when additional/recipient factors are present */}
        {!isBasic && (
          <div className={`rounded-xl border-2 ${s.ring} ${s.bg} p-6 text-center`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Our Model</p>
            <p className={`text-5xl font-bold ${s.text}`}>{modelPct}%</p>
            <p className="text-sm text-gray-600 mt-1">1-Year Graft Survival</p>
            <p className={`mt-1 text-xs font-medium ${s.text}`}>
              ±{result.model_ci}% ({Math.max(0, modelPct - result.model_ci)}%–{Math.min(100, modelPct + result.model_ci)}%)
            </p>
            <div className={`${s.text} mx-4`}>
              <CIBar center={modelPct} halfWidth={result.model_ci} />
            </div>
            <p className={`mt-3 inline-block rounded-full px-3 py-0.5 text-xs font-medium ${s.text} ${s.bg}`}>
              {result.model_assessment}
            </p>
          </div>
        )}

        {/* KDPI — always shown */}
        <div className={`rounded-xl border-2 ${k.ring} ${k.bg} p-6 text-center`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">KDPI Estimate</p>
          <p className={`text-5xl font-bold ${k.text}`}>{kdpiPct}%</p>
          <p className="text-sm text-gray-600 mt-1">1-Year Graft Survival</p>
          <p className={`mt-1 text-xs font-medium ${k.text}`}>
            ±{result.kdpi_ci}% ({Math.max(0, kdpiPct - result.kdpi_ci)}%–{Math.min(100, kdpiPct + result.kdpi_ci)}%)
          </p>
          <div className={`${k.text} mx-4`}>
            <CIBar center={kdpiPct} halfWidth={result.kdpi_ci} />
          </div>
          <p className="mt-3 inline-block rounded-full px-3 py-0.5 text-xs font-medium text-gray-500 bg-gray-100">
            KDPI {result.kdpi_score} percentile
          </p>
        </div>
      </div>
    </div>
  );
}
