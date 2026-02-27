'use client';

import { CandidateMatchResult } from '@/types';

function Stars({ count }: { count: number }) {
  return (
    <span className="text-amber-400 tracking-tight">
      {'★'.repeat(count)}
      <span className="text-gray-200">{'★'.repeat(5 - count)}</span>
    </span>
  );
}

interface Props {
  results: CandidateMatchResult[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
}

export default function CandidateMatching({ results, selectedIdx, onSelect }: Props) {
  if (results.length === 0) return null;

  const isTie =
    results.length >= 2 &&
    results[0].match_score - results[1].match_score <= 2;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Candidate Matching
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">Ranked by donor-recipient compatibility</p>
        {isTie && (
          <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
            Two candidates are closely matched. Clinical judgment should guide selection.
          </p>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {results.map((r, i) => {
          const isRecommended = i === 0 && !isTie;
          const isSelected = i === selectedIdx;
          const predPct = Math.round(r.prediction.predicted_1yr_survival * 100);
          const { decline_stats } = r.prediction;
          const label = r.candidate.label || `Candidate ${i + 1}`;

          const detailParts: string[] = [];
          if (r.candidate.recipient_age !== null) detailParts.push(`${r.candidate.recipient_age} yrs`);
          if (r.candidate.recipient_dialysis_months !== null && r.candidate.recipient_dialysis_months > 0)
            detailParts.push(`${r.candidate.recipient_dialysis_months} mo dialysis`);
          if (r.candidate.recipient_diabetes) detailParts.push('diabetic');
          if (r.candidate.recipient_prior_transplant) detailParts.push('prior tx');

          return (
            <div
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(i)}
              onKeyDown={(e) => e.key === 'Enter' && onSelect(i)}
              className={`px-6 py-5 cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-50/40' : 'hover:bg-gray-50'
              } ${isRecommended ? 'ring-1 ring-inset ring-blue-300' : ''}`}
            >
              {isRecommended && (
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">
                  ★ Recommended
                </p>
              )}

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {label}
                    {detailParts.length > 0 && (
                      <span className="font-normal text-gray-500 ml-1.5">({detailParts.join(', ')})</span>
                    )}
                  </p>

                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-700">
                      Predicted 1-yr survival: <span className="font-semibold">{predPct}%</span>
                    </span>
                    <span className="text-sm">
                      Match: <Stars count={r.stars} />
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.recommendation_text}</p>

                  <p className="text-xs text-gray-400 mt-2">
                    {decline_stats.high_demand
                      ? `Acceptance rate: ~${decline_stats.acceptance_rate ?? 90}% nationally. Declining is uncommon.`
                      : `If declines: ${decline_stats.median_wait_months} mo median wait · ${decline_stats.pct_still_waiting_12mo}% still waiting at 12 mo`}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
        <p className="text-xs text-gray-400">
          Detailed analysis shown for {selectedIdx === 0 && !isTie ? 'recommended' : 'selected'} candidate.
          Select any candidate above to view their full analysis below.
        </p>
      </div>
    </div>
  );
}
