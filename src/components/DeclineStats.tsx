import { DeclineStats as DeclineStatsType } from '@/types';

interface Props {
  stats: DeclineStatsType;
  patientGoal?: 'dialysis-asap' | 'longevity' | 'balance';
}

export default function DeclineStats({ stats, patientGoal }: Props) {
  // Medium quality (longer wait) = costly to decline — amber
  // Low/very low quality (shorter wait, abundant supply) = lower risk — gray
  const isCostly = stats.median_wait_months >= 7;
  const borderColor = isCostly ? 'border-amber-200' : 'border-gray-200';
  const bgColor = isCostly ? 'bg-amber-50/50' : 'bg-gray-50';
  const dividerColor = isCostly ? 'border-amber-100' : 'border-gray-100';

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} shadow-sm`}>
      <div className={`px-6 py-4 border-b ${dividerColor}`}>
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Should You Wait for a Better Offer?
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          If you pass on this kidney, here&apos;s what the data suggests for this patient&apos;s waitlist trajectory:
        </p>
        {/* Patient goal: dialysis-asap warning */}
        {patientGoal === 'dialysis-asap' && (
          <p className="mt-2 text-xs text-amber-800 bg-amber-100 border border-amber-300 rounded-lg px-3 py-2 leading-relaxed">
            This patient prioritizes transplant speed. Declining extends dialysis exposure by an estimated{' '}
            <span className="font-semibold">{stats.median_wait_months} months</span>.
          </p>
        )}
      </div>

      {/* 2×2 grid on mobile, 4-col on sm+ (Fix 1) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 py-5">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {stats.median_wait_months} <span className="text-base font-medium text-gray-500">mo</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">Median wait</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.pct_better_within_6mo}%</p>
          <p className="text-xs text-gray-500 mt-1">P(better in 6mo)</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.pct_still_waiting_12mo}%</p>
          <p className="text-xs text-gray-500 mt-1">Still waiting 12mo</p>
        </div>
        <div className="text-center">
          {stats.annual_waitlist_mortality !== null ? (
            <>
              <p className={`text-2xl font-bold ${stats.annual_waitlist_mortality > 8 ? 'text-red-600' : 'text-gray-900'}`}>
                {stats.annual_waitlist_mortality}%
                {stats.is_population_average_mortality && <span className="text-base font-normal text-gray-400">*</span>}
              </p>
              <p className="text-xs text-gray-500 mt-1">Waitlist mortality</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900">~5%<span className="text-base font-normal text-gray-400">*</span></p>
              <p className="text-xs text-gray-500 mt-1">Waitlist mortality</p>
            </>
          )}
        </div>
      </div>

      <div className={`px-6 pb-4 border-t ${dividerColor} pt-3 space-y-1`}>
        {(stats.is_population_average_mortality || stats.annual_waitlist_mortality === null) && (
          <p className="text-xs text-gray-400 italic">
            * Population average (~5%). Enter recipient details for a personalized estimate.
          </p>
        )}
        <p className="text-xs text-gray-400 leading-relaxed">
          DonorNet predicts time to your next offer. This tool predicts graft outcome for this specific donor-recipient pair.
        </p>
      </div>
    </div>
  );
}
