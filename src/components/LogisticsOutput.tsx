interface Props {
  projectedCIT: number;
  effectiveCIT: number | null;
  riskText: string;
  usesProjected: boolean;
}

export default function LogisticsOutput({ projectedCIT, effectiveCIT, riskText, usesProjected }: Props) {
  const isHigh = riskText.startsWith('High') || riskText.startsWith('Elevated');

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Transport Assessment
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">Projected cold ischemia time &amp; logistics risk</p>
      </div>
      <div className="px-6 py-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{projectedCIT}h</p>
            <p className="text-xs text-gray-500 mt-1">Projected Total CIT</p>
          </div>
          {effectiveCIT !== null && (
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-600">{effectiveCIT}h</p>
              <p className="text-xs text-gray-500 mt-1">Effective CIT (w/ pump)</p>
            </div>
          )}
        </div>

        <div className={`rounded-md px-4 py-2.5 text-xs border ${
          isHigh
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-gray-50 border-gray-100 text-gray-600'
        }`}>
          {riskText}
        </div>

        {usesProjected && (
          <p className="text-xs text-gray-400 italic">
            Projected CIT includes additional transport time and time-to-OR estimates.
            All downstream predictions use this projected value.
          </p>
        )}

        {effectiveCIT !== null && (
          <p className="text-xs text-gray-400 italic">
            Second pump reduces effective CIT by offsetting ~60% of pump hours (capped at 40% total reduction).
          </p>
        )}
      </div>
    </div>
  );
}
