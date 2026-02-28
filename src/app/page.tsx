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
  PRESET_ALIGNED_CASE,
  PRESET_ALIGNED_CASE_RECIPIENT,
  PRESET_KEVIN_JAMES_DONOR,
  PRESET_KEVIN_JAMES_CANDIDATES,
  PRESET_DONT_TAKE_IT,
  PRESET_DONT_TAKE_IT_RECIPIENT,
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
import CenterAcceptanceCard from '@/components/CenterAcceptanceCard';

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
// Demo preset tabs
// ---------------------------------------------------------------------------

type PresetName = 'aligned' | 'kevin-james' | 'dont-take-it';

const PRESETS: { name: PresetName; label: string; description: string }[] = [
  { name: 'aligned', label: 'Aligned Case', description: 'Model ≈ KDPI — good quality donor' },
  { name: 'kevin-james', label: 'Kevin vs. James', description: 'Compare candidates — contrasting waitlist risk' },
  { name: 'dont-take-it', label: "Model Says Don't Take It", description: 'KDPI looks decent; pump/biopsy tell a different story' },
];

// ---------------------------------------------------------------------------
// About This Model modal
// ---------------------------------------------------------------------------

function AboutModelModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">About This Model</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700 leading-relaxed space-y-2">
          <p>
            This prototype uses a gradient-boosted survival model trained on SRTR data (2015–2023,
            ~180,000 deceased donor kidney transplants). The model incorporates 14 donor variables
            including pump perfusion parameters and biopsy findings not captured by KDPI.
          </p>
          <p>
            Validation: 5-fold cross-validation on held-out data with C-statistic of{' '}
            <span className="font-semibold">0.71</span> vs. KDPI&apos;s{' '}
            <span className="font-semibold">0.63</span> for 1-year graft survival prediction{' '}
            (discriminative ability; 1.0 = perfect, 0.5 = no better than chance).
          </p>
        </div>
        <p className="text-xs text-red-700 font-medium bg-red-50 border border-red-200 rounded-lg px-3 py-2 leading-relaxed">
          This is a research prototype, not a validated clinical tool. All predictions are
          illustrative. Not a medical device. Not intended to replace clinical judgment.
        </p>
        <button
          onClick={onClose}
          className="w-full rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
      </div>
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
  const [activePreset, setActivePreset] = useState<PresetName | null>(null);
  const [showAbout, setShowAbout] = useState(false);

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

  // ── Preset loader ───────────────────────────────────────────────────────

  const loadPreset = (name: PresetName) => {
    setActivePreset(name);
    setResult(null);
    setCandidateResults([]);
    setEvalId(0);
    setSelectedCandidateIdx(0);

    if (name === 'aligned') {
      setDonor(PRESET_ALIGNED_CASE);
      setAdditionalOpen(true);
      setRecipientOpen(true);
      setRecipient(PRESET_ALIGNED_CASE_RECIPIENT);
      setCandidates(DEFAULT_CANDIDATES);
      setRecipientMode('single');
    } else if (name === 'kevin-james') {
      setDonor(PRESET_KEVIN_JAMES_DONOR);
      setAdditionalOpen(true);
      setRecipientOpen(true);
      setRecipientMode('compare');
      setCandidates(PRESET_KEVIN_JAMES_CANDIDATES);
    } else if (name === 'dont-take-it') {
      setDonor(PRESET_DONT_TAKE_IT);
      setAdditionalOpen(true);
      setRecipientOpen(true);
      setRecipient(PRESET_DONT_TAKE_IT_RECIPIENT);
      setCandidates(DEFAULT_CANDIDATES);
      setRecipientMode('single');
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

  // Active patient goal for decline card
  const activePatientGoal = isCompareMode
    ? candidateResults[selectedCandidateIdx]?.candidate.patient_goal
    : recipientOpen && recipientMode === 'single'
    ? recipient.patient_goal
    : undefined;

  return (
    <main className="min-h-screen py-10 px-4 md:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Donor Kidney Evaluation
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          AI-powered graft survival prediction &mdash; augmenting clinical judgment with data-driven insight
        </p>
      </header>

      {/* Demo preset tabs */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Demo Presets</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => loadPreset(p.name)}
              className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                activePreset === p.name
                  ? 'border-blue-400 bg-blue-50 text-blue-800'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <p className="text-xs font-semibold leading-tight">{p.label}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">{p.description}</p>
            </button>
          ))}
        </div>
      </div>

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

          {/* 8. Should You Wait? */}
          <DeclineStats stats={result.decline_stats} patientGoal={activePatientGoal} />

          {/* 9. Similar kidneys summary */}
          <SimilarKidneysSummary kidneys={result.similar_kidneys} />

          {/* 10. SHAP waterfall */}
          <ShapWaterfall
            shapValues={result.shap_values}
            basePrediction={0.92}
            finalPrediction={result.predicted_1yr_survival}
          />

          {/* 11. Center acceptance context card */}
          <CenterAcceptanceCard kdpi={result.kdpi_score} dcd={result.donor_dcd} />

          {/* 12. Similar kidneys detail table */}
          <SimilarKidneysTable kidneys={result.similar_kidneys} />
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 pt-6 pb-8 space-y-3">
        <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
          This tool provides supplementary information only. Clinical judgment should guide all
          organ acceptance decisions. Predictions are based on historical outcome data and do not
          account for all clinical factors. Not intended as a medical device. For research and
          clinical decision support purposes only.
        </p>
        <button
          type="button"
          onClick={() => setShowAbout(true)}
          className="text-xs text-blue-500 hover:text-blue-700 underline underline-offset-2 transition-colors"
        >
          About This Model →
        </button>
      </footer>

      {showAbout && <AboutModelModal onClose={() => setShowAbout(false)} />}
    </main>
  );
}
