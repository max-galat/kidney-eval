import { DeclineStats as DeclineStatsType } from '@/types';

export default function DeclineStats({ stats }: { stats: DeclineStatsType }) {
  // Excellent quality — rarely declined, hide stats
  if (stats.high_demand) {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 shadow-sm px-6 py-5">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
          If You Decline a Kidney Like This
        </h2>
        <p className="text-sm text-blue-700">
          Kidneys in this quality range are rarely declined. Most centers accept immediately.
        </p>
      </div>
    );
  }

  // Medium quality (longer wait) = costly to decline — amber
  // Low/very low quality (shorter wait, abundant supply) = lower risk — gray
  const isCostlyToDecline = stats.median_wait_months >= 7;
  const borderColor = isCostlyToDecline ? 'border-amber-200' : 'border-gray-200';
  const bgColor = isCostlyToDecline ? 'bg-amber-50/50' : 'bg-gray-50';
  const dividerColor = isCostlyToDecline ? 'border-amber-100' : 'border-gray-100';
  const subtext = isCostlyToDecline
    ? 'Kidneys in this range have a meaningful wait — declining carries real cost.'
    : 'Kidneys in this range are in abundant supply. Comparable alternatives are available.';

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
