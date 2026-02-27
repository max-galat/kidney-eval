'use client';

import { useState } from 'react';
import { DonorInput, RecipientInput, PredictionResult } from '@/types';
import { DEFAULT_DONOR, DEFAULT_RECIPIENT, getMockPrediction } from '@/data/mock';
import DonorForm from '@/components/DonorForm';
import SurvivalHero from '@/components/SurvivalHero';
import DeclineStats from '@/components/DeclineStats';
import { SimilarKidneysSummary, SimilarKidneysTable } from '@/components/SimilarKidneys';
import ShapWaterfall from '@/components/ShapWaterfall';

export default function Home() {
  const [donor, setDonor] = useState<DonorInput>(DEFAULT_DONOR);
  const [recipient, setRecipient] = useState<RecipientInput>(DEFAULT_RECIPIENT);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const handleEvaluate = () => {
    setResult(getMockPrediction(donor, recipient));
  };

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

      {/* Form */}
      <DonorForm
        donor={donor}
        onChange={setDonor}
        recipient={recipient}
        onRecipientChange={setRecipient}
        onSubmit={handleEvaluate}
      />

      {/* Results — new section order per Daniel's spec */}
      {result && (
        <div className="mt-8 space-y-6 animate-in fade-in duration-300">
          {/* 1. Prediction cards (Our Model vs KDPI) */}
          <SurvivalHero result={result} />

          {/* 2. "If you decline" section */}
          <DeclineStats stats={result.decline_stats} />

          {/* 3. Similar kidneys summary stats */}
          <SimilarKidneysSummary kidneys={result.similar_kidneys} />

          {/* 4. SHAP waterfall */}
          <ShapWaterfall
            shapValues={result.shap_values}
            basePrediction={0.92}
            finalPrediction={result.predicted_1yr_survival}
          />

          {/* 5. Similar kidneys detail table */}
          <SimilarKidneysTable kidneys={result.similar_kidneys} />
        </div>
      )}

      {/* Disclaimer */}
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
