interface Props {
  cr6mo: number;
  cr12mo: number;
  range: number;
  trendLabel: string | null;
}

const colorForCr = (cr: number) => {
  if (cr <= 1.5) return 'text-emerald-600';
  if (cr <= 2.5) return 'text-amber-600';
  return 'text-red-600';
};

const barColorForCr = (cr: number) => {
  if (cr <= 1.5) return 'bg-emerald-400';
  if (cr <= 2.5) return 'bg-amber-400';
  return 'bg-red-400';
};

function CrRow({ label, value, range }: { label: string; value: number; range: number }) {
  const lo = Math.max(0, Math.round((value - range) * 10) / 10);
  const hi = Math.round((value + range) * 10) / 10;
  const barLeft = (lo / 5) * 100;
  const barWidth = ((hi - lo) / 5) * 100;
  const pointPos = (value / 5) * 100;

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        <span className={`text-lg font-bold ${colorForCr(value)}`}>
          {value} <span className="text-xs font-normal text-gray-400">mg/dL</span>
        </span>
      </div>
      <div className="relative h-2 w-full rounded-full bg-gray-100">
        {/* Green / yellow / red zones */}
        <div className="absolute h-2 rounded-l-full bg-emerald-100" style={{ left: 0, width: '30%' }} />
        <div className="absolute h-2 bg-amber-100" style={{ left: '30%', width: '20%' }} />
        <div className="absolute h-2 rounded-r-full bg-red-100" style={{ left: '50%', width: '50%' }} />
        {/* Range bar */}
        <div className={`absolute h-2 rounded-full ${barColorForCr(value)} opacity-50`} style={{ left: `${barLeft}%`, width: `${barWidth}%` }} />
        {/* Point estimate */}
        <div className={`absolute w-1.5 h-3.5 -top-0.5 rounded-full ${barColorForCr(value)}`} style={{ left: `calc(${pointPos}% - 3px)` }} />
      </div>
      <p className="text-xs text-gray-400 text-right">
        Range: {lo}–{hi} mg/dL
      </p>
    </div>
  );
}

const TREND_ICONS: Record<string, { icon: string; color: string }> = {
  'Recovering': { icon: '↘', color: 'text-emerald-600' },
  'Elevated, not recovering': { icon: '→', color: 'text-amber-600' },
  'Still rising': { icon: '↗', color: 'text-red-600' },
};

export default function CreatinineCard({ cr6mo, cr12mo, range, trendLabel }: Props) {
  const trend = trendLabel ? TREND_ICONS[trendLabel] : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Predicted Kidney Function
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">Estimated post-transplant serum creatinine</p>
      </div>
      <div className="px-6 py-5 space-y-5">
        <CrRow label="6 months" value={cr6mo} range={range} />
        <CrRow label="12 months" value={cr12mo} range={range} />

        {trend && trendLabel && (
          <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5">
            <span className={`text-lg font-bold ${trend.color}`}>{trend.icon}</span>
            <div>
              <p className={`text-sm font-medium ${trend.color}`}>{trendLabel}</p>
              <p className="text-xs text-gray-400">Donor creatinine trajectory (admission → peak → terminal)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
