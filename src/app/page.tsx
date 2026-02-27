'use client';

import { useState } from 'react';
import {
  DonorInput,
  RecipientInput,
  CandidateRecipient,
  CandidateMatchResult,
  PredictionResult,
} from '@/types';
import {
  DEFAULT_DONOR,
  DEFAULT_RECIPIENT,
  DEFAULT_CANDIDATES,
  ADDITIONAL_FACTORS_CLEARED,
  getMockPrediction,
  rankCandidates,
  hasRecipientFactors,
} from '@/data/mock';
import DonorForm from '@/components/DonorForm';
import SurvivalHero from '@/components/SurvivalHero';
import DeclineStats from '@/components/DeclineStats';
import { SimilarKidneysSummary, SimilarKidneysTable } from '@/components/SimilarKidneys';
import ShapWaterfall from '@/components/ShapWaterfall';
import CandidateMatching from '@/components/CandidateMatching';

// ---------------------------------------------------------------------------
// Prediction badge
// ---------------------------------------------------------------------------

function PredictionBadge({ confidence }: { confidence: PredictionResult['prediction_confidence'] }) {
  const isPersonalized = confidence === 'personalized';
  const isEnhanced = confidence === 'enhanced';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
      isPersonalized
        ? 'bg-blue-50 text-blue-700 border border-blue-200'
        : isEnhanced
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'bg-gray-50 text-gray-600 border border-gray-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        isPersonalized ? 'bg-blue-500' : isEnhanced ? 'bg-emerald-500' : 'bg-gray-400'
      }`} />
      {isPersonalized
        ? 'Personalized prediction'
        : isEnhanced
        ? 'Enhanced prediction'
        : 'Basic prediction — KDPI factors only'}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Analysis text box
// ---------------------------------------------------------------------------

function AnalysisText({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Analysis</p>
      <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------

export default function Home() {
  const [donor, setDonor] = useState<DonorInput>(DEFAULT_DONOR);
  const [additionalOpen, setAdditionalOpen] = useState(false);

  const [recipient, setRecipient] = useState<RecipientInput>(DEFAULT_RECIPIENT);
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [recipientMode, setRecipientMode] = useState<'single' | 'compare'>('single');
  const [candidates, setCandidates] = useState<CandidateRecipient[]>(DEFAULT_CANDIDATES);

  const [evalId, setEvalId] = useState(0);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [candidateResults, setCandidateResults] = useState<CandidateMatchResult[]>([]);
  const [selectedCandidateIdx, setSelectedCandidateIdx] = useState(0);

  // ── Toggle handlers — clear fields on collapse ─────────────────────────

  const handleAdditionalToggle = () => {
    const opening = !additionalOpen;
    setAdditionalOpen(opening);
    if (!opening) {
      setDonor((prev) => ({ ...prev, ...ADDITIONAL_FACTORS_CLEARED }));
    }
  };

  const handleRecipientToggle = () => {
    const opening = !recipientOpen;
    setRecipientOpen(opening);
    if (!opening) {
      setRecipient(DEFAULT_RECIPIENT);
      setCandidates(DEFAULT_CANDIDATES);
    }
  };

  // ── Evaluate ───────────────────────────────────────────────────────────

  const handleEvaluate = () => {
    const newEvalId = evalId + 1;
    setEvalId(newEvalId);
    setSelectedCandidateIdx(0);

    const isCompare = recipientOpen && recipientMode === 'compare' && candidates.length >= 2;
    const isSingle = recipientOpen && recipientMode === 'single';

    if (isCompare) {
      const ranked = rankCandidates(donor, candidates);
      setCandidateResults(ranked);
      setResult(ranked[0]?.prediction ?? null);
    } else {
      const activeRecipient = isSingle && hasRecipientFactors(recipient) ? recipient : null;
      setResult(getMockPrediction(donor, activeRecipient));
      setCandidateResults([]);
    }
  };

  const handleSelectCandidate = (idx: number) => {
    setSelectedCandidateIdx(idx);
    setResult(candidateResults[idx]?.prediction ?? null);
  };

  const isCompareMode = recipientOpen && recipientMode === 'compare' && candidateResults.length > 0;

  return (
    <main className="min-h-screen py-10 px-4 md:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Donor Kidney Evaluation
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          AI-powered graft survival prediction &mdash; augmenting clinical judgment with data-driven insight
        </p>
      </header>

      {/* Form (sections 1–3 + submit) */}
      <DonorForm
        donor={donor}
        onChange={setDonor}
        additionalOpen={additionalOpen}
        onAdditionalToggle={handleAdditionalToggle}
        recipient={recipient}
        onRecipientChange={setRecipient}
        recipientOpen={recipientOpen}
        onRecipientToggle={handleRecipientToggle}
        recipientMode={recipientMode}
        onRecipientModeChange={setRecipientMode}
        candidates={candidates}
        onCandidatesChange={setCandidates}
        onSubmit={handleEvaluate}
      />

      {/* Results — key={evalId} forces re-animation on every evaluate click */}
      {result && (
        <div key={evalId} className="mt-8 space-y-6 animate-in fade-in duration-300">

          {/* 5. Prediction badge */}
          <div className="flex items-center gap-2">
            <PredictionBadge confidence={result.prediction_confidence} />
          </div>

          {/* 6a. Candidate Matching (compare mode) */}
          {isCompareMode && (
            <CandidateMatching
              results={candidateResults}
              selectedIdx={selectedCandidateIdx}
              onSelect={handleSelectCandidate}
            />
          )}

          {/* 6b. Prediction cards (single/no-recipient mode) */}
          {!isCompareMode && <SurvivalHero result={result} />}

          {/* 7. Analysis text */}
          <AnalysisText text={result.divergence_explanation} />

          {/* 8. If You Decline */}
          <DeclineStats stats={result.decline_stats} />

          {/* 9. Similar kidneys summary */}
          <SimilarKidneysSummary kidneys={result.similar_kidneys} />

          {/* 10. SHAP waterfall */}
          <ShapWaterfall
            shapValues={result.shap_values}
            basePrediction={0.92}
            finalPrediction={result.predicted_1yr_survival}
          />

          {/* 11. Similar kidneys detail table */}
          <SimilarKidneysTable kidneys={result.similar_kidneys} />
        </div>
      )}

      {/* 12. Disclaimer */}
      <footer className="mt-12 border-t border-gray-200 pt-6 pb-8">
        <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
          This tool provides supplementary information only. Clinical judgment should guide all
          organ acceptance decisions. Predictions are based on historical outcome data and do not
          account for all clinical factors. Not intended as a medical device. For research and
          clinical decision support purposes only.
        </p>
      </footer>
    </main>
  );
}
