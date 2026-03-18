interface Props {
  risk: number;
  ci: number;
}

const colorForPNF = (risk: number) => {
  if (risk < 3) return { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
  if (risk < 6) return { bar: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' };
  if (risk < 10) return { bar: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' };
  return { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
};

export default function PNFCard({ risk, ci }: Props) {
  const c = colorForPNF(risk);
  const barWidth = Math.min(100, (risk / 25) * 100);
  const avgPosition = (3.5 / 25) * 100;

  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5 text-center`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">PNF Risk</p>
      <p className={`text-4xl font-bold ${c.text}`}>{risk}%</p>
      <p className="text-xs text-gray-500 mt-1">
        ±{ci}% ({Math.max(0, Math.round((risk - ci) * 10) / 10)}%–{Math.round((risk + ci) * 10) / 10}%)
      </p>

      {/* Color bar */}
      <div className="relative h-2.5 w-full rounded-full bg-gray-200 mt-3">
        <div className={`h-2.5 rounded-full ${c.bar} transition-all`} style={{ width: `${barWidth}%` }} />
        {/* Population average line */}
        <div
          className="absolute top-0 h-2.5 w-0.5 bg-gray-600"
          style={{ left: `${avgPosition}%` }}
          title="Population average (3.5%)"
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>0%</span>
        <span className="text-gray-500">▲ avg 3.5%</span>
        <span>25%</span>
      </div>

      <p className="text-xs text-gray-400 mt-2">Primary Nonfunction — graft never functions</p>
    </div>
  );
}
