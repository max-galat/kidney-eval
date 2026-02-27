import { ShapValue } from '@/types';

const MAX_BAR_WIDTH = 160; // px

export default function ShapWaterfall({
  shapValues,
  basePrediction,
  finalPrediction,
}: {
  shapValues: ShapValue[];
  basePrediction: number;
  finalPrediction: number;
}) {
  const maxAbsImpact = Math.max(...shapValues.map((s) => Math.abs(s.impact)), 0.01);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Why This Prediction
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">SHAP feature importance — what pushed the score up or down</p>
      </div>

      <div className="px-6 py-5 space-y-1">
        {/* Base */}
        <div className="flex items-center gap-3 text-sm pb-2 border-b border-gray-100 mb-2">
          <span className="w-44 text-gray-500 font-medium">Base prediction</span>
          <span className="font-mono font-semibold text-gray-700">{Math.round(basePrediction * 100)}%</span>
        </div>

        {/* Factors */}
        {shapValues.map((s) => {
          const pct = Math.abs(s.impact) / maxAbsImpact;
          const barW = Math.max(4, pct * MAX_BAR_WIDTH);
          const isPositive = s.impact > 0;

          return (
            <div key={s.feature} className="flex items-center gap-3 text-sm py-1">
              <span className="w-44 text-gray-600 truncate" title={s.label}>
                {s.label}
                <span className="text-gray-400 ml-1 text-xs">({String(s.value)})</span>
              </span>

              <div className="flex-1 flex items-center gap-2">
                <div className="flex items-center" style={{ width: MAX_BAR_WIDTH }}>
                  {isPositive ? (
                    <div
                      className="h-5 rounded-r bg-emerald-400/70"
                      style={{ width: barW }}
                    />
                  ) : (
                    <div className="flex justify-end w-full">
                      <div
                        className="h-5 rounded-l bg-red-400/70"
                        style={{ width: barW }}
                      />
                    </div>
                  )}
                </div>
                <span className={`font-mono text-xs font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}{Math.round(s.impact * 100)}%
                </span>
              </div>
            </div>
          );
        })}

        {/* Final */}
        <div className="flex items-center gap-3 text-sm pt-2 border-t border-gray-200 mt-2">
          <span className="w-44 text-gray-900 font-semibold">Final prediction</span>
          <span className="font-mono font-bold text-gray-900 text-base">{Math.round(finalPrediction * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
