import { DeclineStats as DeclineStatsType } from '@/types';

export default function DeclineStats({ stats }: { stats: DeclineStatsType }) {
  // Excellent quality — show acceptance likelihood, hide wait stats
  if (stats.high_demand) {
    const rate = stats.acceptance_rate ?? 92;
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 shadow-sm px-6 py-5">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-1">
          Acceptance Likelihood
        </h2>
        <p className="text-sm text-emerald-800">
          Kidneys in this quality range have a <span className="font-semibold">{rate}%</span> national
          acceptance rate. Declining is uncommon.
        </p>
      </div>
    );
  }

  // Medium quality (longer wait) = costly to decline — amber
  // Low/very low quality (shorter wait, abundant supply) = lower risk — gray
  const isCostly = stats.median_wait_months >= 7;
  const borderColor = isCostly ? 'border-amber-200' : 'border-gray-200';
  const bgColor = isCostly ? 'bg-amber-50/50' : 'bg-gray-50';
  const dividerColor = isCostly ? 'border-amber-100' : 'border-gray-100';
  const subtext = isCostly
    ? 'Kidneys in this range have a meaningful wait — declining carries real cost.'
    : 'Similar quality kidneys are frequently available. Declining has lower opportunity cost.';

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} shadow-sm`}>
      <div className={`px-6 py-4 border-b ${dividerColor}`}>
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          If You Decline a Kidney Like This
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">{subtext}</p>
      </div>
      <div className="grid grid-cols-3 gap-4 px-6 py-5">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {stats.median_wait_months} <span className="text-base font-medium text-gray-500">mo</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">Median wait to next transplant</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.pct_better_within_6mo}%</p>
          <p className="text-xs text-gray-500 mt-1">Got a better kidney within 6 months</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.pct_still_waiting_12mo}%</p>
          <p className="text-xs text-gray-500 mt-1">Still waiting at 12 months</p>
        </div>
      </div>
    </div>
  );
}
