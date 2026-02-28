'use client';

import { useState } from 'react';
import { CandidateMatchResult } from '@/types';
import { getNonUseRisk } from '@/data/mock';

// Fallback justifications by star count (used when dynamic justification is unavailable)
const STAR_JUSTIFICATION_FALLBACK: Record<number, string> = {
  5: 'Excellent match — strong alignment across survival, age matching, and dialysis benefit',
  4: 'Strong match — donor age and recipient dialysis exposure suggest high net benefit',
  3: 'Moderate match — consider whether waiting for a better-matched kidney is feasible',
  2: 'Weak match — predicted graft lifespan underserves this recipient\'s life expectancy',
  1: 'Poor match — significant concerns about graft quality relative to this recipient\'s needs',
};

const NON_USE_COLORS = {
  green: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  yellow: { badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  orange: { badge: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  red: { badge: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
};

function Stars({ count, justification }: { count: number; justification?: string }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const displayText = justification || STAR_JUSTIFICATION_FALLBACK[count];

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 font-medium">Donor-Recipient Match Quality</span>
        <div
          className="relative inline-block"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <span className="text-amber-400 tracking-tight cursor-help">
            {'★'.repeat(count)}
            <span className="text-gray-200">{'★'.repeat(5 - count)}</span>
          </span>
          {showTooltip && (
            <div className="absolute z-20 bottom-full left-0 mb-2 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-xl text-xs text-gray-600 leading-relaxed">
              Composite score based on predicted graft survival, recipient age-to-donor age matching,
              dialysis time benefit, and EPTS-KDPI alignment. Higher = greater net transplant benefit
              for this specific patient.
            </div>
          )}
        </div>
      </div>
      {displayText && (
        <p className="text-xs text-gray-400 italic">{displayText}</p>
      )}
    </div>
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

          const nonUse = getNonUseRisk(r.prediction.kdpi_score, r.prediction.donor_dcd, r.prediction.donor_age);
          const nuCls = NON_USE_COLORS[nonUse.color];

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

                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-sm text-gray-700">
                      Predicted 1-yr survival:{' '}
                      <span className="font-semibold">{predPct}%</span>
                      <span className="text-xs text-gray-400 ml-1">(±{r.prediction.model_ci}%)</span>
                    </span>
                    {/* Non-use risk badge */}
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${nuCls.badge}`}>
                      <span className={`w-1 h-1 rounded-full ${nuCls.dot}`} />
                      {nonUse.label}
                    </span>
                  </div>

                  <div className="mt-2">
                    <Stars count={r.stars} justification={r.star_justification} />
                  </div>

                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.recommendation_text}</p>

                  {/* Personalized decline stats */}
                  <p className="text-xs text-gray-400 mt-2">
                    {decline_stats.high_demand
                      ? `Acceptance rate: ~${decline_stats.acceptance_rate ?? 90}% nationally. Declining is uncommon.`
                      : [
                          `If declined: ${decline_stats.median_wait_months} mo median wait`,
                          `${decline_stats.pct_still_waiting_12mo}% still waiting at 12 mo`,
                          decline_stats.annual_waitlist_mortality !== null
                            ? `${decline_stats.annual_waitlist_mortality}% annual mortality`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                    {decline_stats.annual_waitlist_mortality !== null && decline_stats.annual_waitlist_mortality > 8 && (
                      <span className="ml-1 text-red-500 font-medium">↑ elevated</span>
                    )}
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
