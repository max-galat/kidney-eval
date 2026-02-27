import { DeclineStats as DeclineStatsType } from '@/types';

export default function DeclineStats({ stats }: { stats: DeclineStatsType }) {
  if (stats.high_demand) {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 shadow-sm px-6 py-5">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
          If You Decline a Kidney Like This
        </h2>
        <p className="text-sm text-blue-700">
          Kidneys in this quality range are in high demand. Most patients accept.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 shadow-sm">
      <div className="px-6 py-4 border-b border-amber-100">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          If You Decline a Kidney Like This
        </h2>
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
