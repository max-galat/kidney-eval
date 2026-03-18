import { PredictionResult } from '@/types';
import { getNonUseRisk } from '@/data/mock';
import PNFCard from './PNFCard';

const colorForSurvival = (pct: number) => {
  if (pct >= 90) return { ring: 'border-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (pct >= 80) return { ring: 'border-amber-400', text: 'text-amber-600', bg: 'bg-amber-50' };
  return { ring: 'border-red-400', text: 'text-red-600', bg: 'bg-red-50' };
};

const nonUseColors = {
  green: { ring: 'border-emerald-300', text: 'text-emerald-600', bg: 'bg-emerald-50' },
  yellow: { ring: 'border-yellow-300', text: 'text-yellow-600', bg: 'bg-yellow-50' },
  orange: { ring: 'border-orange-300', text: 'text-orange-600', bg: 'bg-orange-50' },
  red: { ring: 'border-red-300', text: 'text-red-600', bg: 'bg-red-50' },
};

function CIBar({ center, halfWidth }: { center: number; halfWidth: number }) {
  const lo = Math.max(0, center - halfWidth);
  const hi = Math.min(100, center + halfWidth);
  return (
    <div className="relative h-1.5 w-full rounded-full bg-gray-200 mt-2">
      <div className="absolute h-1.5 rounded-full bg-current opacity-30" style={{ left: `${lo}%`, width: `${hi - lo}%` }} />
      <div className="absolute w-1 h-3 -top-0.5 rounded-full bg-current" style={{ left: `calc(${center}% - 2px)` }} />
    </div>
  );
}

/** 2x2 headline grid: Model | KDPI | PNF | Non-Use */
export default function SurvivalHero({ result }: { result: PredictionResult }) {
  const modelPct = Math.round(result.predicted_1yr_survival * 100);
  const kdpiPct = Math.round(result.kdpi_implied_survival * 100);
  const s = colorForSurvival(modelPct);
  const k = colorForSurvival(kdpiPct);
  const isBasic = result.prediction_confidence === 'basic';

  const nonUse = getNonUseRisk(result.kdpi_score, result.donor_dcd, result.donor_age);
  const nuColors = nonUseColors[nonUse.color];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Top-left: Graft Survival Model (or KDPI-only when basic) */}
      {!isBasic ? (
        <div className={`rounded-xl border-2 ${s.ring} ${s.bg} p-5 text-center`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Graft Survival Model</p>
          <p className={`text-4xl font-bold ${s.text}`}>{modelPct}%</p>
          <p className="text-sm text-gray-600 mt-1">1-Year Graft Survival</p>
          <p className={`mt-1 text-xs font-medium ${s.text}`}>
            ±{result.model_ci}% ({Math.max(0, modelPct - result.model_ci)}%–{Math.min(100, modelPct + result.model_ci)}%)
          </p>
          <div className={`${s.text} mx-4`}><CIBar center={modelPct} halfWidth={result.model_ci} /></div>
          <p className={`mt-3 inline-block rounded-full px-3 py-0.5 text-xs font-medium ${s.text} ${s.bg}`}>
            {result.model_assessment}
          </p>
        </div>
      ) : (
        <div className={`rounded-xl border-2 ${k.ring} ${k.bg} p-5 text-center`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">KDPI Estimate</p>
          <p className={`text-4xl font-bold ${k.text}`}>{kdpiPct}%</p>
          <p className="text-sm text-gray-600 mt-1">1-Year Graft Survival</p>
          <p className={`mt-1 text-xs font-medium ${k.text}`}>
            ±{result.kdpi_ci}% ({Math.max(0, kdpiPct - result.kdpi_ci)}%–{Math.min(100, kdpiPct + result.kdpi_ci)}%)
          </p>
          <div className={`${k.text} mx-4`}><CIBar center={kdpiPct} halfWidth={result.kdpi_ci} /></div>
          <p className="mt-3 inline-block rounded-full px-3 py-0.5 text-xs font-medium text-gray-500 bg-gray-100">KDPI {result.kdpi_score}</p>
        </div>
      )}

      {/* Top-right: KDPI Estimate (only when non-basic) */}
      {!isBasic && (
        <div className={`rounded-xl border-2 ${k.ring} ${k.bg} p-5 text-center`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">KDPI Estimate</p>
          <p className={`text-4xl font-bold ${k.text}`}>{kdpiPct}%</p>
          <p className="text-sm text-gray-600 mt-1">1-Year Graft Survival</p>
          <p className={`mt-1 text-xs font-medium ${k.text}`}>
            ±{result.kdpi_ci}% ({Math.max(0, kdpiPct - result.kdpi_ci)}%–{Math.min(100, kdpiPct + result.kdpi_ci)}%)
          </p>
          <div className={`${k.text} mx-4`}><CIBar center={kdpiPct} halfWidth={result.kdpi_ci} /></div>
          <p className="mt-3 inline-block rounded-full px-3 py-0.5 text-xs font-medium text-gray-500 bg-gray-100">KDPI {result.kdpi_score}</p>
        </div>
      )}

      {/* Bottom-left: PNF Risk */}
      <PNFCard risk={result.pnf_risk} ci={result.pnf_ci} />

      {/* Bottom-right: Non-Use Risk */}
      <div className={`rounded-xl border-2 ${nuColors.ring} ${nuColors.bg} p-5 text-center`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Non-Use Risk</p>
        <p className={`text-4xl font-bold ${nuColors.text}`}>{nonUse.rate}%</p>
        <p className="text-sm text-gray-600 mt-1">Discard Rate</p>
        <p className="text-xs text-gray-400 mt-2">
          {nonUse.rate}% of similar kidneys recovered but never transplanted
        </p>
        <p className="text-xs text-gray-400">(SRTR 2020-2024)</p>
      </div>
    </div>
  );
}
